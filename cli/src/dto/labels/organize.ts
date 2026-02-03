import type Label from '#cli/cs/labels/Label.js';
import type { LabelTreeNode } from './NormalizedLabels.js';

// Labels have a tree structure defined by uid/parent_uid.
//
// The API returns a flat array that includes uid/parent_uid, but
// leaves it up to the client to reconstruct the tree.
//
// We organize labels into a tree structure for serialization.
//
// The sort order amongst siblings is maintained equal to the order
// as it appears in the array.
export default function organize(
	labels: readonly Label[],
): readonly LabelTreeNode[] {
	const byUid = new Map<string, MutableNode>();
	const topLevel: MutableNode[] = [];

	for (const label of labels) {
		const { parent_uid, ...labelWithoutParent } = label;
		// Preserve all fields except parent_uid (which is represented by the tree structure)
		byUid.set(label.uid, {
			...labelWithoutParent,
			name: label.name,
			uid: label.uid,
		});
	}

	for (const { uid, parent_uid } of labels) {
		const label = byUid.get(uid);
		if (!label) {
			throw new Error(`Label ${uid} not found`);
		}

		if (!parent_uid) {
			topLevel.push(label);
			continue;
		}

		const parent = byUid.get(parent_uid);
		if (!parent) {
			const msg = `Orphaned label ${uid} with parent ${parent_uid}`;
			throw new Error(msg);
		}

		(parent.children ??= []).push(label);
	}

	return topLevel;
}

interface MutableNode {
	readonly uid: string;
	readonly name: string;
	children?: MutableNode[];
}
