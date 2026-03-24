import { useSeoMeta } from '@unhead/react';
import { Calendar, Music, ExternalLink, Clock } from 'lucide-react';
import { Layout } from '@/components/Layout';

// Placeholder events - in a real build, these would come from a ticketing API or Nostr events
const upcomingEvents = [
  {
    date: 'Fri, Apr 4',
    day: '4',
    month: 'APR',
    time: '9:00 PM',
    title: 'Texas Blues Night',
    description: 'Three local blues bands light up the Deck stage. Expect slide guitar, cold Lone Stars, and a crowd that knows every lick.',
    stage: 'The Deck',
    cover: '$10',
    image: 'https://cdn.prod.website-files.com/65c1b14078b4951e080348fb/65cd2976992dcbdd6bdc0c5e_sixth6-min.jpg',
  },
  {
    date: 'Sat, Apr 5',
    day: '5',
    month: 'APR',
    time: '8:00 PM',
    title: 'Red River Revival',
    description: 'Alt-country and Americana sounds fill the Bar & Lounge. Local favorites bring the heart of the Hill Country to Sixth Street.',
    stage: 'Bar & Lounge',
    cover: '$8',
    image: 'https://cdn.prod.website-files.com/65c1b14078b4951e080348fb/65ccf93d9bfea9513f36eab5_100A0387-min.jpg',
  },
  {
    date: 'Thu, Apr 10',
    day: '10',
    month: 'APR',
    time: '7:30 PM',
    title: 'Open Mic Night',
    description: "Austin's best undiscovered talent takes the Pub stage. Every Thursday. Sign-up at the bar starting at 7 PM.",
    stage: 'The Pub',
    cover: 'Free',
    image: 'https://cdn.prod.website-files.com/65c1b14078b4951e080348fb/65ccf93d56be00d2d52b2944_100A0465-min.jpg',
  },
  {
    date: 'Fri, Apr 11',
    day: '11',
    month: 'APR',
    time: '9:30 PM',
    title: 'Rooftop Reggae',
    description: 'The Deck opens wide for a night of Caribbean rhythms with a view of the Austin skyline. Rum drinks on special.',
    stage: 'The Deck',
    cover: '$12',
    image: 'https://cdn.prod.website-files.com/65c1b14078b4951e080348fb/65cd1f6d6555cf9454a763fb_upstairs11-min.jpg',
  },
  {
    date: 'Sat, Apr 12',
    day: '12',
    month: 'APR',
    time: '8:00 PM',
    title: 'Classic Rock Saturday',
    description: 'Tribute bands covering the legends. Zeppelin, Stones, Hendrix — all under one roof with five bars to explore.',
    stage: 'Bar & Lounge',
    cover: '$15',
    image: 'https://cdn.prod.website-files.com/65c1b14078b4951e080348fb/65cd2976d193be8759f2b867_sixth3-min.jpg',
  },
  {
    date: 'Sun, Apr 13',
    day: '13',
    month: 'APR',
    time: '3:00 PM',
    title: 'Sunday Afternoon Jazz',
    description: 'Wind down the weekend with smooth jazz in The Pub. Craft cocktails, patio seating, and Austin sunshine.',
    stage: 'The Pub',
    cover: 'Free',
    image: 'https://cdn.prod.website-files.com/65c1b14078b4951e080348fb/65ccf93c9bfea9513f36ea83_100A0437-min.jpg',
  },
];

const stageColors: Record<string, string> = {
  'The Deck': 'border-primary text-primary',
  'Bar & Lounge': 'border-accent text-accent',
  'The Pub': 'border-muted-foreground text-muted-foreground',
};

export default function Events() {
  useSeoMeta({
    title: "Events — Maggie Mae's Bar Austin",
    description:
      'Upcoming live music events at Maggie Mae\'s on Sixth Street, Austin TX. Blues, rock, reggae, jazz, and more across our three stages.',
  });

  return (
    <Layout>
      {/* ── PAGE HERO ─────────────────────────────────────────── */}
      <section className="relative isolate pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src="https://cdn.prod.website-files.com/65c1b14078b4951e080348fb/65cd2976d193be8759f2b867_sixth3-min.jpg"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-background/80 to-background" />
        </div>
        <div className="container mx-auto px-4 md:px-8 text-center">
          <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-3">Live Music</p>
          <h1 className="font-serif text-5xl md:text-6xl font-black text-foreground mb-4">
            What's <span className="gold-text">On Tonight</span>
          </h1>
          <p className="text-muted-foreground font-serif text-lg max-w-lg mx-auto">
            Three stages, five bars, one legendary block on Sixth Street. Something's always happening at Maggie's.
          </p>
        </div>
      </section>

      {/* ── LEGEND ────────────────────────────────────────────── */}
      <section className="bg-card border-b border-border py-4">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
            <span className="font-display text-muted-foreground text-xs tracking-widest uppercase">Stages:</span>
            {Object.entries(stageColors).map(([stage, cls]) => (
              <span
                key={stage}
                className={`flex items-center gap-1.5 border rounded-full px-3 py-0.5 text-xs font-display tracking-wider ${cls}`}
              >
                <Music size={10} />
                {stage}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── EVENTS LIST ───────────────────────────────────────── */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {upcomingEvents.map((event, i) => (
              <div
                key={i}
                className="group relative flex bg-card border border-border rounded-lg overflow-hidden hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300"
              >
                {/* Left date column */}
                <div className="flex-none flex flex-col items-center justify-center bg-primary/10 border-r border-border w-20 text-center px-3 py-4">
                  <span className="font-display text-primary text-xs tracking-widest uppercase">{event.month}</span>
                  <span className="font-serif font-black text-4xl text-foreground leading-none">{event.day}</span>
                </div>

                {/* Image */}
                <div className="flex-none w-28 md:w-36 overflow-hidden">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span
                        className={`border rounded-full px-2 py-0.5 text-xs font-display tracking-wider flex-shrink-0 ${stageColors[event.stage] ?? 'border-primary text-primary'}`}
                      >
                        {event.stage}
                      </span>
                      <span className="text-muted-foreground text-xs font-display tracking-wider flex items-center gap-1">
                        <Clock size={10} />
                        {event.time}
                      </span>
                    </div>
                    <h3 className="font-serif font-bold text-lg text-foreground leading-tight mb-1">{event.title}</h3>
                    <p className="text-muted-foreground text-sm font-serif leading-relaxed line-clamp-2">{event.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                    <span className={`font-display text-sm font-bold ${event.cover === 'Free' ? 'text-green-500' : 'text-primary'}`}>
                      {event.cover}
                    </span>
                    <a
                      href="https://www.maggiemaesaustin.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-display tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors"
                    >
                      Details <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* "More events" prompt */}
          <div className="mt-12 text-center">
            <div className="inline-flex flex-col items-center gap-4 p-8 border border-dashed border-primary/30 rounded-lg">
              <Calendar className="text-primary/50 w-8 h-8" />
              <p className="font-serif text-muted-foreground text-sm max-w-sm">
                For the full calendar and ticket links, visit the official Maggie Mae's website or follow us on Instagram and Nostr.
              </p>
              <a
                href="https://www.maggiemaesaustin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2.5 border border-primary text-primary font-display text-xs tracking-widest uppercase rounded hover:bg-primary/10 transition-colors"
              >
                Full Calendar <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRIVATE EVENTS CTA ────────────────────────────────── */}
      <section className="py-20 bg-card relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-10">
          <img
            src="https://cdn.prod.website-files.com/65c1b14078b4951e080348fb/65ccf93c9bfea9513f36ea83_100A0437-min.jpg"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="container mx-auto px-4 md:px-8 text-center">
          <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-3">Private Events</p>
          <h2 className="font-serif text-4xl md:text-5xl font-black text-foreground mb-4">
            Make It <span className="gold-text">Your Night</span>
          </h2>
          <p className="text-muted-foreground font-serif text-lg max-w-lg mx-auto mb-8">
            Corporate parties, birthday bashes, band showcases, or wedding after-parties — we have the space, the staff, and the sound.
          </p>
          <a
            href="https://form.typeform.com/to/gAECOx5v"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground font-display text-sm tracking-widest uppercase rounded hover:bg-primary/80 transition-all shadow-lg shadow-primary/30"
          >
            Inquire About Booking <ExternalLink size={14} />
          </a>
        </div>
      </section>
    </Layout>
  );
}
