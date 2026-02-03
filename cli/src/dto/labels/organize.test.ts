import { describe, expect, it } from 'vitest';
import organize from './organize.js';
import type Label from '#cli/cs/labels/Label.js';

describe('organize', () => {
	it('organizes flat labels into hierarchy', () => {
		const labels: Label[] = [
			{ uid: 'parent', name: 'Parent', parent_uid: null },
			{ uid: 'child1', name: 'Child 1', parent_uid: 'parent' },
			{ uid: 'child2', name: 'Child 2', parent_uid: 'parent' },
		];

		const result = organize(labels);

		expect(result).toEqual([
			{
				uid: 'parent',
				name: 'Parent',
				children: [
					{ uid: 'child1', name: 'Child 1' },
					{ uid: 'child2', name: 'Child 2' },
				],
			},
		]);
	});

	it('organizes component label structure from screenshot', () => {
		const labels: Label[] = [
			{ uid: 'component', name: 'Component', parent_uid: null },
			{ uid: 'calculator', name: 'Calculator', parent_uid: 'component' },
			{ uid: 'data', name: 'Data', parent_uid: 'component' },
			{ uid: 'page', name: 'Page', parent_uid: 'component' },
		];

		const result = organize(labels);

		expect(result).toEqual([
			{
				uid: 'component',
				name: 'Component',
				children: [
					{ uid: 'calculator', name: 'Calculator' },
					{ uid: 'data', name: 'Data' },
					{ uid: 'page', name: 'Page' },
				],
			},
		]);
	});

	it('handles deeply nested labels', () => {
		const labels: Label[] = [
			{ uid: 'root', name: 'Root', parent_uid: null },
			{ uid: 'level1', name: 'Level 1', parent_uid: 'root' },
			{ uid: 'level2', name: 'Level 2', parent_uid: 'level1' },
			{ uid: 'level3', name: 'Level 3', parent_uid: 'level2' },
		];

		const result = organize(labels);

		expect(result).toEqual([
			{
				uid: 'root',
				name: 'Root',
				children: [
					{
						uid: 'level1',
						name: 'Level 1',
						children: [
							{
								uid: 'level2',
								name: 'Level 2',
								children: [{ uid: 'level3', name: 'Level 3' }],
							},
						],
					},
				],
			},
		]);
	});

	it('handles multiple top-level labels', () => {
		const labels: Label[] = [
			{ uid: 'label1', name: 'Label 1', parent_uid: null },
			{ uid: 'label2', name: 'Label 2', parent_uid: null },
			{ uid: 'child', name: 'Child', parent_uid: 'label2' },
		];

		const result = organize(labels);

		expect(result).toEqual([
			{ uid: 'label1', name: 'Label 1' },
			{
				uid: 'label2',
				name: 'Label 2',
				children: [{ uid: 'child', name: 'Child' }],
			},
		]);
	});

	it('handles empty array', () => {
		const result = organize([]);
		expect(result).toEqual([]);
	});

	it('throws error for orphaned label', () => {
		const labels: Label[] = [
			{ uid: 'child', name: 'Child', parent_uid: 'nonexistent' },
		];

		expect(() => organize(labels)).toThrow(
			'Orphaned label child with parent nonexistent',
		);
	});

	it('preserves order of siblings', () => {
		const labels: Label[] = [
			{ uid: 'parent', name: 'Parent', parent_uid: null },
			{ uid: 'child3', name: 'Child 3', parent_uid: 'parent' },
			{ uid: 'child1', name: 'Child 1', parent_uid: 'parent' },
			{ uid: 'child2', name: 'Child 2', parent_uid: 'parent' },
		];

		const result = organize(labels);

		expect(result[0]?.children).toEqual([
			{ uid: 'child3', name: 'Child 3' },
			{ uid: 'child1', name: 'Child 1' },
			{ uid: 'child2', name: 'Child 2' },
		]);
	});
});
