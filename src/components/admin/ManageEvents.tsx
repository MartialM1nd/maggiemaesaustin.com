import { useState, useEffect } from 'react';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { isValidImageUrl } from '@/lib/validation';
import { useMaggieEvents, useMaggiePastEvents } from '@/hooks/useMaggieEvents';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import { formatEventDate, formatEventTime, type MaggieEvent } from '@/lib/maggie';

// ── EventListItem ─────────────────────────────────────────────────────────────

interface EventListItemProps {
  event: MaggieEvent;
  isEventOwner: boolean;
  onEditEvent: (event: MaggieEvent) => void;
  onRequestDelete: (event: MaggieEvent) => void;
  deletingId: string | null;
}

function EventListItem({ event, isEventOwner, onEditEvent, onRequestDelete, deletingId }: EventListItemProps) {
  const author = useAuthor(event.raw.pubkey);
  const meta = author.data?.metadata;
  const authorName = meta?.name ?? genUserName(event.raw.pubkey);

  return (
    <div className="flex items-start justify-between gap-4 p-4 bg-background border border-border rounded-lg">
      <div className="flex-1 min-w-0">
        <p className="font-serif font-bold text-foreground truncate">{event.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <Avatar className="w-5 h-5">
            <AvatarImage src={isValidImageUrl(meta?.picture || '') ? meta?.picture : undefined} alt={authorName} />
            <AvatarFallback className="text-[8px] bg-primary/20">
              {authorName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-muted-foreground font-mono cursor-help">
                {event.raw.pubkey.slice(0, 8)}...
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{event.raw.pubkey}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <p className="text-xs text-muted-foreground font-display tracking-wide mt-0.5">
          {formatEventDate(event.start, event.timezone)} · {formatEventTime(event.start, event.timezone)}
          {event.stage && ` · ${event.stage}`}
        </p>
        {event.price && (
          <p className="text-xs text-primary font-display mt-0.5">{event.price}</p>
        )}
        {event.recurring && (
          <p className="text-xs text-amber-500 font-display mt-0.5">
            📅 {event.recurring.charAt(0).toUpperCase() + event.recurring.slice(1)}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {isEventOwner && (
          <button
            onClick={() => onEditEvent(event)}
            className="flex-shrink-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors font-display tracking-wider"
          >
            <Pencil size={12} />
            Edit
          </button>
        )}
        {isEventOwner && (
          <button
            onClick={() => onRequestDelete(event)}
            disabled={deletingId === event.id}
            className="flex-shrink-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors font-display tracking-wider disabled:opacity-50"
          >
            {deletingId === event.id ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Trash2 size={12} />
            )}
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

// ── ManageEvents ──────────────────────────────────────────────────────────────

export interface ManageEventsProps {
  onEditEvent: (event: MaggieEvent) => void;
}

export function ManageEvents({ onEditEvent }: ManageEventsProps) {
  const [limit, setLimit] = useState(20);
  const { data: events, isLoading } = useMaggieEvents(limit);
  const { mutateAsync: createEvent } = useNostrPublish();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { user } = useCurrentUser();

  const currentUserPubkey = user?.pubkey?.toLowerCase();

  // Filter state
  const [showMyOnly, setShowMyOnly] = useState(false);

  // Past events state
  const [showPast, setShowPast] = useState(false);
  const [pastEvents, setPastEvents] = useState<MaggieEvent[]>([]);
  const [pastLimit, setPastLimit] = useState(10);

  const { data: newPastEvents, isLoading: pastLoading } = useMaggiePastEvents(pastLimit);

  // Filter events by current user if enabled
  const filteredEvents = showMyOnly && currentUserPubkey
    ? events?.filter(e => e.raw.pubkey.toLowerCase() === currentUserPubkey)
    : events;

  const hasMore = filteredEvents && filteredEvents.length >= limit;

  useEffect(() => {
    if (newPastEvents && showPast) {
      setPastEvents(newPastEvents);
    }
  }, [newPastEvents, showPast]);

  const hasMorePast = pastEvents.length >= pastLimit && pastEvents.length > 0;

  // Confirm-delete dialog state
  const [pendingDelete, setPendingDelete] = useState<MaggieEvent | null>(null);

  const handleRequestDelete = (event: MaggieEvent) => {
    setPendingDelete(event);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    const event = pendingDelete;
    setPendingDelete(null);
    setDeletingId(event.id);
    try {
      await createEvent({
        kind: 5,
        content: 'Event deleted by admin',
        tags: [['e', event.raw.id]],
      });
      toast({ title: 'Deletion requested', description: 'Relays have been asked to remove this event.' });
      queryClient.invalidateQueries({ queryKey: ['maggie-events'] });
      queryClient.invalidateQueries({ queryKey: ['maggie-past-events'] });
    } catch (err) {
      toast({ title: 'Delete failed', description: String(err), variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const renderEventList = (events: MaggieEvent[]) => (
    <div className="space-y-3 max-w-2xl">
      {events.map((event) => (
        <EventListItem
          key={event.id}
          event={event}
          isEventOwner={currentUserPubkey === event.raw.pubkey.toLowerCase()}
          onEditEvent={onEditEvent}
          onRequestDelete={handleRequestDelete}
          deletingId={deletingId}
        />
      ))}
    </div>
  );

  if (isLoading || (showPast && pastLoading)) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-8">
        <Loader2 size={16} className="animate-spin" />
        <span className="font-serif text-sm">Loading events…</span>
      </div>
    );
  }

  if (showPast) {
    if (!pastEvents || pastEvents.length === 0) {
      return (
        <div className="space-y-4">
          <button
            onClick={() => { setShowPast(false); setPastEvents([]); setPastLimit(10); }}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            ← Back to Upcoming
          </button>
          <div className="py-8 text-center">
            <p className="text-muted-foreground font-serif text-sm">No past events found.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <button
          onClick={() => { setShowPast(false); setPastEvents([]); setPastLimit(10); }}
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          ← Back to Upcoming
        </button>
        <div className="flex items-center justify-between">
          <p className="font-display text-xs tracking-widest uppercase text-muted-foreground">
            Past Events ({pastEvents.length} shown)
          </p>
        </div>
        {renderEventList(pastEvents)}
        {hasMorePast && (
          <button
            onClick={() => setPastLimit((p) => p + 10)}
            className="w-full py-2 text-sm text-muted-foreground hover:text-primary border border-border rounded hover:border-primary/50 transition-colors"
          >
            Load More
          </button>
        )}
        <ConfirmDialog
          open={!!pendingDelete}
          onOpenChange={(open) => !open && setPendingDelete(null)}
          title="Delete Event"
          description={`Delete "${pendingDelete?.title}"? This will request deletion via NIP-09.`}
          confirmLabel="Delete"
          onConfirm={handleConfirmDelete}
          destructive
        />
      </div>
    );
  }

  const hasEvents = filteredEvents && filteredEvents.length > 0;

  return (
    <div className="space-y-4">
      {!showPast && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={() => { setShowPast(true); setPastLimit(10); }}
            className="text-sm text-muted-foreground hover:text-primary transition-colors font-display tracking-wider"
          >
            Show Past Events →
          </button>
          {user && (
            <button
              onClick={() => setShowMyOnly(!showMyOnly)}
              className={`text-xs px-3 py-1.5 rounded border transition-colors font-display tracking-wider ${
                showMyOnly
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'text-muted-foreground border-border hover:border-primary/50 hover:text-primary'
              }`}
            >
              {showMyOnly ? 'Showing My Events' : 'Show My Events Only'}
            </button>
          )}
        </div>
      )}
      {hasEvents ? (
        <>
          {renderEventList(filteredEvents)}
          {hasMore && (
            <button
              onClick={() => setLimit((l) => l + 20)}
              className="w-full py-2 text-sm text-muted-foreground hover:text-primary border border-border rounded hover:border-primary/50 transition-colors"
            >
              Load More
            </button>
          )}
        </>
      ) : (
        <div className="py-8 text-center">
          <p className="text-muted-foreground font-serif text-sm">
            {showMyOnly ? 'You have not published any events yet.' : 'No upcoming events found. Publish one using the Publish Event tab.'}
          </p>
        </div>
      )}
      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete Event"
        description={`Delete "${pendingDelete?.title}"? This will request deletion via NIP-09.`}
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        destructive
      />
    </div>
  );
}
