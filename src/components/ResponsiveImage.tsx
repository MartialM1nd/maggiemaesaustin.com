const globImages = import.meta.glob('/src/assets/images/*.webp', { eager: true });

const IMAGE_SIZES = [400, 800, 1200, 1600] as const;

function buildImageMap() {
  const map: Record<string, string> = {};
  
  for (const [path, mod] of Object.entries(globImages)) {
    const fileName = path.split('/').pop()?.replace('.webp', '');
    const module = mod as { default?: string } | undefined;
    if (fileName && module?.default) {
      map[fileName] = module.default;
    }
  }
  
  return map;
}

const imageMap = buildImageMap();

function generateSrcset(baseName: string): string | undefined {
  const srcset = IMAGE_SIZES
    .map(size => {
      const key = `${baseName}-${size}w`;
      const url = imageMap[key];
      return url ? `${url} ${size}w` : null;
    })
    .filter(Boolean);
  
  return srcset.length > 0 ? srcset.join(', ') : undefined;
}

function getSrc(baseName: string): string | undefined {
  return imageMap[`${baseName}-800w`] || imageMap[baseName];
}

export function getImagePath(baseName: string): string | undefined {
  // Try to find the base image (without size suffix), otherwise use largest size
  if (imageMap[baseName]) {
    return imageMap[baseName];
  }
  // Try 2000w as fallback
  if (imageMap[`${baseName}-2000w`]) {
    return imageMap[`${baseName}-2000w`];
  }
  // Try 1600w
  if (imageMap[`${baseName}-1600w`]) {
    return imageMap[`${baseName}-1600w`];
  }
  // Try 1200w
  if (imageMap[`${baseName}-1200w`]) {
    return imageMap[`${baseName}-1200w`];
  }
  return undefined;
}

interface ResponsiveImageProps {
  baseName: string;
  alt: string;
  className?: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  style?: React.CSSProperties;
}

export function ResponsiveImage({
  baseName,
  alt,
  className,
  sizes = '100vw',
  loading = 'lazy',
  style,
}: ResponsiveImageProps) {
  const src = getSrc(baseName);
  const srcSet = generateSrcset(baseName);

  if (!src) {
    console.warn(`ResponsiveImage: No images found for "${baseName}"`);
    return null;
  }

  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      className={className}
      loading={loading}
      style={style}
    />
  );
}
