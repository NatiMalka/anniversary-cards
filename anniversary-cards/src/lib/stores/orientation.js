import { readable } from 'svelte/store';
import { browser } from '$app/environment';

const getRawOrientation = function (e) {
	if (!e) {
		return { alpha: 0, beta: 0, gamma: 0 };
	} else {
		return { alpha: e.alpha, beta: e.beta, gamma: e.gamma };
	}
};

const getOrientationObject = (e) => {
	const orientation = getRawOrientation(e);
	return {
		absolute: orientation,
		relative: {
			alpha: orientation.alpha - baseOrientation.alpha,
			beta: orientation.beta - baseOrientation.beta,
			gamma: orientation.gamma - baseOrientation.gamma
		}
	};
};

let firstReading = true;
let baseOrientation = getRawOrientation();

export const resetBaseOrientation = () => {
	firstReading = true;
	baseOrientation = getRawOrientation();
};

/**
 * On iOS 13+ device orientation requires an explicit user-gesture permission.
 * Call this from a click/tap handler (e.g. a "tilt" toggle button) before relying
 * on the gyroscope. Returns true if granted (or not required), false if denied.
 */
export const enableGyroscope = async () => {
	if (!browser) return false;
	const DOE = window.DeviceOrientationEvent;
	if (DOE && typeof DOE.requestPermission === 'function') {
		try {
			const res = await DOE.requestPermission();
			return res === 'granted';
		} catch {
			return false;
		}
	}
	// non-iOS: permission not required
	return true;
};

export const orientation = readable(getOrientationObject(), function start(set) {
	if (!browser) {
		// no device orientation during SSR
		return () => {};
	}

	// https://developer.mozilla.org/en-US/docs/Web/API/Window/ondeviceorientation
	const handleOrientation = function (e) {
		if (firstReading) {
			firstReading = false;
			baseOrientation = getRawOrientation(e);
		}

		const o = getOrientationObject(e);
		set(o);
	};

	window.addEventListener('deviceorientation', handleOrientation, true);

	return function stop() {
		window.removeEventListener('deviceorientation', handleOrientation, true);
	};
});
