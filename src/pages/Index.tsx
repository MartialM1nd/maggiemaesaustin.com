import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { Music, Star, Users, Wine, ChevronDown } from 'lucide-react';
import { Layout } from '@/components/Layout';

import { ResponsiveImage, getImagePath } from '@/components/ResponsiveImage';

const LOGO_URL = getImagePath('logo');

// Gallery images from the original site
const galleryImages = [
  {
    baseName: 'hero-austin',
    alt: 'Maggie Mae\'s Sixth Street',
  },
  {
    baseName: 'live-music-interior',
    alt: 'Live music at Maggie Mae\'s',
  },
  {
    baseName: 'bar-interior',
    alt: 'Maggie Mae\'s interior',
  },
  {
    baseName: 'rooftop-patio',
    alt: 'Rooftop Patio upstairs',
  },
  {
    baseName: 'sixth-street-night',
    alt: 'Sixth Street view',
  },
  {
    baseName: 'rooftop-balcony',
    alt: 'The rooftop balcony',
  },
];

const spaces = [
  {
    name: 'Rooftop Patio',
    sqft: '4,845',
    capacity: 483,
    tvs: 6,
    description: 'A premier destination for music lovers. Boasting a large stage, spacious dance floor, and a magnificent balcony overlooking bustling Sixth Street — with state-of-the-art backline equipment for crystal-clear sound.',
    imageBaseName: 'rooftop-patio',
    tag: 'Rooftop',
  },
  {
    name: 'Disco Room',
    sqft: '2,100',
    capacity: 250,
    tvs: 4,
    description: 'A vibrant space with a polished dance floor, disco ball, and high-energy atmosphere. Perfect for funk, disco, and dance parties.',
    imageBaseName: 'disco-room-front',
    tag: 'Dance Floor',
  },
  {
    name: 'Piano Room',
    sqft: '800',
    capacity: 75,
    tvs: 2,
    description: 'An intimate space featuring a grand piano. Ideal for singer-songwriters, jazz ensembles, and acoustic performances.',
    imageBaseName: 'stage-performance',
    tag: 'Intimate',
  },
  {
    name: 'Gibson Room',
    sqft: '1,200',
    capacity: 150,
    tvs: 3,
    description: 'A guitar-themed performance space featuring backline equipment and vintage amps. Named in tribute to the iconic Gibson guitar legacy.',
    imageBaseName: 'stage-performance',
    tag: 'Performance',
  },
  {
    name: 'The Pub',
    sqft: '1,664',
    capacity: 105,
    tvs: 4,
    description: 'A destination for locals and visitors for nearly half a century. The original wooden bar top bears etchings from celebrities, bands, and local legends. Domestic and international pints, plus signature locally-crafted cocktails.',
    imageBaseName: 'pub-bar-counter',
    tag: 'Historic',
  },
];

const stats = [
  { icon: <Star className="w-6 h-6" />, value: '1978', label: 'Est.' },
  { icon: <Music className="w-6 h-6" />, value: '2', label: 'Stages' },
  { icon: <Wine className="w-6 h-6" />, value: '5', label: 'Bars' },
  { icon: <Users className="w-6 h-6" />, value: '987', label: 'Capacity' },
];

export default function Index() {
  useSeoMeta({
    title: "Maggie Mae's Bar — Live Music on Sixth Street, Austin TX",
    description:
      "Austin's premier live music destination since 1978. 11,000 sq ft, 5 bars, 2 stages, rooftop balcony on Sixth Street. Bitcoin accepted.",
  });

  return (
    <Layout>
      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative isolate min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Background image collage */}
        <div className="absolute inset-0 -z-10">
          <ResponsiveImage
            baseName="hero-austin"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            sizes="100vw"
            loading="eager"
          />
          {/* Multi-layer dark vignette for vintage mood */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/40 via-transparent to-background/40" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-4 pt-24 pb-16">
          <img
            src={LOGO_URL}
            alt="Maggie Mae's"
            className="h-28 md:h-40 w-auto mb-8 drop-shadow-2xl"
          />

          {/* Vintage rule */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-16 bg-primary/60" />
            <span className="font-display text-primary text-xs tracking-[0.3em] uppercase">Est. 1978</span>
            <div className="h-px w-16 bg-primary/60" />
          </div>

          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-black text-foreground leading-tight mb-4 drop-shadow-xl">
            Where Austin<br />
            <span className="gold-text">Lives the Music</span>
          </h1>

          <p className="text-foreground/70 text-lg md:text-xl max-w-xl mt-4 mb-10 font-serif leading-relaxed">
            11,000 square feet of live music, cold drinks, and Sixth Street soul — since the year of the Ramones.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Link
              to="/events"
              className="px-8 py-3.5 bg-primary text-primary-foreground font-display text-sm tracking-widest uppercase rounded hover:bg-primary/80 transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105"
            >
              See What's On
            </Link>
            <Link
              to="/contact"
              className="px-8 py-3.5 border border-primary/50 text-primary font-display text-sm tracking-widest uppercase rounded hover:bg-primary/10 transition-all"
            >
              Book a Private Event
            </Link>
          </div>

          {/* Stats strip */}
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1">
                <span className="text-primary">{s.icon}</span>
                <span className="font-serif font-black text-3xl text-foreground">{s.value}</span>
                <span className="font-display text-muted-foreground text-xs tracking-widest uppercase">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <a
          href="#about"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-primary/50 hover:text-primary transition-colors animate-bounce"
          aria-label="Scroll down"
        >
          <ChevronDown size={28} />
        </a>
      </section>

      {/* ── ABOUT ─────────────────────────────────────────────── */}
      <section id="about" className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Text */}
            <div>
              <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-3">Our Story</p>
              <h2 className="font-serif text-4xl md:text-5xl font-black text-foreground mb-6 leading-tight">
                Austin's Pub Since<br />
                <span className="gold-text">Before Sixth Street Was Famous</span>
              </h2>
              <div className="divider-ornament mb-6">
                <Music size={12} className="text-primary/50 flex-shrink-0" />
              </div>
              <div className="space-y-4 text-muted-foreground font-serif leading-relaxed">
                <p>
                  Maggie Mae's is the epitome of all things Austin. For nearly 50 years, our 11,000 square feet of event space has been home to 5 bars, 2 stages, and nearly 1,000 guests at a time — right in the heart of Sixth Street, steps from the Convention Center.
                </p>
                <p>
                  Kids were born, grandkids grew up, and Maggie Mae's was there for all of it. People met here. Some got married here. Maggie's is first and foremost a pub — a public house, in the truest British sense: a place where the community gathers and shares the joys of the day.
                </p>
                <p>
                  Maggie Mae was a Lady of the Evening in old Liverpool, charming sailors on Lime Street with ale and wit. Today, we carry on that tradition of gentle seduction — with better sound systems and a rooftop.
                </p>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-3 mt-8">
                {['Live Music', '5 Bars', 'Rooftop Patio', '2 Stages', 'Bitcoin Accepted', 'Private Events'].map((badge) => (
                  <span
                    key={badge}
                    className="px-3 py-1 border border-primary/30 text-primary/80 text-xs font-display tracking-widest uppercase rounded"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* Image grid */}
            <div className="grid grid-cols-2 gap-3 relative">
              {galleryImages.slice(0, 4).map((img, i) => (
                <div
                  key={i}
                  className={`overflow-hidden rounded ${i === 0 ? 'col-span-2 aspect-video' : 'aspect-square'}`}
                  style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}
                >
                  <ResponsiveImage
                    baseName={img.baseName}
                    alt={img.alt}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    sizes={i === 0 ? '(max-width: 768px) 100vw, 66vw' : '(max-width: 768px) 100vw, 33vw'}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SPACES ────────────────────────────────────────────── */}
      <section id="spaces" className="py-24 bg-card">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-3">The Venue</p>
            <h2 className="font-serif text-4xl md:text-5xl font-black text-foreground mb-4">
              Three Floors of <span className="gold-text">Pure Austin</span>
            </h2>
            <p className="text-muted-foreground font-serif max-w-xl mx-auto">
              From the historic Pub downstairs to the rooftop Deck above Sixth Street — every corner of Maggie Mae's has a story.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {spaces.map((space) => (
              <div
                key={space.name}
                className="group relative overflow-hidden rounded-lg bg-background border border-border hover:border-primary/40 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <ResponsiveImage
                    baseName={space.imageBaseName}
                    alt={space.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                  <span className="absolute top-3 left-3 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-display tracking-wider uppercase rounded">
                    {space.tag}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-serif text-xl font-bold text-foreground mb-2">{space.name}</h3>
                  <p className="text-muted-foreground text-sm font-serif leading-relaxed mb-4">{space.description}</p>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 text-xs font-display tracking-wider uppercase text-muted-foreground border-t border-border pt-3">
                    <span>{space.sqft} sqft</span>
                    <span className="text-primary/30">•</span>
                    <span>{space.capacity} cap.</span>
                    <span className="text-primary/30">•</span>
                    <span>{space.tvs} TVs</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              to="/contact"
              className="inline-flex px-8 py-3.5 bg-primary text-primary-foreground font-display text-sm tracking-widest uppercase rounded hover:bg-primary/80 transition-all shadow-lg shadow-primary/20"
            >
              Book Your Private Event
            </Link>
          </div>
        </div>
      </section>

      {/* ── GALLERY STRIP ─────────────────────────────────────── */}
      <section className="py-16 bg-background overflow-hidden">
        <div className="container mx-auto px-4 md:px-8 mb-8 text-center">
          <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-2">Gallery</p>
          <h2 className="font-serif text-3xl md:text-4xl font-black text-foreground">
            Nights to <span className="gold-text">Remember</span>
          </h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-3 px-4 md:px-8 snap-x snap-mandatory scrollbar-none">
          {galleryImages.map((img, i) => (
            <div
              key={i}
              className="flex-none w-64 md:w-80 aspect-video rounded overflow-hidden snap-start"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
            >
              <ResponsiveImage
                baseName={img.baseName}
                alt={img.alt}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────── */}
      <section className="py-20 bg-card relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <ResponsiveImage
            baseName="rooftop-patio"
            alt=""
            className="w-full h-full object-cover opacity-20"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-card via-card/70 to-card" />
        </div>

        <div className="container mx-auto px-4 md:px-8 text-center">
          <h2 className="font-serif text-4xl md:text-5xl font-black text-foreground mb-4">
            The Heart of <span className="gold-text">Austin Music</span>
          </h2>
          <p className="text-muted-foreground font-serif text-lg max-w-lg mx-auto mb-8">
            323 E. 6th Street — open nightly, and Bitcoin-friendly since before it was cool.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/events"
              className="px-8 py-3.5 bg-primary text-primary-foreground font-display text-sm tracking-widest uppercase rounded hover:bg-primary/80 transition-all shadow-lg shadow-primary/30"
            >
              Upcoming Events
            </Link>
            <Link
              to="/contact"
              className="px-8 py-3.5 border border-primary/50 text-primary font-display text-sm tracking-widest uppercase rounded hover:bg-primary/10 transition-all"
            >
              Hours & Directions
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
