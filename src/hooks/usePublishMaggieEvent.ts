import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { MAGGIE_MAES_TAG } from '@/lib/config';
import type { MaggieStage } from '@/lib/config';

export interface PublishEventInput {
  title: string;
  description: string;
  /** ISO datetime-local string e.g. "2025-04-04T21:00" */
  startLocal: string;
  /** ISO datetime-local string e.g. "2025-04-05T01:00" (optional) */
  endLocal?: string;
  location: string;
  stage: MaggieStage | string;
  price: string;
  summary: string;
  imageUrl?: string;
  /** Artist's lightning address for zaps (e.g. "artist@lightningaddress.com") */
  artistLightningAddress?: string;
  /** If provided, the event will replace an existing event with this d-tag (NIP-52 edit) */
  existingDTag?: string;
}

/** Convert a datetime-local string to a unix timestamp (seconds). */
function localToUnix(localStr: string): number {
  return Math.floor(new Date(localStr).getTime() / 1000);
}

/** Generate a unique d-tag identifier. */
function generateDTag(): string {
  return `maggie-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Publish a NIP-52 kind:31923 calendar event directly to the bar relays.
 * Bypasses the user's personal relay list entirely.
 */
export function usePublishMaggieEvent() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PublishEventInput) => {
      if (!user) throw new Error('Not logged in');

      const start = localToUnix(input.startLocal);
      const end = input.endLocal ? localToUnix(input.endLocal) : undefined;

      // NIP-52 requires D tags (day-granularity unix day numbers)
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

      // Use existing d-tag if editing, otherwise generate new one
      const dTag = input.existingDTag || generateDTag();

      const tags: string[][] = [
        ['d', dTag],
        ['title', input.title],
        ['summary', input.summary || input.title],
        ['start', String(start)],
        ['start_tzid', 'America/Chicago'],
        ['location', input.location || '323 E. 6th Street, Austin TX 78701'],
        ['stage', input.stage],
        ['price', input.price || 'Free'],
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

      if (input.artistLightningAddress) {
        tags.push(['lud16', input.artistLightningAddress]);
      }

      // Sign the event
      const signed = await user.signer.signEvent({
        kind: 31923,
        content: input.description,
        tags,
        created_at: Math.floor(Date.now() / 1000),
      });

      // eventRouter in NostrProvider automatically routes kind:31923 to bar relays
      await nostr.event(signed, { signal: AbortSignal.timeout(8000) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maggie-events'] });
    },
  });
}

/**
 * Publish a NIP-52 kind:31925 RSVP.
 * RSVPs go through the user's normal relay list (their personal Nostr presence).
 */
export function usePublishRSVP() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
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
      if (!user) throw new Error('Not logged in');

      const signed = await user.signer.signEvent({
        kind: 31925,
        content: note ?? '',
        tags: [
          ['d', `rsvp-${eventCoord}`],
          ['a', eventCoord],
          ['p', eventAuthorPubkey],
          ['status', status],
        ],
        created_at: Math.floor(Date.now() / 1000),
      });

      // RSVPs go to the user's own relays via the normal pool
      await nostr.event(signed, { signal: AbortSignal.timeout(5000) });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['maggie-rsvps', variables.eventCoord],
      });
    },
  });
}
