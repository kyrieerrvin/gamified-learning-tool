export type SoundKey = 'tiles' | 'correct' | 'wrong' | 'victory' | 'lost';

// Preload and cache Audio instances per sound key to avoid recreating elements
const soundCache: Partial<Record<SoundKey, HTMLAudioElement>> = {};

function resolveSoundUrl(key: SoundKey): string {
	// Prefer lowercase .mp3 in public/sounds; fallback to capitalized .MP3
	const base = '/sounds';
	switch (key) {
		case 'tiles':
			return `${base}/tiles.mp3`;
		case 'correct':
			return `${base}/correct.mp3`;
		case 'wrong':
			return `${base}/wrong.mp3`;
		case 'victory':
			return `${base}/victory.mp3`;
		case 'lost':
			return `${base}/lost.mp3`;
	}
}

function resolveFallbackUrl(key: SoundKey): string | null {
	const base = '/sounds';
	switch (key) {
		case 'tiles':
			return null; // only lowercase provided
		case 'correct':
			return `${base}/correct.MP3`;
		case 'wrong':
			return `${base}/wrong.MP3`;
		case 'victory':
			return `${base}/victory.MP3`;
		case 'lost':
			return `${base}/lost.MP3`;
	}
}

function createAudio(key: SoundKey): HTMLAudioElement | null {
	if (typeof window === 'undefined') return null;
	const primary = resolveSoundUrl(key);
	const audio = new Audio(primary);
	// If the primary fails to load, try fallback once
	audio.addEventListener('error', () => {
		const fallback = resolveFallbackUrl(key);
		if (fallback) {
			// swap src to fallback only once
			audio.src = fallback;
			audio.load();
		}
	}, { once: true });
	// Try to reduce latency
	audio.preload = 'auto';
	audio.crossOrigin = 'anonymous';
	return audio;
}

export function playSound(key: SoundKey): void {
	if (typeof window === 'undefined') return;
	try {
		let audio = soundCache[key];
		if (!audio) {
			audio = createAudio(key) as HTMLAudioElement;
			soundCache[key] = audio || undefined;
		}
		if (!audio) return;
		// Restart from beginning for rapid repeat taps
		audio.currentTime = 0;
		// Play may be blocked if no user gesture; failures are fine to ignore
		void audio.play().catch(() => {});
	} catch {
		// no-op
	}
}

export function preloadSounds(keys: SoundKey[]): void {
	if (typeof window === 'undefined') return;
	for (const k of keys) {
		if (!soundCache[k]) {
			soundCache[k] = createAudio(k) || undefined;
		}
	}
}



