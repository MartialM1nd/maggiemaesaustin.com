import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { parseRSVP, type MaggieRSVP, type MaggieEvent } from '@/lib/maggie';

/**
 * Query all NIP-52 kind:31925 RSVPs for a specific calendar event.
 *
 * Returns all RSVPs keyed by pubkey (deduplicated — latest RSVP per pubkey wins).
 */
export function useEventRSVPs(event: MaggieEvent | undefined) {
  const { nostr } = useNostr();

  const coord = event
    ? `31923:${event.raw.pubkey}:${event.id}`
    : undefined;

  return useQuery({
    queryKey: ['maggie-rsvps', coord],
    enabled: !!coord,
    queryFn: async ({ signal }) => {
      if (!coord) return [];

      const raw = await nostr.query(
        [
          {
            kinds: [31925],
            '#a': [coord],
            limit: 500,
          },
        ],
        { signal },
      );

      // Parse + deduplicate: keep latest RSVP per pubkey
      const byPubkey = new Map<string, MaggieRSVP>();
      const parsed = raw
        .map(parseRSVP)
        .filter((r): r is MaggieRSVP => r !== null)
        .sort((a, b) => a.raw.created_at - b.raw.created_at); // oldest first so latest overwrites

      for (const rsvp of parsed) {
        byPubkey.set(rsvp.pubkey, rsvp);
      }

      return Array.from(byPubkey.values());
    },
    staleTime: 30_000, // 30 seconds
  });
}

/** Helper: filter RSVPs by status */
export function filterRSVPs(rsvps: MaggieRSVP[], status: MaggieRSVP['status']) {
  return rsvps.filter((r) => r.status === status);
}
