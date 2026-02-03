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
			{ name: 'Parent', parent_uid: null, uid: 'parent' },
			{ name: 'Child 1', parent_uid: 'parent', uid: 'child1' },
			{ name: 'Child 2', parent_uid: 'parent', uid: 'child2' },
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
			{ name: 'Component', parent_uid: null, uid: 'component' },
			{ name: 'Calculator', parent_uid: 'component', uid: 'calculator' },
			{ name: 'Data', parent_uid: 'component', uid: 'data' },
			{ name: 'Page', parent_uid: 'component', uid: 'page' },
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
			{ name: 'Root', parent_uid: null, uid: 'root' },
			{ name: 'Level 1', parent_uid: 'root', uid: 'level1' },
			{ name: 'Level 2', parent_uid: 'level1', uid: 'level2' },
			{ name: 'Level 3', parent_uid: 'level2', uid: 'level3' },
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
			{ name: 'Label 1', parent_uid: null, uid: 'label1' },
			{ name: 'Label 2', parent_uid: null, uid: 'label2' },
			{ name: 'Child', parent_uid: 'label2', uid: 'child' },
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
			{ name: 'Label 1', parent_uid: null, uid: 'label1' },
			{ name: 'Label 2', parent_uid: null, uid: 'label2' },
		]);
	});
});
