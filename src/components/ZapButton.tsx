import { useState } from 'react';
import { ZapDialog } from '@/components/ZapDialog';
import LoginDialog from '@/components/auth/LoginDialog';
import { useZaps } from '@/hooks/useZaps';
import { useWallet } from '@/hooks/useWallet';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { Zap } from 'lucide-react';
import type { Event } from 'nostr-tools';
import type { ReactNode } from 'react';

interface ZapButtonProps {
  target: Event;
  className?: string;
  showCount?: boolean;
  zapData?: { count: number; totalSats: number; isLoading?: boolean };
  /** Override lightning address for zaps (e.g. artist lightning address) */
  lightningAddress?: string;
  /** Custom children to render as the button content */
  children?: ReactNode;
}

export function ZapButton({
  target,
  className = "text-xs ml-1",
  showCount = true,
  zapData: externalZapData,
  lightningAddress,
  children,
}: ZapButtonProps) {
  const { user } = useCurrentUser();
  const { data: author } = useAuthor(target?.pubkey || '');
  const { webln, activeNWC } = useWallet();
  const [showLogin, setShowLogin] = useState(false);

  // Only fetch data if not provided externally and user is logged in
  const { totalSats: fetchedTotalSats, isLoading } = useZaps(
    user && externalZapData ? [] : target ?? [], // Empty array prevents fetching if not logged in or external data provided
    webln,
    activeNWC,
    undefined, // onZapSuccess
    lightningAddress
  );

  // Don't show button if no target
  if (!target) {
    return null;
  }

  // If no explicit lightningAddress provided, require author's lud16/lud06
  if (!lightningAddress && !author?.metadata?.lud16 && !author?.metadata?.lud06) {
    return null;
  }

  // Use external data if provided, otherwise use fetched data
  const totalSats = externalZapData?.totalSats ?? fetchedTotalSats;
  const showLoading = externalZapData?.isLoading || isLoading;

  const handleLogin = () => {
    setShowLogin(false);
  };

  // Not logged in - show button that opens login dialog
  if (!user) {
    return (
      <>
        <button
          onClick={() => setShowLogin(true)}
          className={`flex items-center gap-1 ${className}`}
        >
          {children ?? (
            <>
              <Zap className="h-4 w-4" />
              <span className="text-xs">Zap</span>
            </>
          )}
        </button>
        <LoginDialog
          isOpen={showLogin}
          onClose={() => setShowLogin(false)}
          onLogin={handleLogin}
        />
      </>
    );
  }

  // Logged in - show zap dialog
  return (
    <ZapDialog target={target} lightningAddress={lightningAddress}>
      <div className={`flex items-center gap-1 ${className}`}>
        {children ?? (
          <>
            <Zap className="h-4 w-4" />
            <span className="text-xs">
              {showLoading ? (
                '...'
              ) : showCount && totalSats > 0 ? (
                `${totalSats.toLocaleString()}`
              ) : (
                'Zap'
              )}
            </span>
          </>
        )}
      </div>
    </ZapDialog>
  );
}
