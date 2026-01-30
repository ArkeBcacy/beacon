import type Client from '../api/Client.js';
import ContentstackError from '../api/ContentstackError.js';
import isRecord from '#cli/util/isRecord.js';
import type { ContentType } from '../content-types/Types.js';
import type { Entry } from './Types.js';

export interface LocaleInfo {
	readonly code: string;
	readonly fallback_locale?: string;
	readonly name: string;
	readonly uid: string;
}

interface LocalesResponse {
	readonly locales: readonly LocaleInfo[];
}

function isLocaleInfo(o: unknown): o is LocaleInfo {
	return isRecord(o) && typeof (o as any).code === 'string';
}

function isLocalesResponse(o: unknown): o is LocalesResponse {
	return (
		isRecord(o) && Array.isArray(o.locales) && o.locales.every(isLocaleInfo)
	);
}

/**
 * Retrieves all available locale versions of an entry from Contentstack.
 *
 * This function queries the Contentstack Management API to get a list of all locales
 * in which the specified entry exists. This is used during pull operations to determine
 * which locale versions need to be exported and saved to the filesystem.
 *
 * @param client - The Contentstack API client
 * @param contentTypeUid - The UID of the content type (e.g., 'event', 'home_page')
 * @param entryUid - The UID of the entry to get locales for
 * @returns A readonly array of LocaleInfo objects, each containing the locale code, name, and UID
 * @throws {ContentstackError} If the API returns an error
 * @throws {Error} If the response cannot be parsed as a valid LocalesResponse
 *
 * @example
 * const locales = await getEntryLocales(client, 'event', 'blt123456');
 * // Returns: [
 * //   { code: 'en-us', name: 'English - United States', uid: 'blt...' },
 * //   { code: 'fr', name: 'French', uid: 'blt...' }
 * // ]
 */
export default async function getEntryLocales(
	client: Client,
	contentTypeUid: ContentType['uid'],
	entryUid: Entry['uid'],
): Promise<readonly LocaleInfo[]> {
	const { data, error } = await client.GET(
		'/v3/content_types/{content_type_uid}/entries/{entry_uid}/locales',
		{
			params: {
				path: {
					content_type_uid: contentTypeUid,
					entry_uid: entryUid,
				},
			},
		},
	);

	const msg = `Failed to get locales for ${contentTypeUid} entry: ${entryUid}`;
	ContentstackError.throwIfError(error, msg);

	const result = data as unknown;

	if (!isRecord(result) || !Array.isArray((result as any).locales)) {
		throw new Error(msg);
	}

	// Normalize locales to ensure downstream callers have `code`, `name`, and `uid`.
	const rawLocales: Array<Record<string, unknown>> = (result as any).locales;
	const normalized = rawLocales.map((l) => {
		const code = String(l?.code ?? '');
		return {
			code,
			fallback_locale: l?.fallback_locale as string | undefined,
			name:
				(l && typeof (l as any).name === 'string' && (l as any).name) || code,
			uid: (l && typeof (l as any).uid === 'string' && (l as any).uid) || code,
		} as LocaleInfo;
	});

	return normalized;
}
