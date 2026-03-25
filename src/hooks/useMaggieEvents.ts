import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { MAGGIE_MAES_TAG, getAdminPubkeys } from '@/lib/config';
import {
  parseMaggieEvent,
  isFutureEvent,
  sortByStart,
  type MaggieEvent,
} from '@/lib/maggie';

/**
 * Query all upcoming NIP-52 kind:31923 calendar events authored by
 * any configured admin pubkey and tagged with MAGGIE_MAES_TAG.
 *
 * - Queries by all admin pubkeys so dev/staging installs work regardless
 *   of which key is logged in.
 * - Does NOT rely on relay-side #t filtering (unreliable for addressable
 *   event kinds). The tag check is done client-side.
 * - Uses a hard 8-second timeout so the UI never hangs indefinitely.
 *
 * Returns only future/ongoing events, sorted by start time ascending.
 */
export function useMaggieEvents() {
  const { nostr } = useNostr();

  // Read the live admin list (includes localStorage overrides)
  const authorPubkeys = getAdminPubkeys();

  return useQuery({
    queryKey: ['maggie-events', authorPubkeys.join(',')],
    queryFn: async ({ signal }) => {
      // Combine TanStack's cancel signal with an 8-second hard timeout
      const timeout = AbortSignal.timeout(8000);
      const combined = AbortSignal.any([signal, timeout]);

      const events = await nostr.query(
        [
          {
            kinds: [31923],
            authors: authorPubkeys,
            limit: 100,
          },
        ],
        { signal: combined },
      );

      const parsed = events
        .map(parseMaggieEvent)
        .filter((e): e is MaggieEvent => e !== null)
        // Client-side tag check — only show events tagged as maggiemaes
        .filter((e) => e.raw.tags.some(([name, val]) => name === 't' && val === MAGGIE_MAES_TAG))
        .filter(isFutureEvent)
        .sort(sortByStart);

      return parsed;
    },
    staleTime: 60_000, // 1 minute
    retry: 1,
  });
}
