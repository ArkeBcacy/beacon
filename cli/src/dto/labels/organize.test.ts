import { describe, expect, it } from 'vitest';
import organize from './organize.js';
import type Label from '#cli/cs/labels/Label.js';

describe('organize', () => {
	it('organizes flat labels into hierarchy', () => {
		const labels: Label[] = [
			{ name: 'Parent', parent_uid: null, uid: 'parent' },
			{ name: 'Child 1', parent_uid: 'parent', uid: 'child1' },
			{ name: 'Child 2', parent_uid: 'parent', uid: 'child2' },
		];

		const result = organize(labels);

		expect(result).toEqual([
			{
				children: [
					{ name: 'Child 1', uid: 'child1' },
					{ name: 'Child 2', uid: 'child2' },
				],
				name: 'Parent',
				uid: 'parent',
			},
		]);
	});

	it('organizes component label structure from screenshot', () => {
		const labels: Label[] = [
			{ name: 'Component', parent_uid: null, uid: 'component' },
			{ name: 'Calculator', parent_uid: 'component', uid: 'calculator' },
			{ name: 'Data', parent_uid: 'component', uid: 'data' },
			{ name: 'Page', parent_uid: 'component', uid: 'page' },
		];

		const result = organize(labels);

		expect(result).toEqual([
			{
				children: [
					{ name: 'Calculator', uid: 'calculator' },
					{ name: 'Data', uid: 'data' },
					{ name: 'Page', uid: 'page' },
				],
				name: 'Component',
				uid: 'component',
			},
		]);
	});

	it('handles deeply nested labels', () => {
		const labels: Label[] = [
			{ name: 'Root', parent_uid: null, uid: 'root' },
			{ name: 'Level 1', parent_uid: 'root', uid: 'level1' },
			{ name: 'Level 2', parent_uid: 'level1', uid: 'level2' },
			{ name: 'Level 3', parent_uid: 'level2', uid: 'level3' },
		];

		const result = organize(labels);

		expect(result).toEqual([
			{
				children: [
					{
						children: [
							{
								children: [{ name: 'Level 3', uid: 'level3' }],
								name: 'Level 2',
								uid: 'level2',
							},
						],
						name: 'Level 1',
						uid: 'level1',
					},
				],
				name: 'Root',
				uid: 'root',
			},
		]);
	});

	it('handles multiple top-level labels', () => {
		const labels: Label[] = [
			{ name: 'Label 1', parent_uid: null, uid: 'label1' },
			{ name: 'Label 2', parent_uid: null, uid: 'label2' },
			{ name: 'Child', parent_uid: 'label2', uid: 'child' },
		];

		const result = organize(labels);

		expect(result).toEqual([
			{ name: 'Label 1', uid: 'label1' },
			{
				children: [{ name: 'Child', uid: 'child' }],
				name: 'Label 2',
				uid: 'label2',
			},
		]);
	});

	it('handles empty array', () => {
		const result = organize([]);
		expect(result).toEqual([]);
	});

	it('throws error for orphaned label', () => {
		const labels: Label[] = [
			{ name: 'Child', parent_uid: 'nonexistent', uid: 'child' },
		];

		expect(() => organize(labels)).toThrow(
			'Orphaned label child with parent nonexistent',
		);
	});

	it('preserves order of siblings', () => {
		const labels: Label[] = [
			{ name: 'Parent', parent_uid: null, uid: 'parent' },
			{ name: 'Child 3', parent_uid: 'parent', uid: 'child3' },
			{ name: 'Child 1', parent_uid: 'parent', uid: 'child1' },
			{ name: 'Child 2', parent_uid: 'parent', uid: 'child2' },
		];

		const result = organize(labels);

		expect(result[0]?.children).toEqual([
			{ name: 'Child 3', uid: 'child3' },
			{ name: 'Child 1', uid: 'child1' },
			{ name: 'Child 2', uid: 'child2' },
		]);
	});
});
