import { useState, useMemo } from 'react';
import { useEventRSVPs, filterRSVPs } from '@/hooks/useEventRSVPs';
import { usePublishRSVP } from '@/hooks/usePublishRSVP';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { eventCoordinate, type MaggieEvent } from '@/lib/maggie';
import { MAGGIE_MAES_PUBKEY } from '@/lib/config';

/**
 * Encapsulates all RSVP state and actions for a single event.
 * Shared between EventCard and EventDetail.
 */
export function useEventRSVPActions(event: MaggieEvent) {
  const { user } = useCurrentUser();
  const { data: rsvps = [], isLoading: rsvpsLoading } = useEventRSVPs(event);
  const { mutate: publishRSVP, isPending: rsvpPending } = usePublishRSVP();
  const [justRsvpd, setJustRsvpd] = useState(false);

  const coord = eventCoordinate(event);

  const accepted = useMemo(() => filterRSVPs(rsvps, 'accepted'), [rsvps]);
  const tentative = useMemo(() => filterRSVPs(rsvps, 'tentative'), [rsvps]);
  const myRSVP = useMemo(
    () => (user ? rsvps.find((r) => r.pubkey === user.pubkey) : undefined),
    [user, rsvps],
  );

  const handleRSVP = (status: 'accepted' | 'declined' | 'tentative') => {
    if (!user) return;
    publishRSVP(
      { eventCoord: coord, eventAuthorPubkey: MAGGIE_MAES_PUBKEY, status },
      { onSuccess: () => setJustRsvpd(true) },
    );
  };

  return { user, rsvps, rsvpsLoading, rsvpPending, accepted, tentative, myRSVP, justRsvpd, handleRSVP };
}
