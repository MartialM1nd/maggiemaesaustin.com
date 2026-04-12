/**
 * Maggie Mae's Bar — Nostr Configuration
 *
 * MAGGIE_MAES_PUBKEY: The Nostr public key (hex) that "owns" the bar's events.
 * All calendar events and admin configuration on the site must be authored by this key.
 *
 * To update for production:
 *   1. Replace MAGGIE_MAES_PUBKEY with Maggie Mae's official Nostr hex pubkey.
 */
export const MAGGIE_MAES_PUBKEY =
  '43a2a0cc9a38834bb437881d1a350f799c40a13ffd3543600787c82a29d12d82';

/**
 * The fallback admin pubkeys used when the NIP-78 admin list cannot be fetched.
 * Only used as last resort if Nostr queries fail entirely.
 */
export const DEFAULT_ADMIN_PUBKEYS: string[] = [MAGGIE_MAES_PUBKEY];

/**
 * NIP-78 d-tag for storing the admin list on Nostr relays.
 * Stored as kind:30078 addressable event authored by MAGGIE_MAES_PUBKEY.
 */
export const ADMIN_LIST_DTAG = 'maggiemaes-admin-list';

/**
 * NIP-78 d-tag for storing event templates on Nostr relays.
 * Stored as kind:30078 addressable event authored by any admin.
 */
export const TEMPLATES_DTAG = 'maggiemaes-event-templates';

/**
 * localStorage key - deprecated, no longer used for admin storage.
 * Kept for reference only.
 * @deprecated Admin list is now stored on Nostr via NIP-78 (kind 30078).
 */
export const ADMIN_PUBKEYS_STORAGE_KEY = 'maggie:adminPubkeys';

/**
 * Synchronous fallback for non-hook contexts.
 * Returns DEFAULT_ADMIN_PUBKEYS - for live data, use useAdminConfig() hook.
 * @deprecated Use useAdminConfig() hook for dynamic admin list from Nostr.
 */
export function getAdminPubkeys(): string[] {
  return DEFAULT_ADMIN_PUBKEYS;
}

/**
 * Static default - do not use for runtime access.
 * @deprecated Use useAdminConfig() hook for dynamic admin list from Nostr.
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
export const MAGGIE_MAES_STAGES = ['The Pub', 'Disco Room', 'Gibson Room', 'Piano Room', 'Rooftop Patio', 'Cypherpunk Lounge'] as const;
export type MaggieStage = (typeof MAGGIE_MAES_STAGES)[number];

/**
 * Stage color mapping for UI display.
 * Maps stage names to Tailwind border/text color classes.
 */
export const STAGE_COLORS: Record<string, { border: string; text: string }> = {
  'The Pub': { border: 'border-primary', text: 'text-primary' },
  'Disco Room': { border: 'border-rose-500', text: 'text-rose-500' },
  'Gibson Room': { border: 'border-amber-700', text: 'text-amber-700' },
  'Piano Room': { border: 'border-emerald-500', text: 'text-emerald-500' },
  'Rooftop Patio': { border: 'border-slate-400', text: 'text-slate-400' },
  'Cypherpunk Lounge': { border: 'border-orange-600', text: 'text-orange-600' },
};

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
  'wss://nos.lol',
];

/** localStorage key for the runtime-configurable bar relay list. */
export const BAR_RELAYS_STORAGE_KEY = 'maggie:barRelays';

/**
 * Default Blossom servers for media uploads.
 * Files are uploaded to these servers using the Blossom protocol (NIP-96).
 * Configurable at runtime via /admin Relays tab.
 */
export const DEFAULT_BLOSSOM_SERVERS = [
  'https://blossom.ditto.pub/',
  'https://blossom.primal.net/',
];

/** localStorage key for the runtime-configurable Blossom server list. */
export const BLOSSOM_SERVERS_STORAGE_KEY = 'maggie:blossomServers';
