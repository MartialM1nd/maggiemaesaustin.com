/**
 * Shared validation utilities for security-critical checks.
 */

/**
 * Validate that a string is a valid 64-character hexadecimal pubkey.
 */
export function isValidHex64(s: string): boolean {
  return typeof s === 'string' && /^[0-9a-f]{64}$/i.test(s);
}

/**
 * Validate that a URL is safe to use as an image src attribute.
 * 
 * Only allows:
 * - https: URLs (secure, most common for profile images)
 * - blob: URLs (for dynamically generated images)
 * 
 * Blocks potentially dangerous schemes:
 * - javascript: (XSS vector)
 * - data: with HTML content (XSS vector)
 * - http: (insecure, mixed content)
 */
export function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsed = new URL(url);
    return ['https:', 'blob:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validate that a timestamp is within acceptable bounds for Nostr events.
 * 
 * @param timestamp - Unix timestamp in seconds
 * @param minTimestamp - Minimum acceptable timestamp (default: April 2, 2016)
 * @param maxTimestamp - Maximum acceptable timestamp (default: April 2, 2028)
 */
export function isValidTimestamp(
  timestamp: number,
  minTimestamp = 1459555200, // April 2, 2016
  maxTimestamp = 1827609600  // April 2, 2028
): boolean {
  return (
    typeof timestamp === 'number' &&
    !isNaN(timestamp) &&
    timestamp >= minTimestamp &&
    timestamp <= maxTimestamp
  );
}
