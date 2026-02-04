import ContentstackError from '#cli/cs/api/ContentstackError.js';
import isRecord from '#cli/util/isRecord.js';
import type Ctx from '../../ctx/Ctx.js';
import type { MutableTransferResults } from '../../xfer/TransferResults.js';
import type Label from '#cli/cs/labels/Label.js';
import { canonicalize, prepareLabel } from './labelHelpers.js';

export async function updateIfNecessary(
	ctx: Ctx,
	uid: string,
	localLabel: Record<string, unknown>,
	remoteLabel: Label | undefined,
	results: MutableTransferResults,
) {
	if (!remoteLabel) {
		// If we don't have remote data, err on the side of updating
		const res = (await ctx.cs.client.PUT('/v3/labels/{label_uid}', {
			body: { label: prepareLabel(localLabel) },
			params: { path: { label_uid: uid } },
		})) as unknown;
		const putError = (res as { error?: unknown } | undefined)?.error;
		ContentstackError.throwIfError(putError, `Failed to update label: ${uid}`);
		results.updated.add(uid);
		return;
	}

	let shouldUpdate = true;
	try {
		shouldUpdate =
			JSON.stringify(canonicalize(localLabel)) !==
			JSON.stringify(canonicalize(remoteLabel));
	} catch {
		shouldUpdate = true;
	}

	if (!shouldUpdate) return;

	const res = (await ctx.cs.client.PUT('/v3/labels/{label_uid}', {
		body: { label: prepareLabel(localLabel) },
		params: { path: { label_uid: uid } },
	})) as unknown;
	const putError = (res as { error?: unknown } | undefined)?.error;
	ContentstackError.throwIfError(putError, `Failed to update label: ${uid}`);
	results.updated.add(uid);
}

export async function createLabel(
	ctx: Ctx,
	localLabel: Record<string, unknown>,
	results: MutableTransferResults,
): Promise<string | null> {
	const res = (await ctx.cs.client.POST('/v3/labels', {
		body: { label: prepareLabel(localLabel) },
	})) as unknown;

	const postError = (res as { error?: unknown } | undefined)?.error;
	const labelName = typeof localLabel.name === 'string' ? localLabel.name : '';
	ContentstackError.throwIfError(
		postError,
		`Failed to create label: ${labelName}`,
	);
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
	return createdUid;
}
