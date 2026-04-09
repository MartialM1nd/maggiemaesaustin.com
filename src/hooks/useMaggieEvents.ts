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

/**
 * Query NIP-52 kind:31923 calendar events for a specific month range.
 * Used by Calendar page to dynamically load events as user navigates months.
 * 
 * @param startDate - Start of month (Date object)
 * @param endDate - End of month (Date object)
 */
export function useMaggieEventsForMonth(startDate: Date, endDate: Date) {
  const { nostr } = useNostr();
  const { adminPubkeys } = useAdminConfig();
  const { barRelays } = useBarRelays();

  const since = Math.floor(startDate.getTime() / 1000);
  const until = Math.floor(endDate.getTime() / 1000);

  return useQuery({
    queryKey: ['maggie-events-month', since, until, adminPubkeys.join(','), barRelays.join(',')],
    queryFn: async ({ signal }) => {
      const events = await nostr.query(
        [{ kinds: [31923], authors: adminPubkeys, since, until }],
        { signal },
      );

      return events
        .map(parseMaggieEvent)
        .filter((e): e is MaggieEvent => e !== null)
        .filter((e) =>
          e.raw.tags.some(([name, val]) => name === 't' && val === MAGGIE_MAES_TAG),
        )
        .sort(sortByStart);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
