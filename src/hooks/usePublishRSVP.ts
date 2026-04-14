import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { nowSecs } from '@/lib/utils';

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
        created_at: nowSecs(),
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
