import ContentstackError from '../api/ContentstackError.js';
import type Client from '../api/Client.js';
import isRecord from '#cli/util/isRecord.js';

export default async function getAllLabels(client: Client): Promise<unknown[]> {
	const res = (await client.GET('/v3/labels')) as unknown;
	const data = (res as { data?: unknown } | undefined)?.data;
	const error = (res as { error?: unknown } | undefined)?.error;
	const msg = `Failed to fetch labels`;
	ContentstackError.throwIfError(error, msg);
	if (isRecord(data) && Array.isArray(data.labels)) {
		return data.labels as unknown[];
	}
	if (Array.isArray(data)) {
		return data as unknown[];
	}
	return [];
}
