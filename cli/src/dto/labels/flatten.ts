import type Label from '#cli/cs/labels/Label.js';
import type { LabelTreeNode } from './NormalizedLabels.js';

export default function flatten(
	labels: readonly LabelTreeNode[],
): readonly Label[] {
	const result: Label[] = [];

	function traverse(nodes: readonly LabelTreeNode[], parentUid: string | null) {
		for (const node of nodes) {
			const { children, ...label } = node;

			result.push({
				...label,
				parent_uid: parentUid,
			});

			if (children) {
				traverse(children, node.uid);
			}
		}
	}

	traverse(labels, null);

	return result;
}
