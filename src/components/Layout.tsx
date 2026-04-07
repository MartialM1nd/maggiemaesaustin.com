import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Music } from 'lucide-react';
import { ResponsiveImage } from '@/components/ResponsiveImage';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Events', href: '/events' },
  { label: 'Contact', href: '/contact' },
];

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-background/95 backdrop-blur-sm border-b border-primary/20 shadow-lg shadow-black/40'
          : 'bg-gradient-to-b from-black/70 to-transparent'
      }`}
    >
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 group">
            <ResponsiveImage
              baseName="logo"
              alt="Maggie Mae's"
              className="h-12 md:h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`font-display text-sm tracking-widest uppercase transition-colors duration-200 pb-0.5 border-b-2 ${
                    isActive
                      ? 'text-primary border-primary'
                      : 'text-foreground/80 border-transparent hover:text-primary hover:border-primary/50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              to="/contact"
              className="px-5 py-2 bg-primary text-primary-foreground font-display text-sm tracking-widest uppercase rounded hover:bg-primary/80 transition-colors duration-200 shadow-md shadow-primary/30"
            >
              Book Event
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-foreground/80 hover:text-primary transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          menuOpen ? 'max-h-72 opacity-100' : 'max-h-0 opacity-0'
        } bg-background/98 backdrop-blur-sm border-b border-primary/20`}
      >
        <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={`font-display text-sm tracking-widest uppercase py-2 border-b border-border/30 transition-colors ${
                  isActive ? 'text-primary' : 'text-foreground/80 hover:text-primary'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            to="/contact"
            className="px-5 py-2 bg-primary text-primary-foreground font-display text-sm tracking-widest uppercase rounded text-center hover:bg-primary/80 transition-colors mt-1"
          >
            Book Event
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-card border-t border-primary/20 pt-12 pb-6">
      <div className="container mx-auto px-4 md:px-8">
        {/* Top section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div className="flex flex-col items-start gap-4">
            <ResponsiveImage
              baseName="logo"
              alt="Maggie Mae's"
              className="h-12 w-auto object-contain"
            />
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              Austin's premier live music destination since 1978. 11,000 sq ft of entertainment on Sixth Street.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-display text-primary text-xs tracking-widest uppercase mb-4">Navigation</h4>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Socials */}
          <div>
            <h4 className="font-display text-primary text-xs tracking-widest uppercase mb-4">Find Us</h4>
            <address className="not-italic text-muted-foreground text-sm space-y-1 mb-4">
              <p>323 E. 6th Street</p>
              <p>Austin, Texas 78701</p>
            </address>
            <div className="flex items-center gap-4 mt-3">
              {/* Nostr */}
              <a
                href="https://ditto.pub/maggiemaes@nostr.place"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Nostr"
                title="Find us on Nostr"
              >
                <svg className="w-8 h-8" viewBox="0 0 800 800" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M216.9,648.5c-8.4-15.9,0.5-28.8,7.8-42c-2.8-1.7-5.3,1.6-7.9,0.2c-2.4-7.9,3.2-17.2,12.6-20.5 c2.9-1,5.9-1.8,9-2.4c7.2-1.4,11-7.2,14.8-12.8c10.3-15.1,20.2-30.5,31.3-45c5.4-7.1,10.2-14.7,15.3-22.1c1.4-2,0.9-4.5,1.3-6.6 c2-9.1,7.6-15,15.5-17.8c8.4-3,14.2-9.1,20.8-14.3c4.6-3.6,8.8-7.7,12.9-11.9c5.3-5.6,10.3-11.4,14.6-18.3 c-4.8-2.5-10.1-2.8-15.1-4.1c-13-3.5-25.9-7.4-38.2-13c-5.7-2.6-11.3-5.7-16.2-9.7c-4.6-3.7-10-4-15.4-2c-4.4,1.7-9.1,1.8-13.6,2.7 c-10.3,2.2-19.2,7.2-27.9,12.9c-1.5,1-2.8,2.3-4.7,2.3c-2.2,0.1-3.3-0.7-3.6-3.2c-0.8-7-0.4-13.7,2.7-20c0.3-0.5,0.1-1.2,0.2-2.4 c-4.7,0-7.6,3.6-10.7,6c-3,2.3-5.2,5.7-7.8,8.6c-1.6,1.8-3.5,3.5-5.9,2.3c-2.2-1.1-3.2-3.4-3.5-6.1c-0.7-7.5,1.7-14.2,3.8-21.1 c0.3-1.1,1.5-2.1,0-3.2c-1-0.7-1.9-0.6-3-0.1c-4.1,2.1-8.5,3.4-12.4,6c-1.4,0.9-3.4,2.3-5,0.6c-1.2-1.3-1.9-2.8-1.3-5.3 c4.4-21,17.1-35.2,35-44.9c10.2-5.6,21.6-4.5,32.9-3.8c5.5,0.3,8.9,5.5,14.8,5.4c-0.5-2.9-2.6-4.6-3.7-6.8c-1.9-4-0.7-6.3,3.6-6.4 c7.7-0.1,15.4,0.2,23.1-0.1c14.3-0.5,27.8-3.1,41.1-9.6c16.2-7.8,31.9-16.7,48.5-23.5c11.6-4.8,23.5-8.1,35.8-10.7 c9.9-2,19.7-1.8,29.5-1.7c9.7,0.2,19.5,1,28.7,3.9c11.5,3.6,22.3,9,32.2,16c2.2,1.6,4.7,2.7,6.7,4.6c4.7,4.4,10.2,3,15.5,1.7 c4.9-1.2,9.9-1.4,14.5-0.3c18.9,4.5,40.6-8.7,43.4-28.9c1.5-10.8,0.7-20.9-5.7-29.5c-4.9-6.6-11.5-11.6-18-16.6 c-10.5-8.1-20.3-17.2-25.8-29.7c-2.8-6.3-5.7-13-4.3-20.3c0.4-1.9-1.3-2.7-1.8-3.9c3.8-4.7,4-10.8,5.9-16.1c0.1-0.3-0.8-1.3-0.2-1.6 c5-2.5,6.1-9.3,11.7-11.1c0.4-0.1,1-0.7,1.2-0.6c3.5,3,8.1,0.5,11.7,2.4c3.7,2,8,3,11.2,5.4c2.7,2.1,5.5,4.1,7.9,6.5 c1.5,1.4,3.2,2.2,4.7,2.4c8.1,1.1,15.4,5,23.2,6.9c1.2,0.3,2,1.1,1.7,2.3c-0.3,1.1-1.4,1.4-2.6,1.4c-3.3,0.2-6.7-0.7-10.5,1 c4.6,2.5,9.6,2.7,13.6,5.7c-2,1.7-3.8,3.1-5.8,4.7c-3.6-2.9-7.9-1.9-12.1-2c-4.8-0.1-9.6,0.1-14.3-0.1c-2.9-0.1-5.3,0.4-7.6,2.2 c-1,0.7-1.4,1.7-3.4,1.1c-4.4-1.4-8.4,2.9-6.9,7.3c1.8,5.1,4.2,9.9,10.3,11.7c3.9,1.2,5.1,6.5,8.8,8.7c0.4,0.3,0.8,1,1.4,1.4 c11.9,7.6,20.5,18.2,25.5,31.6c3.6,9.8,4.5,19.8,3,30.2c-2.6,19.2-12,34.8-24,49.1c-6.5,7.7-15.2,12.6-23,18.7 c-4.2,3.3-9,5.4-13.5,8.1c-5.3,3.1-7,7.4-4.4,12.9c1.8,3.9,0,7.6-0.3,11.3c-0.9,10.7-3.2,21-9.8,30c-7.8,10.6-18.3,17.3-30.1,21.9 c-17.9,7-36.6,8.2-55.5,7.6c-4.7-0.1-7.6,1.8-9.3,5.6c-2.3,4.9-6.1,8.3-10.7,10.2c-7.8,3.2-11.1,9.8-14,17.5 c4.8,0.3,8.7-0.3,11.9-3.7c0.3-0.3,0.7-0.8,1.1-0.8c17.1-1.3,32.4-9.4,48.8-13.6c5-1.3,10.4-2.1,14.7-4.7c6.5-3.8,12.8-1.5,19-0.5 c6.4,1,9.5,7,12.8,12.1c4.7,7.3,9.2,14.8,13.9,22.1c1.3,2,2.2,4,2.9,6.3c1.2,4.2,0.7,5.2-3.6,4.6c-6.9-0.9-11.4-5.8-15.9-10.5 c-2.3-2.4-4.5-5-6.8-7.6c-2.4,2.7-1.1,5.5-1.4,8c-0.2,1.4,2.3,3.4-0.5,4.2c-2.4,0.7-5,0.8-6.9-1.7c-2.4-3.1-3.5-6.7-3.7-10.6 c-0.2-4.8-1.6-6.2-6.3-5.3c-6.7,1.3-13.2,3.1-19.7,5.3c-8,2.7-15.9,5.6-24.1,7.9c-11.5,3.2-22.8,6.9-34.2,10.2 c-1.6,0.5-3.3,1.7-3.8,2.4c-2.8,3.5-7.4,3.3-10.5,6.2c-2.1,1.9-9.9-2.3-12.1-6.2c-1.2-2.1-1.7-4.5-2.2-7c-2-8.9,3.9-15.5,5.7-23.3 c1.4-6.1,5.6-10.5,8.2-16c0.2-0.5,0.2-1.2,0.2-1.8c-0.8-0.9-1.8-0.9-2.6-0.4c-5.1,3.3-11,4.5-16.6,6.2c-6.1,1.8-11.1,5.5-15.4,9.8 c-4,4-8.6,6.9-13.1,10.1c-6,4.4-10.7,10.6-17.8,13.6c-1.1,0.5-1.1,1.7-1.3,2.8c-2.1,10.1-8.6,16.2-17.8,19.6 c-2.2,0.8-3.7,2.3-5.1,4.1c-8.6,11.1-17.2,22-25.7,33.1c-8.3,10.9-17,21.5-24.5,32.9c-4.3,6.6-8.4,13.4-12.2,20.3 c-3.5,6.3-9.6,10.6-14.3,16c-6.1,7.1-12.9,13.8-15.6,23.4C222.4,645.4,221.3,648.1,216.9,648.5z"/>
                </svg>
              </a>
              {/* Instagram */}
              <a
                href="https://www.instagram.com/maggiemaesaustin/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              {/* Facebook */}
              <a
                href="https://www.facebook.com/MaggieMaesAustin/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              {/* Bitcoin */}
              <span
                className="text-muted-foreground hover:text-primary transition-colors font-bold text-lg cursor-default"
                title="We accept Bitcoin"
                aria-label="Bitcoin accepted"
              >
                ₿
              </span>
            </div>
          </div>
        </div>

        {/* Ornamental divider */}
        <div className="divider-ornament mb-6">
          <Music size={14} className="text-primary/50 flex-shrink-0" />
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-muted-foreground text-xs">
          <p>© {new Date().getFullYear()} Maggie Mae's. Est. 1978. All rights reserved.</p>
          <a
            href="https://shakespeare.diy"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            Vibed with Shakespeare
          </a>
        </div>
      </div>
    </footer>
  );
}

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
