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
        barRelays.map((url) => {
          const relay = new NRelay1(url);
          return relay.query(filter, { signal: AbortSignal.timeout(8000) });
        }),
      );

      results.forEach((r, i) => {
        if (r.status === 'fulfilled') console.log(`[MaggieEvents] relay[${i}] ${barRelays[i]}:`, r.value.length, 'events');
        else console.log(`[MaggieEvents] relay[${i}] ${barRelays[i]} FAILED:`, r.reason);
      });

      // Collect all events, deduplicate by id
      const seen = new Set<string>();
      const allEvents = results
        .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
        .filter((e) => {
          if (seen.has(e.id)) return false;
          seen.add(e.id);
          return true;
        });

      console.log('[MaggieEvents] raw count:', allEvents.length);

      const parsed = allEvents
        .map(parseMaggieEvent)
        .filter((e): e is MaggieEvent => e !== null);
      console.log('[MaggieEvents] after parse:', parsed.length);

      const tagged = parsed.filter((e) =>
        e.raw.tags.some(([name, val]) => name === 't' && val === MAGGIE_MAES_TAG),
      );
      console.log('[MaggieEvents] after #t:maggiemaes filter:', tagged.length);
      if (parsed.length > 0 && tagged.length === 0) {
        console.log('[MaggieEvents] first event tags:', JSON.stringify(parsed[0].raw.tags));
      }

      const future = tagged.filter(isFutureEvent);
      console.log('[MaggieEvents] after isFutureEvent:', future.length);
      if (tagged.length > 0 && future.length === 0) {
        const now = Math.floor(Date.now() / 1000);
        console.log('[MaggieEvents] now:', now, 'first event start:', tagged[0].start, 'end:', tagged[0].end);
      }

      return future.sort(sortByStart);
    },
    staleTime: 60_000,
    retry: 1,
  });
}
