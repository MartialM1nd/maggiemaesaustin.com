import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAdminConfig } from './useAdminConfig';
import { TEMPLATES_DTAG } from '@/lib/config';
import type { EventTemplate } from './useTemplateList';

/**
 * Mutations for updating event templates stored on Nostr (NIP-78 kind 30078).
 * 
 * Any admin can create, update, or delete templates.
 * The mutations validate that the user is an admin before allowing writes.
 */
export function useTemplateMutations() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { isAdmin } = useAdminConfig();
  const queryClient = useQueryClient();

  const publishTemplates = useMutation({
    mutationFn: async (templates: EventTemplate[]) => {
      if (!user) {
        throw new Error('Must be logged in');
      }

      if (!isAdmin(user.pubkey)) {
        throw new Error('Only admins can manage templates');
      }

      const tags: string[][] = [
        ['d', TEMPLATES_DTAG],
        ['alt', 'Maggie Mae\'s event templates'],
      ];

      const signed = await user.signer.signEvent({
        kind: 30078,
        content: JSON.stringify(templates),
        tags,
        created_at: Math.floor(Date.now() / 1000),
      });

      await nostr.event(signed, { signal: AbortSignal.timeout(8000) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-list'] });
    },
  });

  const createTemplate = (_template: Omit<EventTemplate, 'id'>) => {
    return publishTemplates.mutateAsync;
  };

  const updateTemplate = (updatedTemplate: EventTemplate, currentTemplates: EventTemplate[]) => {
    const newList = currentTemplates.map((t) =>
      t.id === updatedTemplate.id ? updatedTemplate : t
    );
    return publishTemplates.mutateAsync(newList);
  };

  const deleteTemplate = (templateId: string, currentTemplates: EventTemplate[]) => {
    const newList = currentTemplates.filter((t) => t.id !== templateId);
    return publishTemplates.mutateAsync(newList);
  };

  return {
    createTemplate,
    updateTemplate,
    deleteTemplate,
    isPending: publishTemplates.isPending,
    error: publishTemplates.error,
  };
}