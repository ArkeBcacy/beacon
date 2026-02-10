import type Client from '#cli/cs/api/Client.js';
import ContentstackError from '#cli/cs/api/ContentstackError.js';
import type { ContentType } from '#cli/cs/content-types/Types.js';
import createStylus from '#cli/ui/createStylus.js';
import isRecord from '#cli/util/isRecord.js';
import type { Entry } from '../Types.js';

/**
 * Creates a new locale version of an entry using the Localize an Entry endpoint.
 * This is the semantically correct endpoint for creating non-master locale versions.
 *
 * Note: According to the Contentstack API, both creating and updating locale versions
 * use the same PUT endpoint with a locale query parameter.
 *
 * @param client - Contentstack API client
 * @param contentTypeUid - The content type UID
 * @param entry - The entry data including the UID
 * @param locale - The locale code for the new version (e.g., 'fr-fr', 'zh-cn')
 * @returns The localized entry
 */
export default async function localizeEntry(
	client: Client,
	contentTypeUid: ContentType['uid'],
	entry: Entry,
	locale: string,
): Promise<Entry> {
	const y = createStylus('yellowBright');
	const errorContext = y`Failed to localize ${contentTypeUid} entry: [${entry.uid}] ${entry.title} to locale ${locale}.`;

	const response = await client.PUT(
		'/v3/content_types/{content_type_uid}/entries/{entry_uid}',
		{
			body: { entry } as never,
			params: {
				path: {
					content_type_uid: contentTypeUid,
					entry_uid: entry.uid,
				},
				query: {
					locale,
				},
			},
		},
	);

	ContentstackError.throwIfError(response.error, errorContext);

	if (!response.response.ok) {
		throw new Error(errorContext);
	}

	const { data } = response;

	if (!isRecord(data)) {
		throw new TypeError(errorContext);
	}

	const { entry: localizedEntry } = data;

	if (!isRecord(localizedEntry)) {
		throw new TypeError(errorContext);
	}

	return localizedEntry as Entry;
}
