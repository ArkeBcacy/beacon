import readYaml from '#cli/fs/readYaml.js';
import schemaDirectory from '../content-types/schemaDirectory.js';
import ContentstackError from '#cli/cs/api/ContentstackError.js';
import type Ctx from '../ctx/Ctx.js';
import { MutableTransferResults } from '../xfer/TransferResults.js';
import getUi from '../lib/SchemaUi.js';
import isRecord from '#cli/util/isRecord.js';

export default async function toContentstack(ctx: Ctx) {
	const directory = schemaDirectory();
	const path = `${directory}/labels.yaml`;

	const ui = getUi();

	let data: unknown;
	try {
		data = await readYaml(path);
	} catch {
		ui.info(`Labels: no file at ${path}, skipping`);
		return new MutableTransferResults();
	}

	const labels =
		isRecord(data) && Array.isArray(data.labels)
			? data.labels
			: Array.isArray(data)
				? (data as unknown[])
				: [];

	ui.info(`Labels: read ${labels.length} label(s) from ${path}`);

	const results = new MutableTransferResults();

	for (const labelRaw of labels) {
		if (!isRecord(labelRaw)) continue;
		// keep per-label logic in helper to reduce complexity of this function

		await handleLabel(ctx, labelRaw, results);
	}

	return results;
}

function canonicalize(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(canonicalize);
	if (isRecord(value)) {
		const obj = value;
		const out: Record<string, unknown> = {};
		for (const key of Object.keys(obj).sort()) {
			if (key === 'uid' || key === 'created_at' || key === 'updated_at')
				continue;
			out[key] = canonicalize(obj[key]);
		}
		return out;
	}
	return value;
}

async function updateIfNecessary(
	ctx: Ctx,
	uid: string,
	localLabel: Record<string, unknown>,
	results: MutableTransferResults,
) {
	const remoteRes = (await ctx.cs.client.GET(`/v3/labels/${uid}`)) as unknown;
	const remoteData = (remoteRes as { data?: unknown } | undefined)?.data;

	if (!isRecord(remoteData) || !isRecord(remoteData.label)) {
		// If we can't parse remote data, err on the side of updating
		const res = (await ctx.cs.client.PUT(`/v3/labels/${uid}`, {
			body: { label: localLabel },
		})) as unknown;
		const putError = (res as { error?: unknown } | undefined)?.error;
		ContentstackError.throwIfError(putError, `Failed to update label: ${uid}`);
		results.updated.add(uid);
		return;
	}

	const remoteLabel = remoteData.label;
	let shouldUpdate = true;
	try {
		shouldUpdate =
			JSON.stringify(canonicalize(localLabel)) !==
			JSON.stringify(canonicalize(remoteLabel));
	} catch {
		shouldUpdate = true;
	}

	if (!shouldUpdate) return;

	const res = (await ctx.cs.client.PUT(`/v3/labels/${uid}`, {
		body: { label: localLabel },
	})) as unknown;
	const putError = (res as { error?: unknown } | undefined)?.error;
	ContentstackError.throwIfError(putError, `Failed to update label: ${uid}`);
	results.updated.add(uid);
}

async function createLabel(
	ctx: Ctx,
	localLabel: Record<string, unknown>,
	results: MutableTransferResults,
) {
	const res = (await ctx.cs.client.POST('/v3/labels', {
		body: { label: localLabel },
	})) as unknown;
	const postError = (res as { error?: unknown } | undefined)?.error;
	ContentstackError.throwIfError(postError, `Failed to create label`);
	const postData = (res as { data?: unknown } | undefined)?.data;
	let createdUid: string | null = null;
	if (isRecord(postData)) {
		const pd = postData;
		if (isRecord(pd.label)) {
			const labelObj = pd.label;
			if (typeof labelObj.uid === 'string') createdUid = labelObj.uid;
		}
		if (createdUid === null && typeof pd.uid === 'string') createdUid = pd.uid;
	}
	results.created.add(createdUid ?? '<created>');
}

async function handleLabel(
	ctx: Ctx,
	labelRaw: Record<string, unknown>,
	results: MutableTransferResults,
) {
	const uid = typeof labelRaw.uid === 'string' ? labelRaw.uid : '';

	if (uid.length) {
		await updateIfNecessary(ctx, uid, labelRaw, results);
		return;
	}

	await createLabel(ctx, labelRaw, results);
}
