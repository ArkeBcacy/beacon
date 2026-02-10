import type Client from '../api/Client.js';
import importCreate from './lib/importCreate.js';
import importOverwrite from './lib/importOverwrite.js';
import localizeEntry from './lib/localizeEntry.js';
import updateLocalizedEntry from './lib/updateLocalizedEntry.js';
import type { Entry } from './Types.js';

/**
 * Imports or localizes an entry based on the locale and overwrite parameters.
 *
 * For master locale entries (locale === undefined):
 * - Uses the Import API endpoints which are designed for bulk data import/export
 *
 * For localized entries (locale specified):
 * - Uses the dedicated localization endpoints (Localize/Update Localized Entry)
 *   which are semantically correct for locale management operations
 *
 * @param client - Contentstack API client
 * @param contentTypeUid - The content type UID
 * @param entry - The entry data
 * @param overwrite - Whether to create (false) or update (true) the entry/locale
 * @param locale - Optional locale code. If undefined, operates on master locale
 * @returns The created or updated entry
 */
export default async function importEntry(
	client: Client,
	contentTypeUid: string,
	entry: Entry,
	overwrite: boolean,
	locale?: string,
) {
	// For master locale, use Import API (designed for data import/export)
	if (locale === undefined) {
		return overwrite
			? await importOverwrite(client, contentTypeUid, entry, locale)
			: await importCreate(client, contentTypeUid, entry, locale);
	}

	// For localized entries, use dedicated localization endpoints
	return overwrite
		? await updateLocalizedEntry(client, contentTypeUid, entry, locale)
		: await localizeEntry(client, contentTypeUid, entry, locale);
}
