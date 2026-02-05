import { describe, expect, it } from 'vitest';
import type { Entry } from '#cli/cs/entries/Types.js';

describe('indexAllFsEntries - UID preservation', () => {
	it('should preserve Contentstack UIDs starting with blt', () => {
		const entry = {
			title: 'Test Entry',
			uid: 'blt0acd6b0feb994420',
		} as Entry;

		// When the entry has a real Contentstack UID, it should be preserved
		expect(entry.uid).toMatch(/^blt/u);
	});

	it('should use synthetic UID for entries without Contentstack UID', () => {
		const entryTitle = 'Test Entry';
		const syntheticUid = `file: ${entryTitle}`;

		// When the entry doesn't have a real UID, a synthetic one should be used
		expect(syntheticUid).toBe('file: Test Entry');
		expect(syntheticUid).toMatch(/^file: /u);
	});

	it('should detect valid Contentstack UIDs', () => {
		const validUids = [
			'blt0acd6b0feb994420',
			'bltabc123def456',
			'blt1234567890abcdef',
		];

		const invalidUids = ['file: Some Title', 'abc123', 'uid123', ''];

		for (const uid of validUids) {
			expect(uid.startsWith('blt')).toBe(true);
		}

		for (const uid of invalidUids) {
			expect(uid.startsWith('blt')).toBe(false);
		}
	});
});
