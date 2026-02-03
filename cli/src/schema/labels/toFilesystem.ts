import getAllLabels from '#cli/cs/labels/getAllLabels.js';
import writeYaml from '#cli/fs/writeYaml.js';
import organize from '#cli/dto/labels/organize.js';
import schemaDirectory from '../content-types/schemaDirectory.js';
import { MutableTransferResults } from '../xfer/TransferResults.js';
import createProgressBar from '../lib/createProgressBar.js';
import type Ctx from '../ctx/Ctx.js';

export default async function toFilesystem(ctx: Ctx) {
	const directory = schemaDirectory();
	const bar = createProgressBar('Labels', 1, 0);

	// Fetch labels and organize them into a hierarchical structure
	const flatLabels = await getAllLabels(ctx.cs.client);
	const hierarchicalLabels = organize(flatLabels);

	await writeYaml(`${directory}/labels.yaml`, { labels: hierarchicalLabels });

	const result = new MutableTransferResults();
	result.created.add('labels.yaml');
	bar.increment();
	return result;
}
