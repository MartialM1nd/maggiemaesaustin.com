import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAdminList } from './useAdminList';
import { MAGGIE_MAES_PUBKEY, DEFAULT_ADMIN_PUBKEYS } from '@/lib/config';

/**
 * Reactive hook for reading and writing the admin pubkey list.
 * 
 * READS: Uses useAdminList which queries NIP-78 (kind 30078) from Nostr relays.
 * WRITES: Use useAdminMutations for write operations (owner only).
 * 
 * Security:
 * - List is authored by MAGGIE_MAES_PUBKEY (the venue owner)
 * - Only the owner can modify the list
 * - Falls back to DEFAULT_ADMIN_PUBKEYS if Nostr query fails
 */
export function useAdminConfig() {
  const { user } = useCurrentUser();
  const { data: adminPubkeys = DEFAULT_ADMIN_PUBKEYS, isLoading } = useAdminList();

  const isOwner = user?.pubkey === MAGGIE_MAES_PUBKEY;

  const isAdmin = (pubkey: string) => adminPubkeys.includes(pubkey);

  return {
    adminPubkeys,
    isLoading,
    isOwner,
    isAdmin,
  };
}