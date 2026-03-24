import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { MAGGIE_MAES_PUBKEY, MAGGIE_MAES_TAG } from '@/lib/config';
import {
  parseMaggieEvent,
  isFutureEvent,
  sortByStart,
  type MaggieEvent,
} from '@/lib/maggie';

/**
 * Query all upcoming NIP-52 kind:31923 calendar events authored by
 * MAGGIE_MAES_PUBKEY and tagged with the MAGGIE_MAES_TAG hashtag.
 *
 * Returns only future/ongoing events, sorted by start time ascending.
 */
export function useMaggieEvents() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['maggie-events', MAGGIE_MAES_PUBKEY],
    queryFn: async ({ signal }) => {
      const events = await nostr.query(
        [
          {
            kinds: [31923],
            authors: [MAGGIE_MAES_PUBKEY],
            '#t': [MAGGIE_MAES_TAG],
            limit: 50,
          },
        ],
        { signal },
      );

      const parsed = events
        .map(parseMaggieEvent)
        .filter((e): e is MaggieEvent => e !== null)
        .filter(isFutureEvent)
        .sort(sortByStart);

      return parsed;
    },
    staleTime: 60_000, // 1 minute
  });
}
