import type OmitIndex from '../../util/OmitIndex.js';
import type { Item } from '../Types.js';
import { isItem } from '../Types.js';

export default interface Label extends OmitIndex<Item> {
	readonly name: string;
	readonly parent: readonly string[];
}

export function isLabel(o: unknown): o is Label {
	return isItem(o) && typeof o.name === 'string' && Array.isArray(o.parent);
}
