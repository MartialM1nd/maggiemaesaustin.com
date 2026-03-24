import { useSeoMeta } from '@unhead/react';
import { MapPin, Clock, ExternalLink, Zap } from 'lucide-react';
import { Layout } from '@/components/Layout';

const hours = [
  { day: 'Monday', open: '4:00 PM', close: '12:00 AM' },
  { day: 'Tuesday', open: '4:00 PM', close: '12:00 AM' },
  { day: 'Wednesday', open: '4:00 PM', close: '2:00 AM' },
  { day: 'Thursday', open: '4:00 PM', close: '2:00 AM' },
  { day: 'Friday', open: '2:00 PM', close: '2:00 AM' },
  { day: 'Saturday', open: '12:00 PM', close: '2:00 AM' },
  { day: 'Sunday', open: '12:00 PM', close: '12:00 AM' },
];

const TODAY_INDEX = new Date().getDay(); // 0=Sun, 1=Mon…
// Map JS day index (0=Sun) to our array index (0=Mon)
const todayArrayIndex = TODAY_INDEX === 0 ? 6 : TODAY_INDEX - 1;

export default function Contact() {
  useSeoMeta({
    title: "Contact & Hours — Maggie Mae's Bar Austin",
    description:
      "Find Maggie Mae's at 323 E. 6th Street, Austin TX. Hours, directions, socials, Bitcoin accepted.",
  });

  return (
    <Layout>
      {/* ── PAGE HERO ─────────────────────────────────────────── */}
      <section className="relative isolate pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src="https://cdn.prod.website-files.com/65c1b14078b4951e080348fb/65ccf93c9bfea9513f36ea83_100A0437-min.jpg"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-background/80 to-background" />
        </div>
        <div className="container mx-auto px-4 md:px-8 text-center">
          <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-3">Come See Us</p>
          <h1 className="font-serif text-5xl md:text-6xl font-black text-foreground mb-4">
            Find <span className="gold-text">Maggie Mae's</span>
          </h1>
          <p className="text-muted-foreground font-serif text-lg max-w-lg mx-auto">
            Right in the heart of Sixth Street — the Live Music Capital of the World.
          </p>
        </div>
      </section>

      {/* ── MAIN CONTENT ──────────────────────────────────────── */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">

            {/* LEFT: Address + Map + Hours */}
            <div className="space-y-8">
              {/* Address card */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="text-primary w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-bold text-foreground mb-1">Sixth Street Location</h2>
                    <address className="not-italic text-muted-foreground font-serif text-base leading-relaxed">
                      323 E. 6th Street<br />
                      Austin, Texas 78701
                    </address>
                  </div>
                </div>
                <a
                  href="https://maps.app.goo.gl/CygEtrx3L337ge19A"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2 border border-primary text-primary font-display text-xs tracking-widest uppercase rounded hover:bg-primary/10 transition-colors"
                >
                  Get Directions <ExternalLink size={12} />
                </a>
              </div>

              {/* Embedded map */}
              <div className="rounded-lg overflow-hidden border border-border" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
                <iframe
                  title="Maggie Mae's Map"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3445.972516085832!2d-97.73854502394213!3d30.264637874867985!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8644b5009fbbb68b%3A0x32124ef67a01bf6!2sMaggie%20Mae&#39;s!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus"
                  width="100%"
                  height="280"
                  style={{ border: 0, filter: 'grayscale(60%) sepia(30%) contrast(1.1)' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              {/* Hours */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="text-primary w-5 h-5" />
                  </div>
                  <h2 className="font-serif text-xl font-bold text-foreground">Hours</h2>
                </div>
                <ul className="space-y-2">
                  {hours.map((h, i) => {
                    const isToday = i === todayArrayIndex;
                    return (
                      <li
                        key={h.day}
                        className={`flex items-center justify-between py-2 border-b border-border last:border-0 ${
                          isToday ? 'text-primary' : 'text-muted-foreground'
                        }`}
                      >
                        <span className={`font-display text-xs tracking-widest uppercase ${isToday ? 'text-primary font-bold' : ''}`}>
                          {h.day}
                          {isToday && (
                            <span className="ml-2 px-1.5 py-0.5 bg-primary/20 text-primary text-[10px] rounded tracking-wider">Today</span>
                          )}
                        </span>
                        <span className="font-serif text-sm">
                          {h.open} – {h.close}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {/* RIGHT: Socials, Bitcoin, Private Events */}
            <div className="space-y-8">
              {/* Socials */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="font-serif text-xl font-bold text-foreground mb-5">Follow Along</h2>
                <div className="space-y-4">
                  {/* Instagram */}
                  <a
                    href="https://www.instagram.com/maggiemaesaustin/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-background border border-border rounded-lg hover:border-primary/40 hover:bg-primary/5 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-xs tracking-widest uppercase text-muted-foreground">Instagram</p>
                      <p className="text-foreground font-serif group-hover:text-primary transition-colors">@maggiemaesaustin</p>
                    </div>
                    <ExternalLink size={14} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </a>

                  {/* Nostr */}
                  <a
                    href="https://nostr.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-background border border-border rounded-lg hover:border-primary/40 hover:bg-primary/5 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-900 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-purple-300" fill="currentColor" viewBox="0 0 100 100">
                        <path d="M50 5C25.1 5 5 25.1 5 50s20.1 45 45 45 45-20.1 45-45S74.9 5 50 5zm0 8c9.8 0 18.7 3.7 25.5 9.7L22.3 69.9C17.1 63.3 14 54.9 14 46c0-20.4 16.6-33 36-33zm0 74c-9.8 0-18.7-3.7-25.5-9.7l53.2-47.2C82.9 36.7 86 45.1 86 54c0 20.4-16.6 33-36 33z"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-xs tracking-widest uppercase text-muted-foreground">Nostr</p>
                      <p className="text-foreground font-serif group-hover:text-primary transition-colors">Follow on Nostr</p>
                    </div>
                    <ExternalLink size={14} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </a>
                </div>
              </div>

              {/* Bitcoin */}
              <div className="bg-card border border-primary/30 rounded-lg p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 text-primary/5 font-black text-[10rem] leading-none select-none -mt-4 -mr-4">₿</div>
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Zap className="text-primary w-5 h-5" />
                    </div>
                    <h2 className="font-serif text-xl font-bold text-foreground">Bitcoin Accepted</h2>
                  </div>
                  <p className="text-muted-foreground font-serif leading-relaxed mb-4">
                    Maggie Mae's is proud to accept Bitcoin — on-chain and via the Lightning Network. Pay for rounds, tabs, and private event bookings with sats.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-primary/10 border border-primary/30 text-primary text-xs font-display tracking-wider uppercase rounded">
                      ⚡ Lightning
                    </span>
                    <span className="px-3 py-1 bg-primary/10 border border-primary/30 text-primary text-xs font-display tracking-wider uppercase rounded">
                      ₿ On-Chain
                    </span>
                  </div>
                </div>
              </div>

              {/* Private Events */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="font-serif text-xl font-bold text-foreground mb-3">Private Events</h2>
                <p className="text-muted-foreground font-serif leading-relaxed mb-5">
                  With 11,000 sq ft and three distinct spaces — The Deck, Bar & Lounge, and The Pub — Maggie Mae's is the perfect venue for corporate events, private parties, and band showcases. We accommodate up to 987 guests.
                </p>
                <ul className="space-y-2 mb-5">
                  {[
                    'Corporate events & company parties',
                    'Birthday & celebration parties',
                    'Band showcases & album releases',
                    'Wedding after-parties',
                    'Full venue buyouts available',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground font-serif">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href="https://form.typeform.com/to/gAECOx5v"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-display text-xs tracking-widest uppercase rounded hover:bg-primary/80 transition-all shadow-md shadow-primary/20"
                >
                  Book a Private Event <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
