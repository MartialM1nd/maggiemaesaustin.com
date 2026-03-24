import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Music } from 'lucide-react';

const LOGO_URL = 'https://cdn.prod.website-files.com/65c1b14078b4951e080348fb/65cb1a3623533388f1d537a3_logo_color.png';

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
            <img
              src={LOGO_URL}
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
            <img
              src={LOGO_URL}
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
              {/* Nostr */}
              <a
                href="https://nostr.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Nostr"
                title="Find us on Nostr"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 100 100">
                  <path d="M50 5C25.1 5 5 25.1 5 50s20.1 45 45 45 45-20.1 45-45S74.9 5 50 5zm0 8c9.8 0 18.7 3.7 25.5 9.7L22.3 69.9C17.1 63.3 14 54.9 14 46c0-20.4 16.6-33 36-33zm0 74c-9.8 0-18.7-3.7-25.5-9.7l53.2-47.2C82.9 36.7 86 45.1 86 54c0 20.4-16.6 33-36 33z"/>
                </svg>
              </a>
              {/* Bitcoin */}
              <span
                className="text-primary font-bold text-lg"
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
