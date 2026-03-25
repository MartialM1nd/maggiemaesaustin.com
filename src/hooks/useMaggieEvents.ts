import { useQuery } from '@tanstack/react-query';
import { NRelay1 } from '@nostrify/nostrify';
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
 * Connects directly to each bar relay via NRelay1 — completely bypasses
 * the NPool / user relay list. Queries all bar relays in parallel and
 * deduplicates results by event id.
 */
export function useMaggieEvents() {
  const { adminPubkeys } = useAdminConfig();
  const { barRelays } = useBarRelays();

  return useQuery({
    queryKey: ['maggie-events', adminPubkeys.join(','), barRelays.join(',')],
    queryFn: async () => {
      const filter = [{ kinds: [31923], authors: adminPubkeys, limit: 100 }];

      // Query all bar relays in parallel with an independent timeout per relay
      const results = await Promise.allSettled(
        barRelays.map(async (url) => {
          const relay = new NRelay1(url);
          try {
            return await relay.query(filter, { signal: AbortSignal.timeout(8000) });
          } finally {
            relay.close();
          }
        }),
      );

      // Collect all events, deduplicate by id
      const seen = new Set<string>();
      const allEvents = results
        .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
        .filter((e) => {
          if (seen.has(e.id)) return false;
          seen.add(e.id);
          return true;
        });

      return allEvents
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
