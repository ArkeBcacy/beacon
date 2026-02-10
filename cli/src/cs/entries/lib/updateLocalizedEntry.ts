import type Client from '#cli/cs/api/Client.js';
import ContentstackError from '#cli/cs/api/ContentstackError.js';
import type { ContentType } from '#cli/cs/content-types/Types.js';
import getUi from '#cli/schema/lib/SchemaUi.js';
import createStylus from '#cli/ui/createStylus.js';
import isRecord from '#cli/util/isRecord.js';
import type { Entry } from '../Types.js';

/**
 * Updates an existing locale version of an entry using the Update a Localized Entry endpoint.
 * This is the semantically correct endpoint for updating non-master locale versions.
 *
 * @param client - Contentstack API client
 * @param contentTypeUid - The content type UID
 * @param entry - The entry data including the UID
 * @param locale - The locale code to update (e.g., 'fr-fr', 'zh-cn')
 * @returns The updated localized entry
 */
export default async function updateLocalizedEntry(
	client: Client,
	contentTypeUid: ContentType['uid'],
	entry: Entry,
	locale: string,
): Promise<Entry> {
	const errorContext = buildContext(contentTypeUid, entry, locale);
	const req = attempt.bind(
		null,
		client,
		contentTypeUid,
		entry,
		locale,
		errorContext,
	);
	return useRetryStrategy(req, errorContext);
}

function buildContext(
	contentTypeUid: ContentType['uid'],
	entry: Entry,
	locale: string,
) {
	const y = createStylus('yellowBright');
	const msg1 = y`Failed to update localized ${contentTypeUid} entry:`;
	const msg2 = y`[${entry.uid}] ${entry.title} in locale ${locale}.`;
	return `${msg1} ${msg2}`;
}

async function attempt(
	client: Client,
	contentTypeUid: ContentType['uid'],
	entry: Entry,
	locale: string,
	errorContext: string,
) {
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

	const { entry: updatedEntry } = data;

	if (!isRecord(updatedEntry)) {
		throw new TypeError(errorContext);
	}

	return updatedEntry as Entry;
}

// Attempting to resolve a relatively rare issue where the entry
// fails to update correctly the first time but succeeds on the
// second try. Unclear why this happens.
async function useRetryStrategy(
	req: () => Promise<Entry>,
	errorContext: string,
) {
	try {
		return await req();
	} catch (ex: unknown) {
		if (!isNullReferenceError(ex)) {
			throw ex;
		}

		const ui = getUi();

		try {
			const result = await req();
			ui.warn(errorContext, 'Resolved on second attempt.');
			return result;
		} catch (ex2: unknown) {
			ui.warn(errorContext, 'Failed after second attempt.', [ex, ex2]);
			throw ex2;
		}
	}
}

function isNullReferenceError(ex: unknown) {
	if (!(ex instanceof ContentstackError)) {
		return false;
	}

	const invalidDataCode = 119;
	if (ex.code !== invalidDataCode) {
		return false;
	}

	const { details } = ex;
	if (!isRecord(details)) {
		return false;
	}

	for (const value of Object.values(details)) {
		if (!Array.isArray(value) || value.length === 0) {
			continue;
		}

		const [firstError] = value as unknown[];

		if (typeof firstError !== 'string') {
			continue;
		}

		if (
			firstError.includes('is not valid') ||
			firstError.includes('Invalid reference')
		) {
			return true;
		}
	}

	return false;
}
