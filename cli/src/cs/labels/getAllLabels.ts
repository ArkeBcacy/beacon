import ContentstackError from '../api/ContentstackError.js';

export default async function getAllLabels(client) {
	const { data, error } = await client.GET('/v3/labels', {});
	const msg = `Failed to fetch labels`;
	ContentstackError.throwIfError(error, msg);
	// The API returns { labels: [...] } — return the array for consumers.
	// If the shape differs, fall back to an empty array.
	return (data && (data.labels ?? data)) || [];
}

//# sourceMappingURL=getAllLabels.js.map
