import { describe, expect, it } from 'vitest';
import flatten from './flatten.js';
import type { LabelTreeNode } from './NormalizedLabels.js';

describe('flatten', () => {
	it('flattens a simple hierarchy', () => {
		const tree: LabelTreeNode[] = [
			{
				uid: 'parent',
				name: 'Parent',
				children: [
					{ uid: 'child1', name: 'Child 1' },
					{ uid: 'child2', name: 'Child 2' },
				],
			},
		];

		const result = flatten(tree);

		expect(result).toEqual([
			{ uid: 'parent', name: 'Parent', parent_uid: null },
			{ uid: 'child1', name: 'Child 1', parent_uid: 'parent' },
			{ uid: 'child2', name: 'Child 2', parent_uid: 'parent' },
		]);
	});

	it('flattens nested hierarchy', () => {
		const tree: LabelTreeNode[] = [
			{
				uid: 'component',
				name: 'Component',
				children: [
					{ uid: 'calculator', name: 'Calculator' },
					{ uid: 'data', name: 'Data' },
					{ uid: 'page', name: 'Page' },
				],
			},
		];

		const result = flatten(tree);

		expect(result).toEqual([
			{ uid: 'component', name: 'Component', parent_uid: null },
			{ uid: 'calculator', name: 'Calculator', parent_uid: 'component' },
			{ uid: 'data', name: 'Data', parent_uid: 'component' },
			{ uid: 'page', name: 'Page', parent_uid: 'component' },
		]);
	});

	it('handles deeply nested hierarchy', () => {
		const tree: LabelTreeNode[] = [
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
		];

		const result = flatten(tree);

		expect(result).toEqual([
			{ uid: 'root', name: 'Root', parent_uid: null },
			{ uid: 'level1', name: 'Level 1', parent_uid: 'root' },
			{ uid: 'level2', name: 'Level 2', parent_uid: 'level1' },
			{ uid: 'level3', name: 'Level 3', parent_uid: 'level2' },
		]);
	});

	it('handles multiple top-level labels', () => {
		const tree: LabelTreeNode[] = [
			{ uid: 'label1', name: 'Label 1' },
			{
				uid: 'label2',
				name: 'Label 2',
				children: [{ uid: 'child', name: 'Child' }],
			},
		];

		const result = flatten(tree);

		expect(result).toEqual([
			{ uid: 'label1', name: 'Label 1', parent_uid: null },
			{ uid: 'label2', name: 'Label 2', parent_uid: null },
			{ uid: 'child', name: 'Child', parent_uid: 'label2' },
		]);
	});

	it('handles empty array', () => {
		const result = flatten([]);
		expect(result).toEqual([]);
	});

	it('handles labels without children', () => {
		const tree: LabelTreeNode[] = [
			{ uid: 'label1', name: 'Label 1' },
			{ uid: 'label2', name: 'Label 2' },
		];

		const result = flatten(tree);

		expect(result).toEqual([
			{ uid: 'label1', name: 'Label 1', parent_uid: null },
			{ uid: 'label2', name: 'Label 2', parent_uid: null },
		]);
	});
});
