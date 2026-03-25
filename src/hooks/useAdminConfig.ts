import { useLocalStorage } from '@/hooks/useLocalStorage';
import { DEFAULT_ADMIN_PUBKEYS, ADMIN_PUBKEYS_STORAGE_KEY } from '@/lib/config';

/**
 * Reactive hook for reading and writing the runtime admin pubkey list.
 * Stored in localStorage under ADMIN_PUBKEYS_STORAGE_KEY.
 * Falls back to DEFAULT_ADMIN_PUBKEYS when nothing is stored.
 */
export function useAdminConfig() {
  const [adminPubkeys, setAdminPubkeys] = useLocalStorage<string[]>(
    ADMIN_PUBKEYS_STORAGE_KEY,
    DEFAULT_ADMIN_PUBKEYS,
  );

  const addAdmin = (pubkey: string) => {
    const hex = pubkey.trim().toLowerCase();
    if (!hex || adminPubkeys.includes(hex)) return;
    setAdminPubkeys([...adminPubkeys, hex]);
  };

  const removeAdmin = (pubkey: string) => {
    // Never allow removing the last admin — would lock everyone out
    if (adminPubkeys.length <= 1) return;
    setAdminPubkeys(adminPubkeys.filter((pk) => pk !== pubkey));
  };

  const isAdmin = (pubkey: string) => adminPubkeys.includes(pubkey);

  return { adminPubkeys, addAdmin, removeAdmin, isAdmin };
}
