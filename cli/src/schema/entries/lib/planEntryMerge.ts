import type { Entry } from '#cli/cs/entries/Types.js';
import type MergePlan from '../../xfer/lib/MergePlan.js';
import getUi from '../../lib/SchemaUi.js';

/**
 * Build a UID-based index for CS entries
 */
function buildUidIndex(
	csEntriesByTitle: ReadonlyMap<Entry['title'], Entry>,
): Map<Entry['uid'], Entry> {
	const csEntriesByUid = new Map<Entry['uid'], Entry>();
	for (const csEntry of csEntriesByTitle.values()) {
		if (csEntry.uid.startsWith('blt')) {
			csEntriesByUid.set(csEntry.uid, csEntry);
		}
	}
	return csEntriesByUid;
}

/**
 * Match entries by UID and title
 */
function matchEntries(
	equalityFn: (a: Entry, b: Entry) => boolean,
	fsEntriesByTitle: ReadonlyMap<Entry['title'], Entry>,
	csEntriesByTitle: ReadonlyMap<Entry['title'], Entry>,
	csEntriesByUid: Map<Entry['uid'], Entry>,
): {
	toCreate: Map<Entry['title'], Entry>;
	toUpdate: Map<Entry['title'], Entry>;
	toSkip: Set<Entry['title']>;
	matched: Set<Entry['title']>;
} {
	const ui = getUi();
	const toCreate = new Map<Entry['title'], Entry>();
	const toUpdate = new Map<Entry['title'], Entry>();
	const toSkip = new Set<Entry['title']>();
	const matched = new Set<Entry['title']>();

	// First pass: match by UID for entries that have real Contentstack UIDs
	for (const [fsTitle, fsEntry] of fsEntriesByTitle) {
		if (fsEntry.uid.startsWith('blt')) {
			const csEntry = csEntriesByUid.get(fsEntry.uid);
			if (csEntry) {
				// Found a match by UID
				matched.add(csEntry.title);
				if (equalityFn(fsEntry, csEntry)) {
					toSkip.add(fsTitle);
				} else {
					toUpdate.set(fsTitle, fsEntry);
				}
				continue;
			} else if (ui.options.verbose) {
				// Entry has a Contentstack UID but wasn't found in CS
				// This might mean it was deleted from CS, treat as new creation
				ui.warn(
					`Entry "${fsTitle}" has UID ${fsEntry.uid} but was not found in Contentstack. It will be created.`,
				);
			}
		}

		// Second pass: fall back to title-based matching
		const csEntry = csEntriesByTitle.get(fsTitle);
		if (csEntry) {
			matched.add(csEntry.title);
			if (equalityFn(fsEntry, csEntry)) {
				toSkip.add(fsTitle);
			} else {
				toUpdate.set(fsTitle, fsEntry);
			}
		} else {
			toCreate.set(fsTitle, fsEntry);
		}
	}

	return { matched, toCreate, toSkip, toUpdate };
}

/**
 * Custom planning function for entries that matches by UID when available,
 * falling back to title-based matching. This handles cases where entries
 * have Contentstack UIDs but different titles (e.g., localized titles).
 */
export default function planEntryMerge(
	equalityFn: (a: Entry, b: Entry) => boolean,
	fsEntriesByTitle: ReadonlyMap<Entry['title'], Entry>,
	csEntriesByTitle: ReadonlyMap<Entry['title'], Entry>,
): MergePlan<Entry> {
	const csEntriesByUid = buildUidIndex(csEntriesByTitle);
	const { matched, toCreate, toSkip, toUpdate } = matchEntries(
		equalityFn,
		fsEntriesByTitle,
		csEntriesByTitle,
		csEntriesByUid,
	);

	// Find entries to remove (in CS but not matched with any FS entry)
	const toRemove = new Map<Entry['title'], Entry>();
	for (const [csTitle, csEntry] of csEntriesByTitle) {
		if (!matched.has(csTitle)) {
			toRemove.set(csTitle, csEntry);
		}
	}

	return { toCreate, toRemove, toSkip, toUpdate };
}
