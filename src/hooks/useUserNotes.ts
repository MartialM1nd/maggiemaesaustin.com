import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';

interface UserNotesResult {
  posts: NostrEvent[];
  followingCount: number;
  followersCount: number;
}

/**
 * Fetch a user's recent posts and social stats.
 * 
 * Fetches:
 * - kind 1: User's recent posts (text notes)
 * - kind 3: User's contacts (following list) — count = following
 * - kind 3: All events mentioning user as contact — count = followers
 */
export function useUserNotes(pubkey: string | undefined) {
  const { nostr } = useNostr();

  return useQuery<UserNotesResult>({
    queryKey: ['nostr', 'user-notes', pubkey ?? ''],
    queryFn: async () => {
      if (!pubkey) {
        return { posts: [], followingCount: 0, followersCount: 0 };
      }

      // Fetch posts and contacts in parallel
      const [postsResult, followingResult, followersResult] = await Promise.all([
        // User's posts (kind 1)
        nostr.query(
          [{ kinds: [1], authors: [pubkey], limit: 10 }],
          { signal: AbortSignal.timeout(3000) }
        ),
        // User's following list (kind 3) — count = following
        nostr.query(
          [{ kinds: [3], authors: [pubkey], limit: 1 }],
          { signal: AbortSignal.timeout(3000) }
        ),
        // Who follows this user — all kind 3 events where this pubkey appears in 'p' tag
        nostr.query(
          [{ kinds: [3], '#p': [pubkey], limit: 100 }],
          { signal: AbortSignal.timeout(3000) }
        ),
      ]);

      // Extract following count from kind 3 event's tags
      let followingCount = 0;
      if (followingResult[0]) {
        const contactTags = followingResult[0].tags.filter(([name]) => name === 'p');
        followingCount = contactTags.length;
      }

      // Count unique followers (each kind 3 mentioning this pubkey = one follower)
      const followersCount = followersResult.length;

      return {
        posts: postsResult,
        followingCount,
        followersCount,
      };
    },
    staleTime: 60 * 1000, // 1 minute
    enabled: !!pubkey,
  });
}