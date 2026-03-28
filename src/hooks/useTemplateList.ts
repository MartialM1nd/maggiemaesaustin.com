import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useAdminConfig } from './useAdminConfig';
import { TEMPLATES_DTAG } from '@/lib/config';

export interface EventTemplate {
  id: string;
  name: string;
  title: string;
  summary: string;
  description: string;
  location: string;
  stage: string;
  price: string;
  imageUrl: string;
}

/**
 * Query event templates from Nostr using NIP-78 (kind 30078).
 * 
 * The template list is stored as a NIP-78 addressable event:
 * - kind: 30078
 * - d-tag: "maggiemaes-event-templates"
 * - content: JSON array of EventTemplate objects
 * 
 * Security: We only accept events from pubkeys in the current admin list.
 * This prevents anyone outside the admin list from publishing fake templates.
 */
export function useTemplateList() {
  const { nostr } = useNostr();
  const { adminPubkeys } = useAdminConfig();

  return useQuery({
    queryKey: ['template-list', adminPubkeys.join(',')],
    queryFn: async ({ signal }) => {
      // Query all template events
      const events = await nostr.query(
        [
          {
            kinds: [30078],
            '#d': [TEMPLATES_DTAG],
            limit: 10,
          },
        ],
        { signal },
      );

      // Security: Only accept events from current admins
      const validEvents = events.filter((e) => {
        const authorIsAdmin = adminPubkeys.includes(e.pubkey);
        if (!authorIsAdmin) {
          console.warn(`Rejected template event from non-admin: ${e.pubkey}`);
        }
        return authorIsAdmin;
      });

      if (validEvents.length === 0) {
        return [];
      }

      // Sort by created_at, newest first
      validEvents.sort((a, b) => b.created_at - a.created_at);

      // Use the most recent valid event
      const latest = validEvents[0];
      try {
        const parsed = JSON.parse(latest.content);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (t): t is EventTemplate =>
              t &&
              typeof t === 'object' &&
              typeof t.id === 'string' &&
              typeof t.name === 'string'
          );
        }
      } catch {
        console.warn('Failed to parse template content');
      }

      return [];
    },
    staleTime: 60_000,
    retry: 2,
    initialData: [],
  });
}