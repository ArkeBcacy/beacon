import { describe, expect, it } from 'vitest';
import flatten from './flatten.js';
import type { LabelTreeNode } from './NormalizedLabels.js';

describe('flatten', () => {
	it('flattens a simple hierarchy', () => {
		const tree: LabelTreeNode[] = [
			{
				children: [
					{ name: 'Child 1', uid: 'child1' },
					{ name: 'Child 2', uid: 'child2' },
				],
				name: 'Parent',
				uid: 'parent',
			},
		];

		const result = flatten(tree);

		expect(result).toEqual([
			{ name: 'Parent', parent: [], uid: 'parent' },
			{ name: 'Child 1', parent: ['parent'], uid: 'child1' },
			{ name: 'Child 2', parent: ['parent'], uid: 'child2' },
		]);
	});

	it('flattens nested hierarchy', () => {
		const tree: LabelTreeNode[] = [
			{
				children: [
					{ name: 'Calculator', uid: 'calculator' },
					{ name: 'Data', uid: 'data' },
					{ name: 'Page', uid: 'page' },
				],
				name: 'Component',
				uid: 'component',
			},
		];

		const result = flatten(tree);

		expect(result).toEqual([
			{ name: 'Component', parent: [], uid: 'component' },
			{ name: 'Calculator', parent: ['component'], uid: 'calculator' },
			{ name: 'Data', parent: ['component'], uid: 'data' },
			{ name: 'Page', parent: ['component'], uid: 'page' },
		]);
	});

	it('handles deeply nested hierarchy', () => {
		const tree: LabelTreeNode[] = [
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
		];

		const result = flatten(tree);

		expect(result).toEqual([
			{ name: 'Root', parent: [], uid: 'root' },
			{ name: 'Level 1', parent: ['root'], uid: 'level1' },
			{ name: 'Level 2', parent: ['level1'], uid: 'level2' },
			{ name: 'Level 3', parent: ['level2'], uid: 'level3' },
		]);
	});

	it('handles multiple top-level labels', () => {
		const tree: LabelTreeNode[] = [
			{ name: 'Label 1', uid: 'label1' },
			{
				children: [{ name: 'Child', uid: 'child' }],
				name: 'Label 2',
				uid: 'label2',
			},
		];

		const result = flatten(tree);

		expect(result).toEqual([
			{ name: 'Label 1', parent: [], uid: 'label1' },
			{ name: 'Label 2', parent: [], uid: 'label2' },
			{ name: 'Child', parent: ['label2'], uid: 'child' },
		]);
	});

	it('handles empty array', () => {
		const result = flatten([]);
		expect(result).toEqual([]);
	});

	it('handles labels without children', () => {
		const tree: LabelTreeNode[] = [
			{ name: 'Label 1', uid: 'label1' },
			{ name: 'Label 2', uid: 'label2' },
		];

		const result = flatten(tree);

		expect(result).toEqual([
			{ name: 'Label 1', parent: [], uid: 'label1' },
			{ name: 'Label 2', parent: [], uid: 'label2' },
		]);
	});
});
