import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, CheckCircle2, Users, Calendar, Zap } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { ZapButton } from '@/components/ZapButton';
import { CommentsSection } from '@/components/comments/CommentsSection';
import { useEventRSVPs, filterRSVPs } from '@/hooks/useEventRSVPs';
import { usePublishRSVP } from '@/hooks/usePublishMaggieEvent';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { formatEventDate, formatEventTime, eventCoordinate, generateICS, type MaggieEvent } from '@/lib/maggie';
import { MAGGIE_MAES_PUBKEY, STAGE_COLORS } from '@/lib/config';
import { cn } from '@/lib/utils';

function RSVPAvatar({ pubkey }: { pubkey: string }) {
  const author = useAuthor(pubkey);
  const meta = author.data?.metadata;
  const name = meta?.name ?? genUserName(pubkey);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Avatar className="w-8 h-8 border-2 border-background -ml-2 first:ml-0 hover:z-10 relative transition-transform hover:scale-110">
          <AvatarImage src={meta?.picture} alt={name} />
          <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
            {name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="text-xs">{name}</p>
      </TooltipContent>
    </Tooltip>
  );
}

interface EventDetailProps {
  event: MaggieEvent;
}

export function EventDetail({ event }: EventDetailProps) {
  const { user } = useCurrentUser();
  const { data: rsvps = [], isLoading: rsvpsLoading } = useEventRSVPs(event);
  const { mutate: publishRSVP, isPending: rsvpPending } = usePublishRSVP();
  const [justRsvpd, setJustRsvpd] = useState(false);

  const coord = eventCoordinate(event);
  const accepted = filterRSVPs(rsvps, 'accepted');
  const tentative = filterRSVPs(rsvps, 'tentative');
  const myRSVP = user ? rsvps.find((r) => r.pubkey === user.pubkey) : undefined;
  const stageClass = STAGE_COLORS[event.stage] ?? { border: 'border-primary', text: 'text-primary' };

  const handleRSVP = (status: 'accepted' | 'declined' | 'tentative') => {
    if (!user) return;
    publishRSVP(
      { eventCoord: coord, eventAuthorPubkey: MAGGIE_MAES_PUBKEY, status },
      { onSuccess: () => setJustRsvpd(true) },
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 pt-24 pb-8 space-y-8">
      {/* Back link */}
      <Link
        to="/events"
        className="inline-flex items-center gap-2 text-sm font-display tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft size={14} /> Back to Events
      </Link>

      {/* Hero image */}
      {event.image && (
        <div className="w-full aspect-video rounded-lg overflow-hidden border border-border">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Header */}
      <div className="space-y-3">
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2">
          {event.stage && (
            <span className={cn('border rounded-full px-3 py-1 text-xs font-display tracking-wider', stageClass.border, stageClass.text)}>
              {event.stage}
            </span>
          )}
          <span
            className={cn(
              'rounded-full px-3 py-1 text-xs font-display tracking-wider border',
              event.price === 'Free' || event.price === 'free'
                ? 'border-green-500/40 text-green-500 bg-green-500/10'
                : 'border-primary/40 text-primary bg-primary/10',
            )}
          >
            {event.price}
          </span>
        </div>

        {/* Title */}
        <h1 className="font-serif font-bold text-3xl md:text-4xl text-foreground leading-tight">
          {event.title}
        </h1>

        {/* Date / time / location */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-muted-foreground text-sm font-display tracking-wide">
          <span className="flex items-center gap-1.5">
            <Clock size={13} />
            {formatEventDate(event.start, event.timezone)}
            {' · '}
            {formatEventTime(event.start, event.timezone)}
            {event.end && <> – {formatEventTime(event.end, event.timezone)}</>}
          </span>
          {event.location && (
            <span className="flex items-center gap-1.5 sm:before:content-['·'] sm:before:mx-1">
              <MapPin size={13} />
              {event.location}
            </span>
          )}
        </div>

        {/* Add to calendar link */}
        <a
          href={`data:text/calendar;charset=utf-8,${encodeURIComponent(generateICS(event))}`}
          download={`${event.id}.ics`}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <Calendar size={13} />
          Add to calendar
        </a>
      </div>

      {/* Description */}
      {(event.description || event.summary) && (
        <div className="prose prose-sm prose-invert max-w-none font-serif text-foreground/80 leading-relaxed whitespace-pre-wrap">
          {event.description || event.summary}
        </div>
      )}

      {/* Zap section */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h2 className="font-display text-xs tracking-widest uppercase text-muted-foreground">Support</h2>
        <div className="flex flex-wrap gap-3">
          {/* Zap the Artist */}
          {event.artistLightningAddress && (
            <ZapButton
              target={event.raw}
              lightningAddress={event.artistLightningAddress}
              className="flex items-center gap-2 text-sm font-display tracking-wider px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors"
              showCount={false}
            >
              <Zap size={14} />
              <span>Zap the Artist</span>
            </ZapButton>
          )}
          {/* Zap the Venue */}
          <ZapButton
            target={event.raw}
            className="flex items-center gap-2 text-sm font-display tracking-wider px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/80 transition-colors"
            showCount={false}
          >
            <Zap size={14} />
            <span>Zap the Venue</span>
          </ZapButton>
        </div>
        <p className="text-xs text-muted-foreground font-serif">
          {event.artistLightningAddress
            ? 'Send a lightning zap to support the artist or the venue.'
            : 'Send a lightning zap to support the venue.'}
        </p>
      </div>

      {/* RSVP section */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h2 className="font-display text-xs tracking-widest uppercase text-muted-foreground">Attendance</h2>

        {/* Avatar stack */}
        {rsvpsLoading ? (
          <div className="flex items-center gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="w-8 h-8 rounded-full" />
            ))}
          </div>
        ) : accepted.length > 0 ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              {accepted.slice(0, 8).map((r) => (
                <RSVPAvatar key={r.pubkey} pubkey={r.pubkey} />
              ))}
            </div>
            <span className="text-sm text-muted-foreground font-display tracking-wide flex items-center gap-1.5">
              <Users size={13} />
              {accepted.length + tentative.length} going
              {tentative.length > 0 && ` · ${tentative.length} maybe`}
            </span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground font-display tracking-wide">
            Be the first to RSVP
          </p>
        )}

        {/* RSVP buttons */}
        {user && (
          <div className="pt-1">
            {myRSVP?.status === 'accepted' || justRsvpd ? (
              <span className="flex items-center gap-2 text-sm font-display tracking-wider text-green-500">
                <CheckCircle2 size={14} />
                You're going!
                <button
                  onClick={() => handleRSVP('declined')}
                  className="ml-1 text-muted-foreground hover:text-destructive transition-colors text-xs"
                  disabled={rsvpPending}
                >
                  Cancel RSVP
                </button>
              </span>
            ) : myRSVP?.status === 'tentative' ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-display tracking-wider text-amber-500">Maybe going</span>
                <button
                  onClick={() => handleRSVP('accepted')}
                  className="text-xs font-display tracking-wider px-3 py-1 border border-primary/40 text-primary rounded hover:bg-primary/10 transition-colors"
                  disabled={rsvpPending}
                >
                  Confirm Going
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRSVP('accepted')}
                  disabled={rsvpPending}
                  className="text-sm font-display tracking-wider px-4 py-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/80 transition-colors disabled:opacity-50"
                >
                  {rsvpPending ? '...' : "I'm Going"}
                </button>
                <button
                  onClick={() => handleRSVP('tentative')}
                  disabled={rsvpPending}
                  className="text-sm font-display tracking-wider px-4 py-1.5 border border-border text-muted-foreground rounded hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-50"
                >
                  Maybe
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comments */}
      <CommentsSection
        root={event.raw}
        title="Comments"
        emptyStateMessage="No comments yet"
        emptyStateSubtitle="Be the first to share your thoughts about this show!"
      />
    </div>
  );
}
