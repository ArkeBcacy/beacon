import type Label from '#cli/cs/labels/Label.js';
import type { LabelTreeNode } from './NormalizedLabels.js';

// Labels have a tree structure defined by uid/parent array.
//
// The API returns a flat array that includes uid/parent, where parent is an array
// containing the parent UID (or empty array for top-level labels).
//
// We organize labels into a tree structure for serialization.
//
// The sort order amongst siblings is maintained equal to the order
// as it appears in the array.
export default function organize(
	labels: readonly Label[],
): readonly LabelTreeNode[] {
	const byUid = new Map<string, MutableNode>();
	const topLevel: MutableNode[] = [];

	for (const label of labels) {
		const { parent, ...labelWithoutParent } = label;
		// Preserve all fields except parent (which is represented by the tree structure)
		byUid.set(label.uid, {
			...labelWithoutParent,
			name: label.name,
			uid: label.uid,
		});
	}

	for (const label of labels) {
		const node = byUid.get(label.uid);
		if (!node) {
			throw new Error(`Label ${label.uid} not found`);
		}

		const parentUid = label.parent.length > 0 ? label.parent[0] : null;
		if (!parentUid) {
			topLevel.push(node);
			continue;
		}

		const parent = byUid.get(parentUid);
		if (!parent) {
			const msg = `Orphaned label ${label.uid} with parent ${parentUid}`;
			throw new Error(msg);
		}

		(parent.children ??= []).push(node);
	}

	return topLevel;
}

interface MutableNode {
	[key: string]: unknown;
	readonly uid: string;
	readonly name: string;
	children?: MutableNode[];
}
