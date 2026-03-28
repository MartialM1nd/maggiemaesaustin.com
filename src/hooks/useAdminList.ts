import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { MAGGIE_MAES_PUBKEY, ADMIN_LIST_DTAG, DEFAULT_ADMIN_PUBKEYS } from '@/lib/config';

/**
 * Query the admin list from Nostr using NIP-78 (kind 30078).
 * 
 * The admin list is stored as a NIP-78 addressable event:
 * - kind: 30078
 * - author: MAGGIE_MAES_PUBKEY (the venue owner)
 * - d-tag: "maggiemaes-admin-list"
 * - content: JSON array of admin pubkey hex strings
 * 
 * Security: We filter by author to ensure only the venue owner can define the admin list.
 */
export function useAdminList() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['admin-list', MAGGIE_MAES_PUBKEY],
    queryFn: async ({ signal }) => {
      const events = await nostr.query(
        [
          {
            kinds: [30078],
            authors: [MAGGIE_MAES_PUBKEY],
            '#d': [ADMIN_LIST_DTAG],
            limit: 1,
          },
        ],
        { signal },
      );

      if (events.length === 0) {
        return DEFAULT_ADMIN_PUBKEYS;
      }

      const content = events[0].content;
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((p): p is string => typeof p === 'string' && /^[0-9a-f]{64}$/i.test(p));
        }
      } catch {
        // Invalid content, fall back to default
      }

      return DEFAULT_ADMIN_PUBKEYS;
    },
    staleTime: 60_000,
    retry: 2,
    initialData: DEFAULT_ADMIN_PUBKEYS,
  });
}