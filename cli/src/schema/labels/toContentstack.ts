import readYaml from '#cli/fs/readYaml.js';
import type Ctx from '../ctx/Ctx.js';
import { MutableTransferResults } from '../xfer/TransferResults.js';
import getUi from '../lib/SchemaUi.js';
import isRecord from '#cli/util/isRecord.js';
import flatten from '#cli/dto/labels/flatten.js';
import { isNormalizedLabels } from '#cli/dto/labels/NormalizedLabels.js';
import type Label from '#cli/cs/labels/Label.js';
import getAllLabels from '#cli/cs/labels/getAllLabels.js';
import { createLabel, updateIfNecessary } from './lib/labelOperations.js';
import { resolve } from 'node:path';

/**
 * Sort labels to ensure parents are processed before children.
 * Labels without parents come first, then labels are sorted by dependency depth.
 */
function sortLabelsByDependency(labels: Label[]): Label[] {
	const labelsByUid = new Map<string, Label>();
	const sorted: Label[] = [];
	const processed = new Set<string>();

	// Build a map for quick lookup
	for (const label of labels) {
		if (isRecord(label) && typeof label.uid === 'string') {
			labelsByUid.set(label.uid, label as Label);
		}
	}

	// Recursive function to add a label and its dependencies
	function addLabel(label: Label) {
		const uid = typeof label.uid === 'string' ? label.uid : '';
		if (!uid || processed.has(uid)) return;

		// First, process parent if it exists in our label set
		const parentArray = label.parent;
		if (Array.isArray(parentArray) && parentArray.length > 0) {
			// Use destructuring to satisfy eslint prefer-destructuring rule
			const [parentValue] = parentArray as unknown as readonly [
				string,
				...string[],
			];
			if (labelsByUid.has(parentValue) && !processed.has(parentValue)) {
				const parentLabel = labelsByUid.get(parentValue);
				if (parentLabel) addLabel(parentLabel);
			}
		}

		// Now add this label
		sorted.push(label);
		processed.add(uid);
	}

	// Process all labels
	for (const label of labels) {
		if (isRecord(label)) {
			addLabel(label as Label);
		}
	}

	return sorted;
}

export default async function toContentstack(ctx: Ctx) {
	const ui = getUi();
	const path = resolve(ui.options.schema.schemaPath, 'labels.yaml');

	const data = await loadLabelsData(path, ui);
	if (!data) {
		return new MutableTransferResults();
	}

	const flatLabels = extractFlatLabels(data);
	ui.info(`Labels: read ${flatLabels.length} label(s) from ${path}`);

	const {
		localUidToName,
		nameToRemoteUid,
		remoteLabelsByName,
		remoteLabelsByUid,
	} = await prepareLabelMappings(ctx, flatLabels);

	const sortedLabels = sortLabelsByDependency(flatLabels);
	const results = new MutableTransferResults();

	for (const labelRaw of sortedLabels) {
		if (!isRecord(labelRaw)) continue;

		await handleLabel(
			ctx,
			labelRaw,
			remoteLabelsByUid,
			remoteLabelsByName,
			nameToRemoteUid,
			localUidToName,
			results,
		);
	}

	return results;
}

async function loadLabelsData(
	path: string,
	ui: ReturnType<typeof getUi>,
): Promise<unknown> {
	try {
		return await readYaml(path);
	} catch {
		ui.info(`Labels: no file at ${path}, skipping`);
		return undefined;
	}
}

function extractFlatLabels(data: unknown): Label[] {
	if (isNormalizedLabels(data)) {
		interface LabelWithChildren {
			children?: unknown;
		}
		const hasChildren = (data.labels as unknown as LabelWithChildren[]).some(
			(l) => 'children' in l && l.children !== undefined,
		);

		if (hasChildren) {
			return [...flatten(data.labels)];
		}
		return [...data.labels] as unknown as Label[];
	}

	if (isRecord(data) && Array.isArray(data.labels)) {
		return data.labels as Label[];
	}

	if (Array.isArray(data)) {
		return data as Label[];
	}

	return [];
}

async function prepareLabelMappings(ctx: Ctx, flatLabels: Label[]) {
	const remoteLabels = await getAllLabels(ctx.cs.client);
	const remoteLabelsByUid = new Map<string, Label>();
	const remoteLabelsByName = new Map<string, Label>();

	for (const label of remoteLabels) {
		remoteLabelsByUid.set(label.uid, label);
		remoteLabelsByName.set(label.name, label);
	}

	const nameToRemoteUid = new Map<string, string>();
	for (const [name, label] of remoteLabelsByName) {
		nameToRemoteUid.set(name, label.uid);
	}

	const localUidToName = new Map<string, string>();
	for (const label of flatLabels) {
		if (
			isRecord(label) &&
			typeof label.uid === 'string' &&
			typeof label.name === 'string'
		) {
			localUidToName.set(label.uid, label.name);
		}
	}

	return {
		localUidToName,
		nameToRemoteUid,
		remoteLabelsByName,
		remoteLabelsByUid,
	};
}

async function handleLabel(
	ctx: Ctx,
	labelRaw: Record<string, unknown>,
	remoteLabelsByUid: Map<string, Label>,
	remoteLabelsByName: Map<string, Label>,
	nameToRemoteUid: Map<string, string>,
	localUidToName: Map<string, string>,
	results: MutableTransferResults,
) {
	const uid = typeof labelRaw.uid === 'string' ? labelRaw.uid : '';
	const name = typeof labelRaw.name === 'string' ? labelRaw.name : '';

	const preparedLabel = translateParentReference(
		labelRaw,
		localUidToName,
		nameToRemoteUid,
	);

	// First try to find by UID (exact match from same stack)
	if (uid.length > 0 && remoteLabelsByUid.has(uid)) {
		const remoteLabel = remoteLabelsByUid.get(uid);
		await updateIfNecessary(ctx, uid, preparedLabel, remoteLabel, results);
		return;
	}

	// Then try to find by name (for cross-stack scenarios)
	if (name.length > 0 && remoteLabelsByName.has(name)) {
		const remoteLabel = remoteLabelsByName.get(name);
		if (!remoteLabel) {
			return;
		}
		await updateIfNecessary(
			ctx,
			remoteLabel.uid,
			preparedLabel,
			remoteLabel,
			results,
		);
		nameToRemoteUid.set(name, remoteLabel.uid);
		return;
	}

	// Label doesn't exist remotely, create it
	const createdUid = await createLabel(ctx, preparedLabel, results);

	if (createdUid && name) {
		nameToRemoteUid.set(name, createdUid);
	}
}

function translateParentReference(
	labelRaw: Record<string, unknown>,
	localUidToName: Map<string, string>,
	nameToRemoteUid: Map<string, string>,
): Record<string, unknown> {
	const parentField = labelRaw.parent;
	if (!Array.isArray(parentField) || parentField.length === 0) {
		return { ...labelRaw };
	}

	// TypeScript knows parentField is an array, but we need to type it properly
	const [firstElement] = parentField as unknown[];
	if (typeof firstElement !== 'string') {
		return { ...labelRaw };
	}
	const firstParent: string = firstElement;

	const parentName = localUidToName.get(firstParent);

	if (!parentName || !nameToRemoteUid.has(parentName)) {
		return { ...labelRaw };
	}

	const remoteParentUid = nameToRemoteUid.get(parentName);
	if (!remoteParentUid) {
		return { ...labelRaw };
	}

	return {
		...labelRaw,
		parent: [remoteParentUid],
	};
}
