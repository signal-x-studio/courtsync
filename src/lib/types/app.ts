// Reference: docs/product-requirements.md
// Purpose: App-specific type definitions for UI state and filtering
// Note: These types support the Media and Spectator personas

import type { Match } from './aes';

export type Persona = 'media' | 'spectator';

export interface MatchFilter {
	clubTeamIds: number[];
	clubTeamNames: string[];
	divisionIds?: number[];
	favoriteTeamIds?: number[];
}

export interface TimeBlock {
	time: string;
	timestamp: number;
	matches: Match[];
}

export interface CoverageStats {
	totalMatches: number;
	conflicts: number;
	teamsCovered: number;
	totalTeams: number;
	coveredTeamIds: number[];
	uncoveredTeamIds: number[];
}
