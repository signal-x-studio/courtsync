/**
 * Theme Store
 * Manages dark/light mode state with localStorage persistence
 */

type Theme = 'light' | 'dark';

class ThemeStore {
	private theme = $state<Theme>('light');

	constructor() {
		// Initialize from localStorage or system preference
		if (typeof window !== 'undefined') {
			const stored = localStorage.getItem('theme') as Theme | null;
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

			this.theme = stored || (prefersDark ? 'dark' : 'light');
			this.applyTheme();
		}
	}

	get current(): Theme {
		return this.theme;
	}

	get isDark(): boolean {
		return this.theme === 'dark';
	}

	toggle(): void {
		this.theme = this.theme === 'light' ? 'dark' : 'light';
		this.applyTheme();
		this.persistTheme();
	}

	setTheme(theme: Theme): void {
		this.theme = theme;
		this.applyTheme();
		this.persistTheme();
	}

	private applyTheme(): void {
		if (typeof document === 'undefined') return;

		if (this.theme === 'dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}

	private persistTheme(): void {
		if (typeof localStorage === 'undefined') return;
		localStorage.setItem('theme', this.theme);
	}
}

export const themeStore = new ThemeStore();
