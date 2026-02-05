import { copyFile as nodeCopyFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { humanizePath } from '../../../build/lib/humanize.js';

export default async function copyFile(src, dest) {
	console.info('Copying', humanizePath(src), 'to', humanizePath(dest));
	const destPath = fileURLToPath(dest);
	await mkdir(dirname(destPath), { recursive: true });
	await nodeCopyFile(src, dest);
}
