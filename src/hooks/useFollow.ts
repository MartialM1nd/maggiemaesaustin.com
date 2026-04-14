import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { NostrEvent } from '@nostrify/nostrify';
import { nowSecs } from '@/lib/utils';

/**
 * Check if the current user follows a given pubkey.
 * Queries the user's kind 3 contact list.
 */
export function useIsFollowing(targetPubkey: string | undefined) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  return useQuery<boolean>({
    queryKey: ['nostr', 'is-following', user?.pubkey ?? '', targetPubkey ?? ''],
    queryFn: async () => {
      if (!user || !targetPubkey) return false;

      const [contactList] = await nostr.query(
        [{ kinds: [3], authors: [user.pubkey], limit: 1 }],
        { signal: AbortSignal.timeout(3000) }
      );

      if (!contactList) return false;

      // Check if target pubkey is in the contact list's 'p' tags
      return contactList.tags.some(
        (tag) => tag[0] === 'p' && tag[1] === targetPubkey
      );
    },
    staleTime: 30 * 1000,
    enabled: !!user && !!targetPubkey,
  });
}

/**
 * Publish a kind 3 contact list event to follow or unfollow a user.
 */
export function useFollow() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pubkey, action }: { pubkey: string; action: 'follow' | 'unfollow' }) => {
      if (!user) throw new Error('Not logged in');

      // Get current contact list
      const [existing] = await nostr.query(
        [{ kinds: [3], authors: [user.pubkey], limit: 1 }],
        { signal: AbortSignal.timeout(5000) }
      );

      // Build new contact list
      let contacts: string[][] = [];
      if (existing) {
        // Filter out existing contacts except the one we're updating
        contacts = existing.tags.filter(
          (tag) => tag[0] === 'p' && tag[1] !== pubkey
        );
      }

      // Add or remove the target
      if (action === 'follow') {
        // Add with default relay hints (empty = use relays from profile)
        contacts.push(['p', pubkey, '']);
      }

      // Publish updated contact list (kind 3 replaces previous)
      const signed = await user.signer.signEvent({
        kind: 3,
        content: '',
        tags: contacts,
        created_at: nowSecs(),
      });
      await nostr.event(signed, { signal: AbortSignal.timeout(5000) });

      return { pubkey, action };
    },
    onSuccess: ({ pubkey }) => {
      // Invalidate follow status cache for this user
      queryClient.invalidateQueries({
        queryKey: ['nostr', 'is-following', '', pubkey],
      });
    },
  });
}