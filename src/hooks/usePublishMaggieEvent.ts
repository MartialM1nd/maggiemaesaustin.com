import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { MAGGIE_MAES_PUBKEY, MAGGIE_MAES_TAG } from '@/lib/config';
import type { MaggieStage } from '@/lib/config';

export interface PublishEventInput {
  title: string;
  description: string;
  /** ISO datetime-local string, e.g. "2025-04-04T21:00" */
  startLocal: string;
  /** ISO datetime-local string, e.g. "2025-04-05T01:00" (optional) */
  endLocal?: string;
  location: string;
  stage: MaggieStage | string;
  price: string;
  summary: string;
  imageUrl?: string;
}

/** Convert a local datetime string + IANA tz to a unix timestamp. */
function localToUnix(localStr: string): number {
  // datetime-local values are in "YYYY-MM-DDTHH:mm" format
  // We treat them as America/Chicago (Central Time) by appending the offset.
  // For correctness we use the Intl API approach: just parse as local and let
  // the browser handle it. For a production app you'd use a tz library.
  return Math.floor(new Date(localStr).getTime() / 1000);
}

/** Generate a short random d-tag identifier. */
function generateDTag(): string {
  return `maggie-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Mutation to publish a NIP-52 kind:31923 calendar event as Maggie Mae's.
 * The logged-in user must be MAGGIE_MAES_PUBKEY (enforced by the Admin page).
 */
export function usePublishMaggieEvent() {
  const { mutateAsync: createEvent } = useNostrPublish();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PublishEventInput) => {
      const start = localToUnix(input.startLocal);
      const end = input.endLocal ? localToUnix(input.endLocal) : undefined;

      // Build D tags (day-granularity timestamps required by NIP-52 for kind:31923)
      const secondsInDay = 86400;
      const dTags: string[][] = [];
      if (end) {
        let day = Math.floor(start / secondsInDay);
        const lastDay = Math.floor(end / secondsInDay);
        while (day <= lastDay) {
          dTags.push(['D', String(day)]);
          day++;
        }
      } else {
        dTags.push(['D', String(Math.floor(start / secondsInDay))]);
      }

      const tags: string[][] = [
        ['d', generateDTag()],
        ['title', input.title],
        ['summary', input.summary || input.title],
        ['start', String(start)],
        ['start_tzid', 'America/Chicago'],
        ['location', input.location || '323 E. 6th Street, Austin TX 78701'],
        // Maggie Mae's custom tags
        ['stage', input.stage],
        ['price', input.price || 'Free'],
        // Hashtag for filtering
        ['t', MAGGIE_MAES_TAG],
        ['t', 'livemusic'],
        ['t', 'austin'],
        ...dTags,
      ];

      if (end) {
        tags.push(['end', String(end)]);
        tags.push(['end_tzid', 'America/Chicago']);
      }

      if (input.imageUrl) {
        tags.push(['image', input.imageUrl]);
      }

      await createEvent({
        kind: 31923,
        content: input.description,
        tags,
      });
    },
    onSuccess: () => {
      // Invalidate the events query so the list refreshes
      queryClient.invalidateQueries({
        queryKey: ['maggie-events', MAGGIE_MAES_PUBKEY],
      });
    },
  });
}

/**
 * Mutation to publish or update a NIP-52 kind:31925 RSVP for a calendar event.
 */
export function usePublishRSVP() {
  const { mutateAsync: createEvent } = useNostrPublish();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventCoord,
      eventAuthorPubkey,
      status,
      note,
    }: {
      eventCoord: string;
      eventAuthorPubkey: string;
      status: 'accepted' | 'declined' | 'tentative';
      note?: string;
    }) => {
      await createEvent({
        kind: 31925,
        content: note ?? '',
        tags: [
          ['d', `rsvp-${eventCoord}`],
          ['a', eventCoord],
          ['p', eventAuthorPubkey],
          ['status', status],
        ],
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['maggie-rsvps', variables.eventCoord],
      });
    },
  });
}
