import { useSeoMeta } from '@unhead/react';
import { MapPin, Clock, ExternalLink, Zap, Phone, MessageSquare, Mail, Wine, Users } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { ResponsiveImage } from '@/components/ResponsiveImage';

const hours = [
  { day: 'Monday', open: '7:00 PM', close: '2:00 AM' },
  { day: 'Tuesday', open: '7:00 PM', close: '2:00 AM' },
  { day: 'Wednesday', open: '7:00 PM', close: '2:00 AM' },
  { day: 'Thursday', open: '7:00 PM', close: '2:00 AM' },
  { day: 'Friday', open: '7:00 PM', close: '2:00 AM' },
  { day: 'Saturday', open: '7:00 PM', close: '2:00 AM' },
  { day: 'Sunday', open: '', close: '' },
];

const TODAY_INDEX = new Date().getDay();
const todayArrayIndex = TODAY_INDEX === 0 ? 6 : TODAY_INDEX - 1;

export default function Contact() {
  useSeoMeta({
    title: "Contact & Hours — Maggie Mae's Bar Austin",
    description:
      "Find Maggie Mae's at 323 E. 6th Street, Austin TX. Hours, directions, socials, Bitcoin accepted.",
  });

  return (
    <Layout>
      <section className="relative isolate pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <ResponsiveImage
            baseName="bar-interior"
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

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">

            {/* LEFT: Private Events, Contact, Follow Along */}
            <div className="lg:order-1 space-y-8">
              {/* Private Events */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Wine className="text-primary w-5 h-5" />
                  </div>
                  <h2 className="font-serif text-xl font-bold text-foreground">Private Events</h2>
                </div>
                <p className="text-muted-foreground font-serif leading-relaxed mb-5">
                  With 11,000 sq ft and five distinct spaces — Rooftop Patio, Disco Room, Piano Room, Gibson Room, and The Pub — Maggie Mae's is the perfect venue for corporate events, private parties, and band showcases. We accommodate up to 987 guests.
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

              {/* Contact */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="text-primary w-5 h-5" />
                  </div>
                  <h2 className="font-serif text-xl font-bold text-foreground">Contact</h2>
                </div>
                <p className="text-muted-foreground font-serif text-sm mb-4">
                  Phone: 512-478-8541 &nbsp;&nbsp; Email: info@maggiemaesaustin.com
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href="tel:+15124788541"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-primary text-primary font-display text-xs tracking-widest uppercase rounded hover:bg-primary/10 transition-colors"
                  >
                    <Phone size={14} /> Call
                  </a>
                  <a
                    href="sms:+15124788541"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-primary text-primary font-display text-xs tracking-widest uppercase rounded hover:bg-primary/10 transition-colors"
                  >
                    <MessageSquare size={14} /> Text
                  </a>
                  <a
                    href="mailto:info@maggiemaesaustin.com"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-primary text-primary font-display text-xs tracking-widest uppercase rounded hover:bg-primary/10 transition-colors"
                  >
                    <Mail size={14} /> Email
                  </a>
                </div>
              </div>

              {/* Follow Along */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Users className="text-primary w-5 h-5" />
                  </div>
                  <h2 className="font-serif text-xl font-bold text-foreground">Follow Along</h2>
                </div>
                <div className="space-y-4">
                  <a
                    href="https://ditto.pub/maggiemaes@nostr.place"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-background border border-border rounded-lg hover:border-primary/40 hover:bg-primary/5 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <svg className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" viewBox="0 0 800 800" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M216.9,648.5c-8.4-15.9,0.5-28.8,7.8-42c-2.8-1.7-5.3,1.6-7.9,0.2c-2.4-7.9,3.2-17.2,12.6-20.5 c2.9-1,5.9-1.8,9-2.4c7.2-1.4,11-7.2,14.8-12.8c10.3-15.1,20.2-30.5,31.3-45c5.4-7.1,10.2-14.7,15.3-22.1c1.4-2,0.9-4.5,1.3-6.6 c2-9.1,7.6-15,15.5-17.8c8.4-3,14.2-9.1,20.8-14.3c4.6-3.6,8.8-7.7,12.9-11.9c5.3-5.6,10.3-11.4,14.6-18.3 c-4.8-2.5-10.1-2.8-15.1-4.1c-13-3.5-25.9-7.4-38.2-13c-5.7-2.6-11.3-5.7-16.2-9.7c-4.6-3.7-10-4-15.4-2c-4.4,1.7-9.1,1.8-13.6,2.7 c-10.3,2.2-19.2,7.2-27.9,12.9c-1.5,1-2.8,2.3-4.7,2.3c-2.2,0.1-3.3-0.7-3.6-3.2c-0.8-7-0.4-13.7,2.7-20c0.3-0.5,0.1-1.2,0.2-2.4 c-4.7,0-7.6,3.6-10.7,6c-3,2.3-5.2,5.7-7.8,8.6c-1.6,1.8-3.5,3.5-5.9,2.3c-2.2-1.1-3.2-3.4-3.5-6.1c-0.7-7.5,1.7-14.2,3.8-21.1 c0.3-1.1,1.5-2.1,0-3.2c-1-0.7-1.9-0.6-3-0.1c-4.1,2.1-8.5,3.4-12.4,6c-1.4,0.9-3.4,2.3-5,0.6c-1.2-1.3-1.9-2.8-1.3-5.3 c4.4-21,17.1-35.2,35-44.9c10.2-5.6,21.6-4.5,32.9-3.8c5.5,0.3,8.9,5.5,14.8,5.4c-0.5-2.9-2.6-4.6-3.7-6.8c-1.9-4-0.7-6.3,3.6-6.4 c7.7-0.1,15.4,0.2,23.1-0.1c14.3-0.5,27.8-3.1,41.1-9.6c16.2-7.8,31.9-16.7,48.5-23.5c11.6-4.8,23.5-8.1,35.8-10.7 c9.9-2,19.7-1.8,29.5-1.7c9.7,0.2,19.5,1,28.7,3.9c11.5,3.6,22.3,9,32.2,16c2.2,1.6,4.7,2.7,6.7,4.6c4.7,4.4,10.2,3,15.5,1.7 c4.9-1.2,9.9-1.4,14.5-0.3c18.9,4.5,40.6-8.7,43.4-28.9c1.5-10.8,0.7-20.9-5.7-29.5c-4.9-6.6-11.5-11.6-18-16.6 c-10.5-8.1-20.3-17.2-25.8-29.7c-2.8-6.3-5.7-13-4.3-20.3c0.4-1.9-1.3-2.7-1.8-3.9c3.8-4.7,4-10.8,5.9-16.1c0.1-0.3-0.8-1.3-0.2-1.6 c5-2.5,6.1-9.3,11.7-11.1c0.4-0.1,1-0.7,1.2-0.6c3.5,3,8.1,0.5,11.7,2.4c3.7,2,8,3,11.2,5.4c2.7,2.1,5.5,4.1,7.9,6.5 c1.5,1.4,3.2,2.2,4.7,2.4c8.1,1.1,15.4,5,23.2,6.9c1.2,0.3,2,1.1,1.7,2.3c-0.3,1.1-1.4,1.4-2.6,1.4c-3.3,0.2-6.7-0.7-10.5,1 c4.6,2.5,9.6,2.7,13.6,5.7c-2,1.7-3.8,3.1-5.8,4.7c-3.6-2.9-7.9-1.9-12.1-2c-4.8-0.1-9.6,0.1-14.3-0.1c-2.9-0.1-5.3,0.4-7.6,2.2 c-1,0.7-1.4,1.7-3.4,1.1c-4.4-1.4-8.4,2.9-6.9,7.3c1.8,5.1,4.2,9.9,10.3,11.7c3.9,1.2,5.1,6.5,8.8,8.7c0.4,0.3,0.8,1,1.4,1.4 c11.9,7.6,20.5,18.2,25.5,31.6c3.6,9.8,4.5,19.8,3,30.2c-2.6,19.2-12,34.8-24,49.1c-6.5,7.7-15.2,12.6-23,18.7 c-4.2,3.3-9,5.4-13.5,8.1c-5.3,3.1-7,7.4-4.4,12.9c1.8,3.9,0,7.6-0.3,11.3c-0.9,10.7-3.2,21-9.8,30c-7.8,10.6-18.3,17.3-30.1,21.9 c-17.9,7-36.6,8.2-55.5,7.6c-4.7-0.1-7.6,1.8-9.3,5.6c-2.3,4.9-6.1,8.3-10.7,10.2c-7.8,3.2-11.1,9.8-14,17.5 c4.8,0.3,8.7-0.3,11.9-3.7c0.3-0.3,0.7-0.8,1.1-0.8c17.1-1.3,32.4-9.4,48.8-13.6c5-1.3,10.4-2.1,14.7-4.7c6.5-3.8,12.8-1.5,19-0.5 c6.4,1,9.5,7,12.8,12.1c4.7,7.3,9.2,14.8,13.9,22.1c1.3,2,2.2,4,2.9,6.3c1.2,4.2,0.7,5.2-3.6,4.6c-6.9-0.9-11.4-5.8-15.9-10.5 c-2.3-2.4-4.5-5-6.8-7.6c-2.4,2.7-1.1,5.5-1.4,8c-0.2,1.4,2.3,3.4-0.5,4.2c-2.4,0.7-5,0.8-6.9-1.7c-2.4-3.1-3.5-6.7-3.7-10.6 c-0.2-4.8-1.6-6.2-6.3-5.3c-6.7,1.3-13.2,3.1-19.7,5.3c-8,2.7-15.9,5.6-24.1,7.9c-11.5,3.2-22.8,6.9-34.2,10.2 c-1.6,0.5-3.3,1.7-3.8,2.4c-2.8,3.5-7.4,3.3-10.5,6.2c-2.1,1.9-9.9-2.3-12.1-6.2c-1.2-2.1-1.7-4.5-2.2-7c-2-8.9,3.9-15.5,5.7-23.3 c1.4-6.1,5.6-10.5,8.2-16c0.2-0.5,0.2-1.2,0.2-1.8c-0.8-0.9-1.8-0.9-2.6-0.4c-5.1,3.3-11,4.5-16.6,6.2c-6.1,1.8-11.1,5.5-15.4,9.8 c-4,4-8.6,6.9-13.1,10.1c-6,4.4-10.7,10.6-17.8,13.6c-1.1,0.5-1.1,1.7-1.3,2.8c-2.1,10.1-8.6,16.2-17.8,19.6 c-2.2,0.8-3.7,2.3-5.1,4.1c-8.6,11.1-17.2,22-25.7,33.1c-8.3,10.9-17,21.5-24.5,32.9c-4.3,6.6-8.4,13.4-12.2,20.3 c-3.5,6.3-9.6,10.6-14.3,16c-6.1,7.1-12.9,13.8-15.6,23.4C222.4,645.4,221.3,648.1,216.9,648.5z"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-xs tracking-widest uppercase text-muted-foreground">Nostr</p>
                      <p className="text-foreground font-serif group-hover:text-primary transition-colors">Follow on Nostr</p>
                    </div>
                    <ExternalLink size={14} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </a>

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

                  <a
                    href="https://www.facebook.com/MaggieMaesAustin/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-background border border-border rounded-lg hover:border-primary/40 hover:bg-primary/5 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-xs tracking-widest uppercase text-muted-foreground">Facebook</p>
                      <p className="text-foreground font-serif group-hover:text-primary transition-colors">Maggie Mae's Austin</p>
                    </div>
                    <ExternalLink size={14} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </a>
                </div>
              </div>
            </div>

            {/* RIGHT: Address/Map, Hours, Bitcoin Accepted */}
            <div className="lg:order-2 space-y-8">
              {/* Location + Map */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="text-primary w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-bold text-foreground mb-1">Location</h2>
                    <address className="not-italic text-muted-foreground font-serif text-base leading-relaxed">
                      323 E. 6th Street<br />
                      Austin, Texas 78701
                    </address>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <a
                    href="https://maps.app.goo.gl/CygEtrx3L337ge19A"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-primary text-primary font-display text-xs tracking-widest uppercase rounded hover:bg-primary/10 transition-colors"
                  >
                    Get Directions <ExternalLink size={12} />
                  </a>
                </div>
                <div className="rounded-lg overflow-hidden border border-border" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
                  <iframe
                    title="Maggie Mae's Map"
                    src="https://www.openstreetmap.org/export/embed.html?bbox=-97.7410,30.2655,-97.7375,30.2685&layer=mapnik&marker=30.267029,-97.739698"
                    width="100%"
                    height="200"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
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
                          {h.open ? `${h.open} – ${h.close}` : 'Closed'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Bitcoin Accepted */}
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
                    Maggie Mae's is proud to accept Bitcoin via the Lightning Network. Pay for rounds, tabs, and private event bookings with sats.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-primary/10 border border-primary/30 text-primary text-xs font-display tracking-wider uppercase rounded">
                      ⚡ Lightning
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </Layout>
  );
}