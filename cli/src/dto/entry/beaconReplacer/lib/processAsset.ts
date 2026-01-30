import type BeaconReplacer from '../../BeaconReplacer.js';

export default function processAsset(
	this: BeaconReplacer,
	assetItemPath: string,
) {
	try {
		const asset = this.mapItemPathToAsset(assetItemPath);
		return { ...asset, ACL: [] };
	} catch (err) {
		// If an asset cannot be mapped, rethrow the original error.
		throw err;
	}
}
