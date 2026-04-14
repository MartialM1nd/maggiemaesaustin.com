import { ResponsiveImage } from '@/components/ResponsiveImage';

interface PageHeroProps {
  /** BaseName for ResponsiveImage (e.g. "hero-austin") */
  baseName: string;
  /** Small uppercase eyebrow label above the title */
  eyebrow: string;
  /** Main headline — may contain JSX for styled spans */
  title: React.ReactNode;
  /** Subtitle paragraph text */
  subtitle: string;
  /** Extra padding at the bottom. Defaults to "pb-20". */
  paddingBottom?: string;
}

export function PageHero({ baseName, eyebrow, title, subtitle, paddingBottom = 'pb-20' }: PageHeroProps) {
  return (
    <section className={`relative isolate pt-32 ${paddingBottom} overflow-hidden`}>
      <div className="absolute inset-0 -z-10">
        <ResponsiveImage
          baseName={baseName}
          alt=""
          className="w-full h-full object-cover object-top"
          sizes="100vw"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-background/80 to-background" />
      </div>
      <div className="container mx-auto px-4 md:px-8 text-center">
        <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-3">
          {eyebrow}
        </p>
        <h1 className="font-serif text-5xl md:text-6xl font-black text-foreground mb-4">
          {title}
        </h1>
        <p className="text-muted-foreground font-serif text-lg max-w-lg mx-auto">
          {subtitle}
        </p>
      </div>
    </section>
  );
}
