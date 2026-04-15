import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Calendar, ExternalLink, Loader2 } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { EventCard } from '@/components/EventCard';
import { StageFilterBar } from '@/components/StageFilterBar';
import { useMaggieEvents } from '@/hooks/useMaggieEvents';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { LoginArea } from '@/components/auth/LoginArea';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { PageHero } from '@/components/PageHero';
import { ResponsiveImage } from '@/components/ResponsiveImage';
import { formatEventDate } from '@/lib/maggie';

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

const INITIAL_LIMIT = 20;
const LOAD_MORE_INCREMENT = 20;

export default function Events() {
  useSeoMeta({
    title: "Events — Maggie Mae's Bar Austin",
    description:
      "Upcoming live music events at Maggie Mae's on Sixth Street, Austin TX. Blues, rock, reggae, jazz, and more across our three stages.",
  });

  const [limit, setLimit] = useState(INITIAL_LIMIT);
  const { data: events, isLoading, isError } = useMaggieEvents(limit);
  const { user } = useCurrentUser();
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  const filteredEvents = selectedStage
    ? events?.filter((e) => e.stage === selectedStage)
    : events;

  const hasMore = filteredEvents && filteredEvents.length >= limit;

  return (
    <Layout>
      {/* ── PAGE HERO ─────────────────────────────────────────── */}
      <PageHero
        baseName="hero-austin"
        eyebrow="Live Music"
        title={<>What's <span className="gold-text">On Tonight</span></>}
        subtitle="Three stages, five bars, one legendary block on Sixth Street. Something's always happening at Maggie's."
      />

      {/* ── STAGE LEGEND (CLICKABLE) ────────────────────────────── */}
      <StageFilterBar selectedStage={selectedStage} onSelect={setSelectedStage} />

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

          {/* Events grid - grouped by day */}
          {!isLoading && !isError && filteredEvents && filteredEvents.length > 0 && (
            <>
              {(() => {
                const groups: { date: string; events: typeof filteredEvents }[] = [];
                let currentDate = '';

                for (const event of filteredEvents) {
                  const date = formatEventDate(event.start, event.timezone);
                  if (date !== currentDate) {
                    currentDate = date;
                    groups.push({ date, events: [] });
                  }
                  groups[groups.length - 1].events.push(event);
                }

                return groups.map((group) => (
                  <div key={group.date} className="mb-8">
                    <h3 className="font-serif text-lg font-bold text-foreground mb-4 pb-2 border-b border-border">
                      {group.date}
                    </h3>
                    <div className="flex flex-wrap gap-6">
                      {group.events.map((event) => (
                        <div key={`${event.raw.pubkey}:${event.id}`} className="w-full md:flex-[1_1_calc(50%-1.5rem)] md:min-w-0 md:lg:max-w-[calc(50%-1.5rem)]">
                          <EventCard event={event} />
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}

              {/* Load More button */}
              {hasMore && (
                <div className="mt-8 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setLimit((l) => l + LOAD_MORE_INCREMENT)}
                    className="flex items-center gap-2 font-display text-xs tracking-widest"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Load More
                  </Button>
                </div>
              )}

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

              {/* Nostr-powered badge */}
              <div className="mt-8 flex justify-center">
                <span className="flex items-center gap-2 text-xs text-muted-foreground font-display tracking-widest uppercase border border-border rounded-full px-4 py-1.5">
                  <svg className="w-4 h-4" viewBox="0 0 800 800" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M216.9,648.5c-8.4-15.9,0.5-28.8,7.8-42c-2.8-1.7-5.3,1.6-7.9,0.2c-2.4-7.9,3.2-17.2,12.6-20.5 c2.9-1,5.9-1.8,9-2.4c7.2-1.4,11-7.2,14.8-12.8c10.3-15.1,20.2-30.5,31.3-45c5.4-7.1,10.2-14.7,15.3-22.1c1.4-2,0.9-4.5,1.3-6.6 c2-9.1,7.6-15,15.5-17.8c8.4-3,14.2-9.1,20.8-14.3c4.6-3.6,8.8-7.7,12.9-11.9c5.3-5.6,10.3-11.4,14.6-18.3 c-4.8-2.5-10.1-2.8-15.1-4.1c-13-3.5-25.9-7.4-38.2-13c-5.7-2.6-11.3-5.7-16.2-9.7c-4.6-3.7-10-4-15.4-2c-4.4,1.7-9.1,1.8-13.6,2.7 c-10.3,2.2-19.2,7.2-27.9,12.9c-1.5,1-2.8,2.3-4.7,2.3c-2.2,0.1-3.3-0.7-3.6-3.2c-0.8-7-0.4-13.7,2.7-20c0.3-0.5,0.1-1.2,0.2-2.4 c-4.7,0-7.6,3.6-10.7,6c-3,2.3-5.2,5.7-7.8,8.6c-1.6,1.8-3.5,3.5-5.9,2.3c-2.2-1.1-3.2-3.4-3.5-6.1c-0.7-7.5,1.7-14.2,3.8-21.1 c0.3-1.1,1.5-2.1,0-3.2c-1-0.7-1.9-0.6-3-0.1c-4.1,2.1-8.5,3.4-12.4,6c-1.4,0.9-3.4,2.3-5,0.6c-1.2-1.3-1.9-2.8-1.3-5.3 c4.4-21,17.1-35.2,35-44.9c10.2-5.6,21.6-4.5,32.9-3.8c5.5,0.3,8.9,5.5,14.8,5.4c-0.5-2.9-2.6-4.6-3.7-6.8c-1.9-4-0.7-6.3,3.6-6.4 c7.7-0.1,15.4,0.2,23.1-0.1c14.3-0.5,27.8-3.1,41.1-9.6c16.2-7.8,31.9-16.7,48.5-23.5c11.6-4.8,23.5-8.1,35.8-10.7 c9.9-2,19.7-1.8,29.5-1.7c9.7,0.2,19.5,1,28.7,3.9c11.5,3.6,22.3,9,32.2,16c2.2,1.6,4.7,2.7,6.7,4.6c4.7,4.4,10.2,3,15.5,1.7 c4.9-1.2,9.9-1.4,14.5-0.3c18.9,4.5,40.6-8.7,43.4-28.9c1.5-10.8,0.7-20.9-5.7-29.5c-4.9-6.6-11.5-11.6-18-16.6 c-10.5-8.1-20.3-17.2-25.8-29.7c-2.8-6.3-5.7-13-4.3-20.3c0.4-1.9-1.3-2.7-1.8-3.9c3.8-4.7,4-10.8,5.9-16.1c0.1-0.3-0.8-1.3-0.2-1.6 c5-2.5,6.1-9.3,11.7-11.1c0.4-0.1,1-0.7,1.2-0.6c3.5,3,8.1,0.5,11.7,2.4c3.7,2,8,3,11.2,5.4c2.7,2.1,5.5,4.1,7.9,6.5 c1.5,1.4,3.2,2.2,4.7,2.4c8.1,1.1,15.4,5,23.2,6.9c1.2,0.3,2,1.1,1.7,2.3c-0.3,1.1-1.4,1.4-2.6,1.4c-3.3,0.2-6.7-0.7-10.5,1 c4.6,2.5,9.6,2.7,13.6,5.7c-2,1.7-3.8,3.1-5.8,4.7c-3.6-2.9-7.9-1.9-12.1-2c-4.8-0.1-9.6,0.1-14.3-0.1c-2.9-0.1-5.3,0.4-7.6,2.2 c-1,0.7-1.4,1.7-3.4,1.1c-4.4-1.4-8.4,2.9-6.9,7.3c1.8,5.1,4.2,9.9,10.3,11.7c3.9,1.2,5.1,6.5,8.8,8.7c0.4,0.3,0.8,1,1.4,1.4 c11.9,7.6,20.5,18.2,25.5,31.6c3.6,9.8,4.5,19.8,3,30.2c-2.6,19.2-12,34.8-24,49.1c-6.5,7.7-15.2,12.6-23,18.7 c-4.2,3.3-9,5.4-13.5,8.1c-5.3,3.1-7,7.4-4.4,12.9c1.8,3.9,0,7.6-0.3,11.3c-0.9,10.7-3.2,21-9.8,30c-7.8,10.6-18.3,17.3-30.1,21.9 c-17.9,7-36.6,8.2-55.5,7.6c-4.7-0.1-7.6,1.8-9.3,5.6c-2.3,4.9-6.1,8.3-10.7,10.2c-7.8,3.2-11.1,9.8-14,17.5 c4.8,0.3,8.7-0.3,11.9-3.7c0.3-0.3,0.7-0.8,1.1-0.8c17.1-1.3,32.4-9.4,48.8-13.6c5-1.3,10.4-2.1,14.7-4.7c6.5-3.8,12.8-1.5,19-0.5 c6.4,1,9.5,7,12.8,12.1c4.7,7.3,9.2,14.8,13.9,22.1c1.3,2,2.2,4,2.9,6.3c1.2,4.2,0.7,5.2-3.6,4.6c-6.9-0.9-11.4-5.8-15.9-10.5 c-2.3-2.4-4.5-5-6.8-7.6c-2.4,2.7-1.1,5.5-1.4,8c-0.2,1.4,2.3,3.4-0.5,4.2c-2.4,0.7-5,0.8-6.9-1.7c-2.4-3.1-3.5-6.7-3.7-10.6 c-0.2-4.8-1.6-6.2-6.3-5.3c-6.7,1.3-13.2,3.1-19.7,5.3c-8,2.7-15.9,5.6-24.1,7.9c-11.5,3.2-22.8,6.9-34.2,10.2 c-1.6,0.5-3.3,1.7-3.8,2.4c-2.8,3.5-7.4,3.3-10.5,6.2c-2.1,1.9-9.9-2.3-12.1-6.2c-1.2-2.1-1.7-4.5-2.2-7c-2-8.9,3.9-15.5,5.7-23.3 c1.4-6.1,5.6-10.5,8.2-16c0.2-0.5,0.2-1.2,0.2-1.8c-0.8-0.9-1.8-0.9-2.6-0.4c-5.1,3.3-11,4.5-16.6,6.2c-6.1,1.8-11.1,5.5-15.4,9.8 c-4,4-8.6,6.9-13.1,10.1c-6,4.4-10.7,10.6-17.8,13.6c-1.1,0.5-1.1,1.7-1.3,2.8c-2.1,10.1-8.6,16.2-17.8,19.6 c-2.2,0.8-3.7,2.3-5.1,4.1c-8.6,11.1-17.2,22-25.7,33.1c-8.3,10.9-17,21.5-24.5,32.9c-4.3,6.6-8.4,13.4-12.2,20.3 c-3.5,6.3-9.6,10.6-14.3,16c-6.1,7.1-12.9,13.8-15.6,23.4C222.4,645.4,221.3,648.1,216.9,648.5z" />
                  </svg>
                  Powered by Nostr
                </span>
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
