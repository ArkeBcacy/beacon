import readYaml from '#cli/fs/readYaml.js';
import schemaDirectory from '../content-types/schemaDirectory.js';
import createProgressBar from '../lib/createProgressBar.js';
import ContentstackError from '#cli/cs/api/ContentstackError.js';
import type Ctx from '../ctx/Ctx.js';
import { MutableTransferResults } from '../xfer/TransferResults.js';

export default async function toContentstack(ctx: Ctx) {
	const directory = schemaDirectory();
	const path = `${directory}/labels.yaml`;

	const bar = createProgressBar('Labels', 1, 0);

	let data: any;
	try {
		data = await readYaml(path);
	} catch (err) {
		console.info(`Labels: no file at ${path}, skipping`);
		return new MutableTransferResults();
	}

	const labels = (data && (data.labels ?? [])) || [];
	console.info(`Labels: read ${labels.length} label(s) from ${path}`);

	const results = new MutableTransferResults();

	for (const label of labels) {
		try {
			if (label && typeof label.uid === 'string' && label.uid.length) {
				console.info(`Labels: updating uid=${label.uid} name=${label.name}`);
				const res = await ctx.cs.client.PUT(`/v3/labels/${label.uid}`, {
					body: { label },
				});

				ContentstackError.throwIfError(
					res.error,
					`Failed to update label: ${label.name}`,
				);
				results.updated.add(label.uid || label.name || 'unknown');
			} else {
				console.info(`Labels: creating name=${label.name}`);
				const res = await ctx.cs.client.POST('/v3/labels', {
					body: { label },
				});

				ContentstackError.throwIfError(
					res.error,
					`Failed to create label: ${label.name}`,
				);
				// When created, Contentstack returns an object. Attempt to grab uid.
				const uid = res && (res.data?.label?.uid ?? res.data?.uid ?? null);
				results.created.add(uid ?? label.name ?? 'unknown');
			}
		} catch (err) {
			ContentstackError.throwIfError(
				(err as any)?.error ?? err,
				`Label import failed for: ${label?.name ?? '[unknown]'}`,
			);
			throw err;
		}
	}

	if (labels.length) {
		bar.increment(labels.length);
	}

	return results;
}

//# sourceMappingURL=toContentstack.js.map
