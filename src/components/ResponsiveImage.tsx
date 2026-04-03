interface ResponsiveImageProps {
  baseName: string;
  alt: string;
  className?: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  style?: React.CSSProperties;
}

const IMAGE_SIZES = [400, 800, 1200, 1600] as const;

function generateSrcset(baseName: string): string {
  return IMAGE_SIZES
    .map(size => `/images/${baseName}-${size}w.webp ${size}w`)
    .join(', ');
}

function getSrc(baseName: string): string {
  return `/images/${baseName}-800w.webp`;
}

export function ResponsiveImage({
  baseName,
  alt,
  className,
  sizes = '100vw',
  loading = 'lazy',
  style,
}: ResponsiveImageProps) {
  return (
    <img
      src={getSrc(baseName)}
      srcSet={generateSrcset(baseName)}
      sizes={sizes}
      alt={alt}
      className={className}
      loading={loading}
      style={style}
    />
  );
}

export function getImagePath(baseName: string): string {
  return `/images/${baseName}.webp`;
}
