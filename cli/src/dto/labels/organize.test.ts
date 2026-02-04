import { describe, expect, it } from 'vitest';
import organize from './organize.js';
import type Label from '#cli/cs/labels/Label.js';

describe('organize', () => {
	it('organizes flat labels into hierarchy', () => {
		const labels: Label[] = [
			{ name: 'Parent', parent: [], uid: 'parent' },
			{ name: 'Child 1', parent: ['parent'], uid: 'child1' },
			{ name: 'Child 2', parent: ['parent'], uid: 'child2' },
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
			{ name: 'Component', parent: [], uid: 'component' },
			{ name: 'Calculator', parent: ['component'], uid: 'calculator' },
			{ name: 'Data', parent: ['component'], uid: 'data' },
			{ name: 'Page', parent: ['component'], uid: 'page' },
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
			{ name: 'Root', parent: [], uid: 'root' },
			{ name: 'Level 1', parent: ['root'], uid: 'level1' },
			{ name: 'Level 2', parent: ['level1'], uid: 'level2' },
			{ name: 'Level 3', parent: ['level2'], uid: 'level3' },
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
			{ name: 'Label 1', parent: [], uid: 'label1' },
			{ name: 'Label 2', parent: [], uid: 'label2' },
			{ name: 'Child', parent: ['label2'], uid: 'child' },
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
			{ name: 'Child', parent: ['nonexistent'], uid: 'child' },
		];

		expect(() => organize(labels)).toThrow(
			'Orphaned label child with parent nonexistent',
		);
	});

	it('preserves order of siblings', () => {
		const labels: Label[] = [
			{ name: 'Parent', parent: [], uid: 'parent' },
			{ name: 'Child 3', parent: ['parent'], uid: 'child3' },
			{ name: 'Child 1', parent: ['parent'], uid: 'child1' },
			{ name: 'Child 2', parent: ['parent'], uid: 'child2' },
		];

		const result = organize(labels);

		expect(result[0]?.children).toEqual([
			{ name: 'Child 3', uid: 'child3' },
			{ name: 'Child 1', uid: 'child1' },
			{ name: 'Child 2', uid: 'child2' },
		]);
	});
});
