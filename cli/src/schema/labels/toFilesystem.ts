import getAllLabels from '#cli/cs/labels/getAllLabels.js';
import writeYaml from '#cli/fs/writeYaml.js';
import schemaDirectory from '../content-types/schemaDirectory.js';
import { MutableTransferResults } from '../xfer/TransferResults.js';
import createProgressBar from '../lib/createProgressBar.js';

export default async function toFilesystem(ctx) {
	const directory = schemaDirectory();
	const bar = createProgressBar('Labels', 1, 0);

	// Fetch labels and write them directly. processPlan shortcuts when the
	// merge plan is empty, so for a single-file resource we write and return
	// a simple TransferResults object.
	const labels = await getAllLabels(ctx.cs.client);
	await writeYaml(`${directory}/labels.yaml`, { labels });

	const result = new MutableTransferResults();
	result.created.add('labels.yaml');
	bar.increment();
	return result;
}

//# sourceMappingURL=toFilesystem.js.map
