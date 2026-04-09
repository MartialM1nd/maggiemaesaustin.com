import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Calendar, Music, ExternalLink } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { EventCard } from '@/components/EventCard';
import { useMaggieEvents } from '@/hooks/useMaggieEvents';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { LoginArea } from '@/components/auth/LoginArea';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { STAGE_COLORS } from '@/lib/config';
import { ResponsiveImage } from '@/components/ResponsiveImage';

function EventSkeleton() {
  return (
    <div className="flex bg-card border border-border rounded-lg overflow-hidden">
      <div className="flex-none w-20 bg-primary/10 border-r border-border" />
      <div className="flex-none w-28 md:w-36">
        <Skeleton className="w-full h-full min-h-[120px]" />
      </div>
      <div className="flex-1 p-4 space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex justify-between pt-2 border-t border-border">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

export default function Events() {
  useSeoMeta({
    title: "Events — Maggie Mae's Bar Austin",
    description:
      "Upcoming live music events at Maggie Mae's on Sixth Street, Austin TX. Blues, rock, reggae, jazz, and more across our three stages.",
  });

  const { data: events, isLoading, isError } = useMaggieEvents();
  const { user } = useCurrentUser();
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  const filteredEvents = selectedStage
    ? events?.filter((e) => e.stage === selectedStage)
    : events;

  return (
    <Layout>
      {/* ── PAGE HERO ─────────────────────────────────────────── */}
      <section className="relative isolate pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <ResponsiveImage
            baseName="hero-austin"
            alt=""
            className="w-full h-full object-cover object-top"
            sizes="100vw"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-background/80 to-background" />
        </div>
        <div className="container mx-auto px-4 md:px-8 text-center">
          <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-3">
            Live Music
          </p>
          <h1 className="font-serif text-5xl md:text-6xl font-black text-foreground mb-4">
            What's <span className="gold-text">On Tonight</span>
          </h1>
          <p className="text-muted-foreground font-serif text-lg max-w-lg mx-auto">
            Three stages, five bars, one legendary block on Sixth Street. Something's always
            happening at Maggie's.
          </p>
        </div>
      </section>

      {/* ── STAGE LEGEND (CLICKABLE) ────────────────────────────── */}
      <section className="bg-card border-b border-border py-4">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-wrap items-center gap-4 justify-center">
            <span className="font-display text-muted-foreground text-xs tracking-widest uppercase">
              Filter:
            </span>
            {Object.entries(STAGE_COLORS).map(([stage, colors]) => {
              const isActive = selectedStage === stage;
              return (
                <button
                  key={stage}
                  onClick={() => setSelectedStage(isActive ? null : stage)}
                  className={`flex items-center gap-1.5 border rounded px-3 py-1 text-xs font-display tracking-wider transition-all ${
                    isActive
                      ? `bg-${colors.border.replace('border-', '')} bg-${colors.text.replace('text-', '')} text-white border-transparent`
                      : `${colors.border} ${colors.text} hover:opacity-80 cursor-pointer`
                  }`}
                >
                  <Music size={10} />
                  {stage}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── LOGIN PROMPT (if not logged in) ───────────────────── */}
      {!user && (
        <div className="bg-background border-b border-border py-3">
          <div className="container mx-auto px-4 md:px-8">
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground font-serif">
              <span>Log in with Nostr to RSVP to events</span>
              <LoginArea className="max-w-xs" />
            </div>
          </div>
        </div>
      )}

      {/* ── EVENTS LIST ───────────────────────────────────────── */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 md:px-8">

          {/* Loading */}
          {isLoading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <EventSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="text-center py-16">
              <p className="text-muted-foreground font-serif">
                Could not load events. Please try again later.
              </p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !isError && !filteredEvents?.length && (
            <div className="flex justify-center">
              <div className="inline-flex flex-col items-center gap-4 p-10 border border-dashed border-primary/30 rounded-lg max-w-md text-center">
                <Calendar className="text-primary/40 w-10 h-10" />
                <div>
                  <p className="font-serif text-foreground font-semibold mb-1">
                    {selectedStage ? `No events at ${selectedStage}` : 'No upcoming events'}
                  </p>
                  <p className="text-muted-foreground font-serif text-sm">
                    {selectedStage ? (
                      <button
                        onClick={() => setSelectedStage(null)}
                        className="text-primary hover:underline"
                      >
                        Show all events
                      </button>
                    ) : (
                      'Check back soon — we publish events on Nostr. Follow us to get notified.'
                    )}
                  </p>
                </div>
                <a
                  href="https://ditto.pub/maggiemaes@nostr.place"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2 border border-primary text-primary font-display text-xs tracking-widest uppercase rounded hover:bg-primary/10 transition-colors"
                >
                  Follow on Nostr <ExternalLink size={11} />
                </a>
              </div>
            </div>
          )}

          {/* Events grid */}
          {!isLoading && !isError && filteredEvents && filteredEvents.length > 0 && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredEvents.map((event) => (
                  <EventCard key={`${event.raw.pubkey}:${event.id}`} event={event} />
                ))}
              </div>

              {/* Nostr-powered badge */}
              <div className="mt-10 flex justify-center">
                <span className="flex items-center gap-2 text-xs text-muted-foreground font-display tracking-widest uppercase border border-border rounded-full px-4 py-1.5">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 100 100">
                    <path d="M50 5C25.1 5 5 25.1 5 50s20.1 45 45 45 45-20.1 45-45S74.9 5 50 5zm0 8c9.8 0 18.7 3.7 25.5 9.7L22.3 69.9C17.1 63.3 14 54.9 14 46c0-20.4 16.6-33 36-33zm0 74c-9.8 0-18.7-3.7-25.5-9.7l53.2-47.2C82.9 36.7 86 45.1 86 54c0 20.4-16.6 33-36 33z" />
                  </svg>
                  Powered by Nostr
                </span>
              </div>
            </>
          )}

          {/* More events prompt */}
          {!isLoading && (
            <div className="mt-12 text-center">
              <div className="inline-flex flex-col items-center gap-4 p-8 border border-dashed border-primary/30 rounded-lg">
                <p className="font-serif text-muted-foreground text-sm max-w-sm">
                  Looking for more? Check out the full calendar here.
                </p>
                <Link
                  to="/calendar"
                  className="inline-flex items-center gap-2 px-6 py-2.5 border border-primary text-primary font-display text-xs tracking-widest uppercase rounded hover:bg-primary/10 transition-colors"
                >
                  Full Calendar
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── PRIVATE EVENTS CTA ────────────────────────────────── */}
      <section className="py-20 bg-card relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-10">
          <ResponsiveImage
            baseName="hero-austin"
            alt=""
            className="w-full h-full object-cover object-bottom"
            sizes="100vw"
          />
        </div>
        <div className="container mx-auto px-4 md:px-8 text-center">
          <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-3">
            Private Events
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-black text-foreground mb-4">
            Make It <span className="gold-text">Your Night</span>
          </h2>
          <p className="text-muted-foreground font-serif text-lg max-w-lg mx-auto mb-8">
            Corporate parties, birthday bashes, band showcases, or wedding after-parties — we
            have the space, the staff, and the sound.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="https://form.typeform.com/to/gAECOx5v"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground font-display text-sm tracking-widest uppercase rounded hover:bg-primary/80 transition-all shadow-lg shadow-primary/30"
            >
              Inquire About Booking <ExternalLink size={14} />
            </a>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-8 py-3.5 border border-primary/50 text-primary font-display text-sm tracking-widest uppercase rounded hover:bg-primary/10 transition-all"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
