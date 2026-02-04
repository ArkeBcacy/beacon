import isRecord from '#cli/util/isRecord.js';

export function canonicalize(value: unknown): unknown {
	if (Array.isArray(value)) {
		const result: unknown[] = [];
		for (const item of value) {
			result.push(canonicalize(item));
		}
		return result;
	}
	if (isRecord(value)) {
		const obj: Record<string, unknown> = value;
		const out: Record<string, unknown> = {};
		const objKeys: string[] = Object.keys(obj);
		objKeys.sort();
		for (const key of objKeys) {
			if (key === 'uid' || key === 'created_at' || key === 'updated_at')
				continue;
			// Normalize parent: skip if empty array
			const val: unknown = obj[key];
			if (key === 'parent' && Array.isArray(val) && val.length === 0) continue;
			const canonicalizedVal: unknown = canonicalize(val);
			out[key] = canonicalizedVal;
		}
		return out;
	}
	return value;
}

export function prepareLabel(
	label: Record<string, unknown>,
): Record<string, unknown> {
	// Labels are sent to the API with all fields intact
	// The API expects the parent field as an array
	return label;
}
