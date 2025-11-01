/**
 * Gesture detection utilities for mobile touch interactions
 * Handles swipe gestures with proper thresholds and velocity calculations
 */

/**
 * Haptic feedback utilities for mobile devices
 */
export function triggerHapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') {
	if (typeof navigator === 'undefined' || !('vibrate' in navigator)) {
		return;
	}

	const patterns: Record<string, number | number[]> = {
		light: [5],
		medium: [10],
		heavy: [20],
		success: [5, 10, 5],
		warning: [10, 5, 10],
		error: [20, 10, 20],
	};

	navigator.vibrate(patterns[type] || patterns.light);
}

export interface SwipeGesture {
	direction: 'left' | 'right' | 'up' | 'down' | null;
	distance: number;
	velocity: number;
}

export interface TouchStart {
	x: number;
	y: number;
	time: number;
}

const SWIPE_THRESHOLD = 50; // Minimum distance in pixels
const VELOCITY_THRESHOLD = 0.3; // Minimum velocity for swipe detection

/**
 * Create a swipe gesture handler
 */
export function createSwipeHandler(
	onSwipe: (gesture: SwipeGesture) => void,
	options: {
		threshold?: number;
		velocityThreshold?: number;
		onStart?: () => void;
		onMove?: (distance: number, direction: 'left' | 'right' | 'up' | 'down') => void;
		onCancel?: () => void;
		enableHaptic?: boolean;
	} = {}
) {
	const {
		threshold = SWIPE_THRESHOLD,
		velocityThreshold = VELOCITY_THRESHOLD,
		onStart,
		onMove,
		onCancel,
		enableHaptic = true,
	} = options;

	let touchStart: TouchStart | null = null;
	let isSwipe = false;

	const handleTouchStart = (e: TouchEvent) => {
		const touch = e.touches[0];
		if (!touch) return;

		touchStart = {
			x: touch.clientX,
			y: touch.clientY,
			time: Date.now()
		};
		isSwipe = false;
		onStart?.();
	};

	const handleTouchMove = (e: TouchEvent) => {
		if (!touchStart) return;

		const touch = e.touches[0];
		if (!touch) return;

		const deltaX = touch.clientX - touchStart.x;
		const deltaY = touch.clientY - touchStart.y;
		const distanceX = Math.abs(deltaX);
		const distanceY = Math.abs(deltaY);

		// Determine primary direction
		if (distanceX > distanceY && distanceX > threshold / 2) {
			isSwipe = true;
			onMove?.(distanceX, deltaX > 0 ? 'right' : 'left');
		} else if (distanceY > distanceX && distanceY > threshold / 2) {
			isSwipe = true;
			onMove?.(distanceY, deltaY > 0 ? 'down' : 'up');
		}
	};

	const handleTouchEnd = (e: TouchEvent) => {
		if (!touchStart) return;

		const touch = e.changedTouches[0];
		if (!touch) {
			touchStart = null;
			return;
		}

		const deltaX = touch.clientX - touchStart.x;
		const deltaY = touch.clientY - touchStart.y;
		const distanceX = Math.abs(deltaX);
		const distanceY = Math.abs(deltaY);
		const timeDelta = Date.now() - touchStart.time;
		const velocity = Math.max(distanceX, distanceY) / timeDelta;

		// Determine swipe direction
		let direction: 'left' | 'right' | 'up' | 'down' | null = null;
		let distance = 0;

		if (distanceX > distanceY && distanceX > threshold) {
			direction = deltaX > 0 ? 'right' : 'left';
			distance = distanceX;
		} else if (distanceY > distanceX && distanceY > threshold) {
			direction = deltaY > 0 ? 'down' : 'up';
			distance = distanceY;
		}

		if (direction && velocity > velocityThreshold) {
			if (enableHaptic) {
				triggerHapticFeedback('light');
			}
			onSwipe({
				direction,
				distance,
				velocity
			});
		} else if (isSwipe) {
			onCancel?.();
		}

		touchStart = null;
		isSwipe = false;
	};

	const handleTouchCancel = () => {
		touchStart = null;
		isSwipe = false;
		onCancel?.();
	};

	return {
		handleTouchStart,
		handleTouchMove,
		handleTouchEnd,
		handleTouchCancel,
		destroy: () => {
			touchStart = null;
			isSwipe = false;
		}
	};
}

/**
 * Calculate swipe distance and direction from touch events
 */
export function calculateSwipe(
	startX: number,
	startY: number,
	endX: number,
	endY: number,
	startTime: number,
	endTime: number
): SwipeGesture | null {
	const deltaX = endX - startX;
	const deltaY = endY - startY;
	const distanceX = Math.abs(deltaX);
	const distanceY = Math.abs(deltaY);
	const timeDelta = endTime - startTime;
	const velocity = Math.max(distanceX, distanceY) / timeDelta;

	if (timeDelta === 0) return null;

	let direction: 'left' | 'right' | 'up' | 'down' | null = null;
	let distance = 0;

	if (distanceX > distanceY && distanceX > SWIPE_THRESHOLD) {
		direction = deltaX > 0 ? 'right' : 'left';
		distance = distanceX;
	} else if (distanceY > distanceX && distanceY > SWIPE_THRESHOLD) {
		direction = deltaY > 0 ? 'down' : 'up';
		distance = distanceY;
	}

	if (direction && velocity > VELOCITY_THRESHOLD) {
		return {
			direction,
			distance,
			velocity
		};
	}

	return null;
}

