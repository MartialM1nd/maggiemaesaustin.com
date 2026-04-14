import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { MAGGIE_MAES_PUBKEY, ADMIN_LIST_DTAG } from '@/lib/config';
import { nowSecs } from '@/lib/utils';

/**
 * Mutations for updating the admin list stored on Nostr (NIP-78 kind 30078).
 * 
 * Only the venue owner (MAGGIE_MAES_PUBKEY) can publish admin list changes.
 * The mutations validate ownership before allowing any writes.
 */
export function useAdminMutations() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  const isOwner = user?.pubkey === MAGGIE_MAES_PUBKEY;

  const publishAdminList = useMutation({
    mutationFn: async (pubkeys: string[]) => {
      if (!user) {
        throw new Error('Must be logged in');
      }

      if (!isOwner) {
        throw new Error('Only the venue owner can modify the admin list');
      }

      const tags: string[][] = [
        ['d', ADMIN_LIST_DTAG],
        ['alt', 'Maggie Mae\'s Bar admin list'],
      ];

      const signed = await user.signer.signEvent({
        kind: 30078,
        content: JSON.stringify(pubkeys),
        tags,
        created_at: nowSecs(),
      });

      await nostr.event(signed, { signal: AbortSignal.timeout(8000) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-list'] });
    },
  });

  const addAdmin = (newList: string[]) => {
    return publishAdminList.mutateAsync(newList);
  };

  const removeAdmin = (pubkey: string, currentList: string[]) => {
    const newList = currentList.filter((p) => p !== pubkey);
    if (newList.length === 0) {
      throw new Error('Cannot remove the last admin');
    }
    return publishAdminList.mutateAsync(newList);
  };

  return {
    isOwner,
    addAdmin,
    removeAdmin,
    isPending: publishAdminList.isPending,
    error: publishAdminList.error,
  };
}