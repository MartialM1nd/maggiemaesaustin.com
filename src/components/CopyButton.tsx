import { useState } from 'react';
import { Copy, CheckCircle2 } from 'lucide-react';

interface CopyButtonProps {
  value: string;
  /** Icon size in px. Defaults to 14. */
  iconSize?: number;
  className?: string;
  title?: string;
}

export function CopyButton({ value, iconSize = 14, className = 'text-muted-foreground hover:text-primary transition-colors p-1', title = 'Copy' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={handleCopy} className={className} title={title}>
      {copied
        ? <CheckCircle2 size={iconSize} className="text-green-500" />
        : <Copy size={iconSize} />
      }
    </button>
  );
}
