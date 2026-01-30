import getUi from './SchemaUi.js';

export default function createProgressBar(
	name: string,
	...indicies: readonly (ReadonlyMap<unknown, unknown> | number)[]
) {
	const sizes = indicies.map((x) => {
		if (typeof x === 'number') return x;
		try {
			return [...x.keys()].length;
		} catch {
			return 0;
		}
	});
	const totalSize = sizes.reduce((a, b) => a + b, 0);
	return getUi().createProgressBar(name, totalSize);
}
