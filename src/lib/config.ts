/**
 * Maggie Mae's Bar — Nostr Configuration
 *
 * MAGGIE_MAES_PUBKEY: The Nostr public key (hex) that "owns" the bar's events.
 * All calendar events displayed on the site must be authored by this key.
 *
 * To update for production:
 *   1. Replace MAGGIE_MAES_PUBKEY with Maggie Mae's official Nostr hex pubkey.
 *   2. The admin list is configurable at runtime via the /admin Identity tab
 *      (stored in localStorage under "maggie:adminPubkeys").
 */
export const MAGGIE_MAES_PUBKEY =
  'ac391a41b2cfb30d77480b5c32322e1989db91db89a253775162871677d1954e';

/**
 * The fallback admin pubkeys used when no runtime config is stored.
 * The runtime list (editable in /admin) is stored in localStorage and
 * takes precedence. Use the useAdminConfig() hook to read/write it.
 */
export const DEFAULT_ADMIN_PUBKEYS: string[] = [MAGGIE_MAES_PUBKEY];

/**
 * localStorage key for the runtime-configurable admin pubkey list.
 */
export const ADMIN_PUBKEYS_STORAGE_KEY = 'maggie:adminPubkeys';

/**
 * Read the current admin pubkeys synchronously (for non-hook contexts).
 * Prefers the localStorage value, falls back to DEFAULT_ADMIN_PUBKEYS.
 */
export function getAdminPubkeys(): string[] {
  try {
    const stored = localStorage.getItem(ADMIN_PUBKEYS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as string[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_ADMIN_PUBKEYS;
}

/**
 * Convenience re-export so existing imports of ADMIN_PUBKEYS still compile.
 * NOTE: This is the static default — prefer getAdminPubkeys() or useAdminConfig()
 * for live values that reflect runtime changes.
 */
export const ADMIN_PUBKEYS: string[] = DEFAULT_ADMIN_PUBKEYS;

/**
 * The hashtag applied to all Maggie Mae's events.
 * Used as a secondary filter alongside the author pubkey.
 */
export const MAGGIE_MAES_TAG = 'maggiemaes';

/**
 * The three stage/space names used in event publishing.
 */
export const MAGGIE_MAES_STAGES = ['The Deck', 'Bar & Lounge', 'The Pub'] as const;
export type MaggieStage = (typeof MAGGIE_MAES_STAGES)[number];

/**
 * Bar-specific relays — where Maggie Mae's events are published and read from.
 * These are completely separate from the logged-in user's personal relay list.
 *
 * - relay.nostr.place: primary relay where bar events are published
 * - relay.ditto.pub:   public fallback for broad discoverability
 *
 * Configurable at runtime via /admin Relays tab (maggie:barRelays in localStorage).
 */
export const DEFAULT_BAR_RELAYS: string[] = [
  'wss://relay.nostr.place',
  'wss://relay.ditto.pub',
];

/** localStorage key for the runtime-configurable bar relay list. */
export const BAR_RELAYS_STORAGE_KEY = 'maggie:barRelays';
