import { useAdminList } from '@/hooks/useAdminList';

/**
 * AdminListLoader — eagerly loads the admin list on app mount.
 * 
 * This ensures the admin list is available immediately (from localStorage)
 * before the user attempts to login, so they can see if they'll have admin access.
 * 
 * The query runs on app mount (via NostrProvider context) and:
 * - Uses persisted localStorage value as initial data for instant display
 * - Fetches fresh data from Nostr relays in the background
 * - Updates localStorage when fresh data arrives
 * 
 * This component renders nothing — it just triggers the query.
 */
export function AdminListLoader() {
  useAdminList();
  return null;
}