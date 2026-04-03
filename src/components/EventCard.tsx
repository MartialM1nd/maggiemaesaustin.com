import { useState, useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { Clock, MapPin, CheckCircle2, Users, ArrowRight, Calendar, Zap } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ZapButton } from '@/components/ZapButton';
import { useEventRSVPs, filterRSVPs } from '@/hooks/useEventRSVPs';
import { usePublishRSVP } from '@/hooks/usePublishMaggieEvent';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { isValidImageUrl } from '@/lib/validation';
import {
  formatEventDay,
  formatEventMonth,
  formatEventTime,
  eventCoordinate,
  generateICS,
  type MaggieEvent,
} from '@/lib/maggie';
import { MAGGIE_MAES_PUBKEY, STAGE_COLORS } from '@/lib/config';
import { cn } from '@/lib/utils';

function RSVPAvatar({ pubkey }: { pubkey: string }) {
  const author = useAuthor(pubkey);
  const meta = author.data?.metadata;
  const name = meta?.name ?? genUserName(pubkey);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Avatar className="w-7 h-7 border-2 border-background -ml-2 first:ml-0 hover:z-10 relative transition-transform hover:scale-110">
          <AvatarImage src={isValidImageUrl(meta?.picture || '') ? meta?.picture : undefined} alt={name} />
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

interface EventCardProps {
  event: MaggieEvent;
}

export const EventCard = memo(function EventCard({ event }: EventCardProps) {
  const { user } = useCurrentUser();
  const { data: rsvps = [], isLoading: rsvpsLoading } = useEventRSVPs(event);
  const { mutate: publishRSVP, isPending: rsvpPending } = usePublishRSVP();
  const [justRsvpd, setJustRsvpd] = useState(false);

  const coord = eventCoordinate(event);
  const accepted = useMemo(() => filterRSVPs(rsvps, 'accepted'), [rsvps]);
  const tentative = useMemo(() => filterRSVPs(rsvps, 'tentative'), [rsvps]);

  // Find the current user's RSVP if they have one
  const myRSVP = useMemo(() => 
    user ? rsvps.find((r) => r.pubkey === user.pubkey) : undefined,
    [user, rsvps]
  );

  const handleRSVP = (status: 'accepted' | 'declined' | 'tentative') => {
    if (!user) return;
    publishRSVP(
      {
        eventCoord: coord,
        eventAuthorPubkey: MAGGIE_MAES_PUBKEY,
        status,
      },
      {
        onSuccess: () => setJustRsvpd(true),
      },
    );
  };

  const stageClass = STAGE_COLORS[event.stage] ?? { border: 'border-primary', text: 'text-primary' };

  return (
    <div className="group relative flex bg-card border border-border rounded-lg overflow-hidden hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
      {/* Date column */}
      <div className="flex-none flex flex-col items-center justify-center bg-primary/10 border-r border-border w-20 text-center px-3 py-4 gap-0.5">
        <span className="font-display text-primary text-xs tracking-widest uppercase leading-none">
          {formatEventMonth(event.start, event.timezone)}
        </span>
        <span className="font-serif font-black text-4xl text-foreground leading-none">
          {formatEventDay(event.start, event.timezone)}
        </span>
      </div>

      {/* Image */}
      {event.image && isValidImageUrl(event.image) && (
        <div className="flex-none w-28 md:w-36 overflow-hidden">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
        {/* Top row: stage badge + time */}
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {event.stage && (
              <span
                className={cn(
                  'border rounded-full px-2 py-0.5 text-xs font-display tracking-wider flex-shrink-0',
                  stageClass.border,
                  stageClass.text,
                )}
              >
                {event.stage}
              </span>
            )}
            <span className="text-muted-foreground text-xs font-display tracking-wider flex items-center gap-1">
              <Clock size={10} />
              {formatEventTime(event.start, event.timezone)}
              {event.end && (
                <> – {formatEventTime(event.end, event.timezone)}</>
              )}
            </span>
            <a
              href={`data:text/calendar;charset=utf-8,${encodeURIComponent(generateICS(event))}`}
              download={`${event.id}.ics`}
              className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Calendar size={10} />
              Add to calendar
            </a>
          </div>

          <h3 className="font-serif font-bold text-lg text-foreground leading-tight mb-1">
            {event.title}
          </h3>

          {event.summary && (
            <p className="text-muted-foreground text-sm font-serif leading-relaxed line-clamp-2">
              {event.summary || event.description}
            </p>
          )}

          {event.location && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1 font-display tracking-wide">
              <MapPin size={10} className="flex-shrink-0" />
              {event.location}
            </p>
          )}
        </div>

        {/* Bottom row: price + RSVPs + RSVP button */}
        <div className="mt-3 pt-2 border-t border-border space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'font-display text-sm font-bold',
                  event.price === 'Free' || event.price === 'free'
                    ? 'text-green-500'
                    : 'text-primary',
                )}
              >
                {event.price}
              </span>

              {/* Zap the Artist button */}
              {event.artistLightningAddress && (
                <ZapButton
                  target={event.raw}
                  lightningAddress={event.artistLightningAddress}
                  className="flex items-center gap-1 text-xs font-display tracking-wider px-2.5 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/30 rounded hover:bg-amber-500/20 transition-colors"
                  showCount={false}
                >
                  <Zap size={10} />
                  <span>Zap Artist</span>
                </ZapButton>
              )}
            </div>

            {/* Details link */}
            <Link
              to={`/${nip19.naddrEncode({ kind: 31923, pubkey: event.raw.pubkey, identifier: event.id })}`}
              className="flex items-center gap-1 text-xs font-display tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors"
            >
              Details <ArrowRight size={10} />
            </Link>
          </div>

          {/* RSVP section */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Avatar stack */}
            <div className="flex items-center gap-1.5">
              {!rsvpsLoading && accepted.length > 0 && (
                <div className="flex items-center">
                  <div className="flex items-center">
                    {accepted.slice(0, 5).map((r) => (
                      <RSVPAvatar key={r.pubkey} pubkey={r.pubkey} />
                    ))}
                  </div>
                  <span className="ml-2 text-xs text-muted-foreground font-display tracking-wide flex items-center gap-1">
                    <Users size={10} />
                    {accepted.length + tentative.length} going
                    {tentative.length > 0 && ` · ${tentative.length} maybe`}
                  </span>
                </div>
              )}
              {!rsvpsLoading && accepted.length === 0 && (
                <span className="text-xs text-muted-foreground font-display tracking-wide">
                  Be the first to RSVP
                </span>
              )}
            </div>

            {/* RSVP button — only show if logged in */}
            {user && (
              <div className="flex items-center gap-1.5">
                {myRSVP?.status === 'accepted' || justRsvpd ? (
                  <span className="flex items-center gap-1 text-xs font-display tracking-wider text-green-500">
                    <CheckCircle2 size={12} />
                    Going!
                    <button
                      onClick={() => handleRSVP('declined')}
                      className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                      disabled={rsvpPending}
                    >
                      ✕
                    </button>
                  </span>
                ) : myRSVP?.status === 'tentative' ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-display tracking-wider text-amber-500">Maybe</span>
                    <button
                      onClick={() => handleRSVP('accepted')}
                      className="text-xs font-display tracking-wider px-2 py-0.5 border border-primary/40 text-primary rounded hover:bg-primary/10 transition-colors"
                      disabled={rsvpPending}
                    >
                      Going
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleRSVP('accepted')}
                      disabled={rsvpPending}
                      className="text-xs font-display tracking-wider px-2.5 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/80 transition-colors disabled:opacity-50"
                    >
                      {rsvpPending ? '...' : 'Going'}
                    </button>
                    <button
                      onClick={() => handleRSVP('tentative')}
                      disabled={rsvpPending}
                      className="text-xs font-display tracking-wider px-2.5 py-1 border border-border text-muted-foreground rounded hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-50"
                    >
                      Maybe
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
