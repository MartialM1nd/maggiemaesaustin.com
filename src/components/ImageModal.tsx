import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ImageModalProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageModal({ src, alt, isOpen, onClose }: ImageModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-8"
      onClick={onClose}
    >
      <button
        className="absolute top-6 right-6 p-2 text-white/90 hover:text-white transition-colors z-10"
        onClick={onClose}
      >
        <X size={28} />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-full rounded-lg shadow-2xl border border-white/20"
        style={{ maxHeight: '70vh' }}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}