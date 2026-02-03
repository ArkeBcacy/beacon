import isRecord from '#cli/util/isRecord.js';
import type Label from '#cli/cs/labels/Label.js';
import { isItem } from '#cli/cs/Types.js';

export default interface NormalizedLabels {
	readonly labels: readonly LabelTreeNode[];
}

export interface LabelTreeNode {
	readonly uid: Label['uid'];
	readonly name: Label['name'];
	readonly children?: readonly LabelTreeNode[];
}

export function key() {
	return 'labels';
}

export function isNormalizedLabels(
	value: unknown,
): value is NormalizedLabels & Record<string, unknown> {
	if (!isRecord(value)) {
		return false;
	}

	return Array.isArray(value.labels) && value.labels.every(isLabelTreeNode);
}

function isLabelTreeNode(value: unknown): value is LabelTreeNode {
	if (!isItem(value)) {
		return false;
	}

	if (typeof value.name !== 'string') {
		return false;
	}

	if (!('children' in value)) {
		return true;
	}

	const { children } = value;

	return Array.isArray(children) && children.every(isLabelTreeNode);
}
