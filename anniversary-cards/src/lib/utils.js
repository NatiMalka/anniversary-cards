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
