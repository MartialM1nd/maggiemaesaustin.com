import { useEffect } from 'react';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAppContext } from '@/hooks/useAppContext';

/**
 * NostrSync — syncs the logged-in user's NIP-65 relay list (kind:10002).
 *
 * Only syncs on first login (when updatedAt === 0), so that manually
 * configured relays are never silently overwritten by the user's Nostr
 * relay list. The user can always update relays manually via the admin panel.
 */
export function NostrSync() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { config, updateConfig } = useAppContext();

  useEffect(() => {
    if (!user) return;

    // Only auto-sync on first load — never overwrite user-configured relays
    if (config.relayMetadata.updatedAt > 0) return;

    const syncRelaysFromNostr = async () => {
      try {
        const events = await nostr.query(
          [{ kinds: [10002], authors: [user.pubkey], limit: 1 }],
          { signal: AbortSignal.timeout(5000) },
        );

        if (events.length > 0) {
          const event = events[0];
          const fetchedRelays = event.tags
            .filter(([name]) => name === 'r')
            .map(([_, url, marker]) => ({
              url,
              read: !marker || marker === 'read',
              write: !marker || marker === 'write',
            }));

          if (fetchedRelays.length > 0) {
            updateConfig((current) => ({
              ...current,
              relayMetadata: {
                relays: fetchedRelays,
                updatedAt: event.created_at,
              },
            }));
          }
        }
      } catch (error) {
        console.error('Failed to sync relays from Nostr:', error);
      }
    };

    syncRelaysFromNostr();
  // Only run when user changes — not on every relay config change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.pubkey]);

  return null;
}
