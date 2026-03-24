/**
 * Maggie Mae's Bar — Nostr Configuration
 *
 * MAGGIE_MAES_PUBKEY: The Nostr public key (hex) that "owns" the bar's events.
 * All calendar events displayed on the site must be authored by this key.
 *
 * To update for production:
 *   1. Replace MAGGIE_MAES_PUBKEY with Maggie Mae's official Nostr hex pubkey.
 *   2. Update ADMIN_PUBKEYS to include whoever should have admin access.
 *
 * Currently set to MartialMind's pubkey for development.
 */
export const MAGGIE_MAES_PUBKEY =
  '5748528068b958db3f33cf0ebf63096f8c780d719a18decaf4df12ea3421a15f';

/**
 * Pubkeys that are allowed to access the /admin console.
 * Add additional pubkeys here to grant access to other administrators.
 */
export const ADMIN_PUBKEYS: string[] = [MAGGIE_MAES_PUBKEY];

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
