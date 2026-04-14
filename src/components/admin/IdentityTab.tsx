import { useState } from 'react';
import { nip19 } from 'nostr-tools';
import { UserPlus, UserMinus, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CopyButton } from '@/components/CopyButton';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { LoginArea } from '@/components/auth/LoginArea';
import { useAuthor } from '@/hooks/useAuthor';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAdminConfig } from '@/hooks/useAdminConfig';
import { useAdminMutations } from '@/hooks/useAdminMutations';
import { useToast } from '@/hooks/useToast';
import { MAGGIE_MAES_PUBKEY } from '@/lib/config';

// ── AdminPubkeyRow — must be a component so useAuthor is at the top level ────

interface AdminPubkeyRowProps {
  pk: string;
  isOwner: boolean;
  currentUserPubkey?: string;
  onRemove: (pk: string) => void;
  adminCount: number;
}

function AdminPubkeyRow({ pk, isOwner, currentUserPubkey, onRemove, adminCount }: AdminPubkeyRowProps) {
  const author = useAuthor(pk);
  const meta = author.data?.metadata;
  const npub = nip19.npubEncode(pk);
  const isBarIdentity = pk === MAGGIE_MAES_PUBKEY;
  const isMe = currentUserPubkey === pk;
  const displayName = meta?.name ?? meta?.display_name ?? meta?.nip05 ?? npub.slice(0, 12) + '...';

  return (
    <div className="flex items-center gap-2 group">
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarImage src={meta?.picture} alt={displayName} />
        <AvatarFallback className="text-xs bg-muted text-muted-foreground">
          {displayName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 bg-muted rounded px-3 py-2">
        <p className="text-sm text-foreground truncate font-medium">
          {displayName}
          {meta?.nip05 && !meta?.name && !meta?.display_name && (
            <span className="text-muted-foreground font-normal"> ({meta.nip05})</span>
          )}
        </p>
        <p className="text-[10px] font-mono text-muted-foreground truncate">{npub}</p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {isBarIdentity && (
          <span className="text-[10px] font-display tracking-wider text-primary border border-primary/30 rounded-full px-2 py-0.5">
            Venue Owner
          </span>
        )}
        {isMe && !isBarIdentity && (
          <span className="text-[10px] font-display tracking-wider text-green-500 border border-green-500/30 rounded-full px-2 py-0.5">
            You
          </span>
        )}
        <CopyButton value={npub} iconSize={12} title="Copy npub" />
        {isOwner && (
          <button
            onClick={() => onRemove(pk)}
            disabled={adminCount <= 1}
            className="text-muted-foreground hover:text-destructive transition-colors p-1 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Remove admin"
          >
            <UserMinus size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── CurrentUserRow — separate component for the same reason ──────────────────

function CurrentUserRow({ pubkey }: { pubkey: string }) {
  const author = useAuthor(pubkey);
  const meta = author.data?.metadata;
  const npub = nip19.npubEncode(pubkey);
  const displayName = meta?.name ?? meta?.display_name ?? meta?.nip05 ?? npub.slice(0, 12) + '...';

  return (
    <div className="flex items-center gap-3">
      <Avatar className="w-12 h-12 flex-shrink-0">
        <AvatarImage src={meta?.picture} alt={displayName} />
        <AvatarFallback className="bg-muted text-muted-foreground">
          {displayName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-foreground font-medium truncate">
          {displayName}
          {meta?.nip05 && !meta?.name && !meta?.display_name && (
            <span className="text-muted-foreground font-normal"> ({meta.nip05})</span>
          )}
        </p>
        <p className="text-xs font-mono text-muted-foreground truncate">{npub}</p>
      </div>
      <CopyButton value={npub} iconSize={16} title="Copy npub" />
    </div>
  );
}

// ── IdentityTab ───────────────────────────────────────────────────────────────

export function IdentityTab() {
  const { user } = useCurrentUser();
  const { adminPubkeys, isOwner } = useAdminConfig();
  const { addAdmin, removeAdmin, isPending: isMutating } = useAdminMutations();
  const { toast } = useToast();

  const [newEntry, setNewEntry] = useState('');
  const [entryError, setEntryError] = useState('');

  // Confirm dialogs
  const [pendingAdd, setPendingAdd] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);

  const fieldClass =
    'flex-1 bg-background border border-border rounded px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground';

  const resolveToHex = (input: string): string | null => {
    const trimmed = input.trim();
    if (trimmed.startsWith('npub1')) {
      try {
        const decoded = nip19.decode(trimmed);
        if (decoded.type === 'npub') return decoded.data as string;
      } catch {
        return null;
      }
    }
    if (/^[0-9a-f]{64}$/i.test(trimmed)) return trimmed.toLowerCase();
    return null;
  };

  const handleRequestAdd = () => {
    if (!isOwner) {
      toast({ title: 'Permission denied', description: 'Only the venue owner can add admins.', variant: 'destructive' });
      return;
    }
    setEntryError('');
    const hex = resolveToHex(newEntry);
    if (!hex) {
      setEntryError('Enter a valid npub1… or 64-character hex pubkey.');
      return;
    }
    if (adminPubkeys.includes(hex)) {
      setEntryError('This pubkey is already in the admin list.');
      return;
    }
    setPendingAdd(hex);
  };

  const handleConfirmAdd = async () => {
    if (!pendingAdd) return;
    const hex = pendingAdd;
    setPendingAdd(null);
    try {
      await addAdmin([...adminPubkeys, hex]);
      setNewEntry('');
      toast({ title: 'Admin added', description: nip19.npubEncode(hex) });
    } catch (err) {
      toast({ title: 'Failed to add admin', description: String(err), variant: 'destructive' });
    }
  };

  const handleRequestRemove = (pk: string) => {
    if (!isOwner) {
      toast({ title: 'Permission denied', description: 'Only the venue owner can remove admins.', variant: 'destructive' });
      return;
    }
    if (adminPubkeys.length <= 1) {
      toast({ title: 'Cannot remove', description: 'At least one admin must remain.', variant: 'destructive' });
      return;
    }
    setPendingRemove(pk);
  };

  const handleConfirmRemove = async () => {
    if (!pendingRemove) return;
    const pk = pendingRemove;
    setPendingRemove(null);
    try {
      await removeAdmin(pk, adminPubkeys);
      toast({ title: 'Admin removed' });
    } catch (err) {
      toast({ title: 'Failed to remove admin', description: String(err), variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Current logged-in identity */}
      <div className="bg-background border border-border rounded-lg p-5 space-y-4">
        <h3 className="font-display text-xs tracking-widest uppercase text-muted-foreground">
          Logged-In Identity
        </h3>
        {user ? (
          <CurrentUserRow pubkey={user.pubkey} />
        ) : (
          <p className="text-muted-foreground text-sm">Not logged in</p>
        )}
        <div className="pt-1 border-t border-border">
          <p className="font-display text-xs tracking-wider uppercase text-muted-foreground mb-2">
            Switch Account
          </p>
          <LoginArea className="max-w-xs" />
        </div>
      </div>

      {/* Admin pubkey list */}
      <div className="bg-background border border-primary/20 rounded-lg p-5 space-y-4">
        <div>
          <h3 className="font-display text-xs tracking-widest uppercase text-primary mb-1">
            Admin Access List
          </h3>
          <p className="text-muted-foreground font-serif text-sm leading-relaxed">
            Only these pubkeys can access the admin console. Stored on Nostr via NIP-78 (kind 30078). Only the venue owner can modify.
          </p>
        </div>

        <div className="space-y-2">
          {adminPubkeys.map((pk) => (
            <AdminPubkeyRow
              key={pk}
              pk={pk}
              isOwner={isOwner}
              currentUserPubkey={user?.pubkey}
              onRemove={handleRequestRemove}
              adminCount={adminPubkeys.length}
            />
          ))}
        </div>

        {isOwner ? (
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="font-display text-xs tracking-widest uppercase text-muted-foreground">
              Add Admin
            </p>
            <div className="flex gap-2">
              <input
                className={fieldClass}
                placeholder="npub1… or 64-char hex"
                value={newEntry}
                onChange={(e) => { setNewEntry(e.target.value); setEntryError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleRequestAdd()}
              />
              <button
                onClick={handleRequestAdd}
                disabled={isMutating}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground font-display text-xs tracking-widest uppercase rounded hover:bg-primary/80 transition-all flex-shrink-0 disabled:opacity-50"
              >
                {isMutating ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />}
                Add
              </button>
            </div>
            {entryError && (
              <p className="flex items-center gap-1.5 text-xs text-destructive font-serif">
                <AlertTriangle size={11} /> {entryError}
              </p>
            )}
            <p className="text-xs text-muted-foreground font-serif">
              Accepts npub1… or raw 64-character hex pubkey. Stored on Nostr via NIP-78.
            </p>
          </div>
        ) : (
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="font-display text-xs tracking-widest uppercase text-muted-foreground">
              Add Admin
            </p>
            <p className="text-sm text-muted-foreground font-serif">
              Only the venue owner can modify the admin list.
            </p>
          </div>
        )}
      </div>

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={!!pendingAdd}
        onOpenChange={(open) => !open && setPendingAdd(null)}
        title="Add Admin"
        description="This pubkey will have full access to manage events and settings."
        confirmLabel="Add Admin"
        onConfirm={handleConfirmAdd}
      />
      <ConfirmDialog
        open={!!pendingRemove}
        onOpenChange={(open) => !open && setPendingRemove(null)}
        title="Remove Admin"
        description="This admin will lose access to the admin console."
        confirmLabel="Remove"
        onConfirm={handleConfirmRemove}
        destructive
      />
    </div>
  );
}
