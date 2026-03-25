import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAdminConfig } from '@/hooks/useAdminConfig';
import { MAGGIE_MAES_TAG } from '@/lib/config';
import {
  parseMaggieEvent,
  isFutureEvent,
  sortByStart,
  type MaggieEvent,
} from '@/lib/maggie';

/**
 * Query all upcoming NIP-52 kind:31923 calendar events for Maggie Mae's.
 *
 * Author list = union of:
 *   - Configured admin pubkeys (from localStorage or DEFAULT_ADMIN_PUBKEYS)
 *   - Currently logged-in user's pubkey (so dev installs always work)
 *
 * The query key includes the full author list so it automatically re-runs
 * whenever the user logs in/out or the admin list changes.
 *
 * The query always runs (no `enabled` gate) — the Events page is public.
 * If no user is logged in, only the admin pubkeys are queried.
 */
export function useMaggieEvents() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { adminPubkeys } = useAdminConfig();

  // Build deduped author list — admin pubkeys always included,
  // logged-in user added when available
  const authorPubkeys = Array.from(
    new Set([...adminPubkeys, ...(user?.pubkey ? [user.pubkey] : [])]),
  );

  return useQuery({
    queryKey: ['maggie-events', authorPubkeys.join(',')],
    queryFn: async ({ signal }) => {
      const timeout = AbortSignal.timeout(8000);
      const combined = AbortSignal.any([signal, timeout]);

      console.log('[MaggieEvents] Querying authors:', authorPubkeys);

      const events = await nostr.query(
        [{ kinds: [31923], authors: authorPubkeys, limit: 100 }],
        { signal: combined },
      );

      console.log('[MaggieEvents] Raw events from relay:', events.length, events);

      const afterParse = events
        .map(parseMaggieEvent)
        .filter((e): e is MaggieEvent => e !== null);
      console.log('[MaggieEvents] After parse:', afterParse.length);

      const afterTag = afterParse.filter((e) =>
        e.raw.tags.some(([name, val]) => name === 't' && val === MAGGIE_MAES_TAG),
      );
      console.log(
        '[MaggieEvents] After #t:maggiemaes filter:', afterTag.length,
        'tags on first event:', afterParse[0]?.raw.tags,
      );

      const afterFuture = afterTag.filter(isFutureEvent);
      console.log(
        '[MaggieEvents] After isFutureEvent filter:', afterFuture.length,
        afterParse[0] && { start: afterParse[0].start, now: Math.floor(Date.now() / 1000) },
      );

      return afterFuture.sort(sortByStart);
    },
    staleTime: 30_000,
    gcTime: 0, // Don't cache empty results — always re-fetch fresh on mount
    retry: 1,
    refetchOnMount: true,
  });
}
