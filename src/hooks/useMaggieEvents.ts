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
 * - Queries ONLY the bar-specific relays (barRelays), never the user's
 *   personal relay list. This means results are consistent regardless of
 *   who is logged in.
 * - Filters by the configured admin pubkeys as authors.
 * - Validates the #t:maggiemaes tag client-side.
 * - Returns only future/ongoing events sorted by start time.
 */
export function useMaggieEvents() {
  const { nostr } = useNostr();
  const { adminPubkeys } = useAdminConfig();
  const { barRelays } = useBarRelays();

  return useQuery({
    queryKey: ['maggie-events', adminPubkeys.join(','), barRelays.join(',')],
    queryFn: async ({ signal }) => {
      const timeout = AbortSignal.timeout(8000);
      const combined = AbortSignal.any([signal, timeout]);

      // Use a dedicated relay group — completely isolated from user relay list
      const relayGroup = nostr.group(barRelays);

      const events = await relayGroup.query(
        [{ kinds: [31923], authors: adminPubkeys, limit: 100 }],
        { signal: combined },
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
