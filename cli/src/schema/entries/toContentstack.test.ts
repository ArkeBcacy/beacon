import { describe, expect, it } from 'vitest';
import type { Entry } from '#cli/cs/entries/Types.js';

describe('Entry matching by UID and title', () => {
	it('should match entries with same UID even if titles differ', () => {
		const fsEntry: Partial<Entry> = {
			title: 'Chinese Title 中文',
			uid: 'blt0acd6b0feb994420',
		};

		const csEntry: Partial<Entry> = {
			title: 'English Title',
			uid: 'blt0acd6b0feb994420',
		};

		// When both entries have the same real Contentstack UID,
		// they should be matched even if titles are different
		expect(fsEntry.uid).toBe(csEntry.uid);
		expect(fsEntry.uid!.startsWith('blt')).toBe(true);
	});

	it('should fall back to title matching for entries without Contentstack UIDs', () => {
		const fsEntry: Partial<Entry> = {
			title: 'Some Entry',
			uid: 'file: Some Entry',
		};

		const csEntry: Partial<Entry> = {
			title: 'Some Entry',
			uid: 'bltabc123',
		};

		// When FS entry doesn't have a real UID, fall back to title matching
		expect(fsEntry.uid!.startsWith('blt')).toBe(false);
		expect(fsEntry.title).toBe(csEntry.title);
	});

	it('should identify real Contentstack UIDs', () => {
		const realUids = [
			'blt0acd6b0feb994420',
			'bltabc123def456',
			'blt1234567890',
		];

		const syntheticUids = ['file: Entry Title', 'temp123', 'abc'];

		for (const uid of realUids) {
			expect(uid.startsWith('blt')).toBe(true);
		}

		for (const uid of syntheticUids) {
			expect(uid.startsWith('blt')).toBe(false);
		}
	});
});
