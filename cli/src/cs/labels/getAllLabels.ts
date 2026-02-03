import ContentstackError from '../api/ContentstackError.js';
import type Client from '../api/Client.js';
import isRecord from '#cli/util/isRecord.js';
import type Label from './Label.js';
import { isLabel } from './Label.js';

export default async function getAllLabels(client: Client): Promise<Label[]> {
	const res = (await client.GET('/v3/labels')) as unknown;
	const data = (res as { data?: unknown } | undefined)?.data;
	const error = (res as { error?: unknown } | undefined)?.error;
	const msg = `Failed to fetch labels`;
	ContentstackError.throwIfError(error, msg);

	let rawLabels: unknown[] = [];
	if (isRecord(data) && Array.isArray(data.labels)) {
		rawLabels = data.labels;
	} else if (Array.isArray(data)) {
		rawLabels = data;
	}

	// Transform raw labels to ensure they have parent_uid (null if not present)
	const labels: Label[] = [];
	for (const raw of rawLabels) {
		if (
			isRecord(raw) &&
			typeof raw.uid === 'string' &&
			typeof raw.name === 'string'
		) {
			const label: Label = {
				uid: raw.uid,
				name: raw.name,
				parent_uid: typeof raw.parent_uid === 'string' ? raw.parent_uid : null,
			};
			if (isLabel(label)) {
				labels.push(label);
			}
		}
	}

	return labels;
}
