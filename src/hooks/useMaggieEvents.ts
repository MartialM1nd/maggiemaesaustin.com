import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useAdminConfig } from '@/hooks/useAdminConfig';
import { useBarRelays } from '@/hooks/useBarRelays';
import { MAGGIE_MAES_TAG } from '@/lib/config';
import {
  parseMaggieEvent,
  isFutureEvent,
  sortByStart,
  type MaggieEvent,
} from '@/lib/maggie';

/**
 * Query upcoming NIP-52 kind:31923 calendar events for Maggie Mae's.
 *
 * The NPool in NostrProvider routes kind:31923 queries directly to the
 * bar relays (barRelaysRef) — completely separate from the user's relay list.
 */
export function useMaggieEvents() {
  const { nostr } = useNostr();
  const { adminPubkeys } = useAdminConfig();
  const { barRelays } = useBarRelays();

  return useQuery({
    queryKey: ['maggie-events', adminPubkeys.join(','), barRelays.join(',')],
    queryFn: async ({ signal }) => {
      const events = await nostr.query(
        [{ kinds: [31923], authors: adminPubkeys, limit: 100 }],
        { signal },
      );

      return events
        .map(parseMaggieEvent)
        .filter((e): e is MaggieEvent => e !== null)
        .filter((e) =>
          e.raw.tags.some(([name, val]) => name === 't' && val === MAGGIE_MAES_TAG),
        )
        .filter(isFutureEvent)
        .sort(sortByStart);
    },
    staleTime: 60_000,
    retry: 1,
  });
}
