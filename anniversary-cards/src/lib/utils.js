/**
 * Convert any image src (blob URL, object URL, or static path) to a base64
 * data URL so it can be safely persisted to localStorage across page reloads.
 * Draws through a canvas at maxSize × maxSize (default 480px) to keep storage small.
 */
export async function toDataURL(src, maxSize = 480) {
	if (!src) return '';
	// already a data URL — nothing to do
	if (src.startsWith('data:')) return src;

	return new Promise((resolve) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.onload = () => {
			const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight, 1));
			const w = Math.round(img.naturalWidth * scale);
			const h = Math.round(img.naturalHeight * scale);
			const canvas = document.createElement('canvas');
			canvas.width = w;
			canvas.height = h;
			canvas.getContext('2d').drawImage(img, 0, 0, w, h);
			resolve(canvas.toDataURL('image/jpeg', 0.82));
		};
		img.onerror = () => resolve(src); // fallback: keep original (static paths still work)
		img.src = src;
	});
}

/**
 * Resize + compress an image File/Blob before upload so cards load fast
 * everywhere (album, pack reveal, card pool). Scales the longest edge down to
 * `maxSize` and encodes WebP at `quality`. Falls back to the original file if
 * the browser can't encode or the result isn't smaller.
 * @param {File|Blob} file
 * @param {number} [maxSize] longest-edge cap in px (default 1200)
 * @param {number} [quality] 0–1 WebP quality (default 0.82)
 * @returns {Promise<{ blob: File|Blob, ext: string, type: string }>}
 */
export async function compressImage(file, maxSize = 1200, quality = 0.82) {
	const original = { blob: file, ext: (file.name?.split('.').pop() || 'jpg').toLowerCase(), type: file.type || 'image/jpeg' };
	if (!file || !file.type?.startsWith('image/')) return original;

	const dataUrl = await new Promise((resolve, reject) => {
		const r = new FileReader();
		r.onload = () => resolve(r.result);
		r.onerror = reject;
		r.readAsDataURL(file);
	}).catch(() => null);
	if (!dataUrl) return original;

	return new Promise((resolve) => {
		const img = new Image();
		img.onload = () => {
			const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight, 1));
			const w = Math.round(img.naturalWidth * scale);
			const h = Math.round(img.naturalHeight * scale);
			const canvas = document.createElement('canvas');
			canvas.width = w;
			canvas.height = h;
			canvas.getContext('2d').drawImage(img, 0, 0, w, h);
			canvas.toBlob(
				(blob) => {
					if (blob && blob.size < file.size) resolve({ blob, ext: 'webp', type: 'image/webp' });
					else resolve(original);
				},
				'image/webp',
				quality
			);
		};
		img.onerror = () => resolve(original);
		img.src = dataUrl;
	});
}
