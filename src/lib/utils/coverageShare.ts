import type { CoverageStatus } from '../hooks/useCoverageStatus';

export interface ShareableCoverageData {
  memberId: string;
  memberName: string;
  exportedAt: string;
  assignments: Array<{ teamId: string }>;
  coverageStatus: Record<string, CoverageStatus>;
}

/**
 * Encode coverage data to URL hash (base64)
 */
export const encodeCoverageToHash = (data: ShareableCoverageData): string => {
  try {
    const json = JSON.stringify(data);
    const base64 = btoa(encodeURIComponent(json));
    return base64;
  } catch (error) {
    console.error('Failed to encode coverage data:', error);
    throw new Error('Failed to encode coverage data');
  }
};

/**
 * Decode coverage data from URL hash
 */
export const decodeCoverageFromHash = (hash: string): ShareableCoverageData | null => {
  try {
    // Remove # if present
    const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash;
    const json = decodeURIComponent(atob(cleanHash));
    const data = JSON.parse(json) as ShareableCoverageData;
    
    // Validate structure
    if (!data.memberId || !data.coverageStatus) {
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Failed to decode coverage data:', error);
    return null;
  }
};

/**
 * Generate shareable URL with coverage data in hash
 */
export const generateShareableUrl = (data: ShareableCoverageData): string => {
  const hash = encodeCoverageToHash(data);
  const baseUrl = window.location.origin + window.location.pathname;
  const url = `${baseUrl}#coverage=${hash}`;
  
  // Warn if URL is too long (browsers typically have ~2000 char limit)
  if (url.length > 2000) {
    console.warn('Shareable URL exceeds 2000 characters. Consider using compression or export/import instead.');
  }
  
  return url;
};

/**
 * Extract coverage data from current URL hash
 */
export const extractCoverageFromUrl = (): ShareableCoverageData | null => {
  const hash = window.location.hash;
  if (!hash || !hash.includes('coverage=')) {
    return null;
  }
  
  const match = hash.match(/coverage=([^&]+)/);
  if (!match) {
    return null;
  }
  
  return decodeCoverageFromHash(match[1]);
};

/**
 * Check if URL contains shareable coverage data
 */
export const hasShareableCoverageInUrl = (): boolean => {
  return extractCoverageFromUrl() !== null;
};

/**
 * Compress coverage data using simple encoding (for larger datasets)
 * This is a basic implementation - for production, consider using lz-string library
 */
export const compressCoverageData = (data: ShareableCoverageData): string => {
  // For now, just use base64 encoding
  // In production, you could use lz-string or similar compression library
  return encodeCoverageToHash(data);
};

/**
 * Decompress coverage data
 */
export const decompressCoverageData = (compressed: string): ShareableCoverageData | null => {
  return decodeCoverageFromHash(compressed);
};

