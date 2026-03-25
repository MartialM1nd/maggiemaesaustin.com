import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Shield, PlusCircle, Radio, Calendar, Trash2, Loader2, CheckCircle2, Copy, UserPlus, UserMinus, AlertTriangle } from 'lucide-react';
import { nip19 } from 'nostr-tools';
import { Layout } from '@/components/Layout';
import { LoginArea } from '@/components/auth/LoginArea';
import { RelayListManager } from '@/components/RelayListManager';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useMaggieEvents } from '@/hooks/useMaggieEvents';
import { usePublishMaggieEvent } from '@/hooks/usePublishMaggieEvent';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useQueryClient } from '@tanstack/react-query';
import { useAdminConfig } from '@/hooks/useAdminConfig';
import { MAGGIE_MAES_PUBKEY, MAGGIE_MAES_STAGES, DEFAULT_ADMIN_PUBKEYS } from '@/lib/config';
import { formatEventDate, formatEventTime } from '@/lib/maggie';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

// ── Tabs ──────────────────────────────────────────────────────────────────────
type AdminTab = 'events' | 'publish' | 'relays' | 'identity';

const TABS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: 'publish', label: 'Publish Event', icon: <PlusCircle size={14} /> },
  { id: 'events', label: 'Manage Events', icon: <Calendar size={14} /> },
  { id: 'relays', label: 'Relays', icon: <Radio size={14} /> },
  { id: 'identity', label: 'Identity', icon: <Shield size={14} /> },
];

// ── Publish Event Form ─────────────────────────────────────────────────────────
function PublishEventForm() {
  const { toast } = useToast();
  const { mutate: publishEvent, isPending } = usePublishMaggieEvent();

  const [form, setForm] = useState({
    title: '',
    summary: '',
    description: '',
    startLocal: '',
    endLocal: '',
    location: '323 E. 6th Street, Austin TX 78701',
    stage: MAGGIE_MAES_STAGES[0] as string,
    price: 'Free',
    imageUrl: '',
  });
  const [published, setPublished] = useState(false);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.startLocal) {
      toast({ title: 'Missing fields', description: 'Title and start time are required.', variant: 'destructive' });
      return;
    }
    publishEvent(
      {
        title: form.title,
        summary: form.summary,
        description: form.description,
        startLocal: form.startLocal,
        endLocal: form.endLocal || undefined,
        location: form.location,
        stage: form.stage,
        price: form.price,
        imageUrl: form.imageUrl || undefined,
      },
      {
        onSuccess: () => {
          toast({ title: 'Event published!', description: `"${form.title}" is now live on Nostr.` });
          setPublished(true);
          setForm({
            title: '',
            summary: '',
            description: '',
            startLocal: '',
            endLocal: '',
            location: '323 E. 6th Street, Austin TX 78701',
            stage: MAGGIE_MAES_STAGES[0],
            price: 'Free',
            imageUrl: '',
          });
          setTimeout(() => setPublished(false), 4000);
        },
        onError: (err) => {
          toast({ title: 'Publish failed', description: String(err), variant: 'destructive' });
        },
      },
    );
  };

  const fieldClass = 'w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground font-serif focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground';
  const labelClass = 'block font-display text-xs tracking-widest uppercase text-muted-foreground mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Title */}
        <div className="md:col-span-2">
          <label className={labelClass}>Event Title *</label>
          <input
            className={fieldClass}
            placeholder="Texas Blues Night"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            required
          />
        </div>

        {/* Start */}
        <div>
          <label className={labelClass}>Start Date & Time *</label>
          <input
            type="datetime-local"
            className={fieldClass}
            value={form.startLocal}
            onChange={(e) => set('startLocal', e.target.value)}
            required
          />
        </div>

        {/* End */}
        <div>
          <label className={labelClass}>End Date & Time</label>
          <input
            type="datetime-local"
            className={fieldClass}
            value={form.endLocal}
            onChange={(e) => set('endLocal', e.target.value)}
          />
        </div>

        {/* Stage */}
        <div>
          <label className={labelClass}>Stage / Space</label>
          <select
            className={fieldClass}
            value={form.stage}
            onChange={(e) => set('stage', e.target.value)}
          >
            {MAGGIE_MAES_STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Price */}
        <div>
          <label className={labelClass}>Cover Price</label>
          <input
            className={fieldClass}
            placeholder="Free / $10 / $15"
            value={form.price}
            onChange={(e) => set('price', e.target.value)}
          />
        </div>

        {/* Location */}
        <div className="md:col-span-2">
          <label className={labelClass}>Location</label>
          <input
            className={fieldClass}
            value={form.location}
            onChange={(e) => set('location', e.target.value)}
          />
        </div>

        {/* Summary */}
        <div className="md:col-span-2">
          <label className={labelClass}>Short Summary</label>
          <input
            className={fieldClass}
            placeholder="One-line description shown on the events card"
            value={form.summary}
            onChange={(e) => set('summary', e.target.value)}
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className={labelClass}>Full Description</label>
          <textarea
            className={cn(fieldClass, 'min-h-[100px] resize-y')}
            placeholder="Full event description..."
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>

        {/* Image URL */}
        <div className="md:col-span-2">
          <label className={labelClass}>Image URL</label>
          <input
            className={fieldClass}
            placeholder="https://..."
            value={form.imageUrl}
            onChange={(e) => set('imageUrl', e.target.value)}
          />
          {form.imageUrl && (
            <img
              src={form.imageUrl}
              alt="preview"
              className="mt-2 h-24 rounded object-cover border border-border"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-display text-xs tracking-widest uppercase rounded hover:bg-primary/80 transition-all shadow-md shadow-primary/20 disabled:opacity-60"
      >
        {isPending ? (
          <><Loader2 size={13} className="animate-spin" /> Publishing…</>
        ) : published ? (
          <><CheckCircle2 size={13} /> Published!</>
        ) : (
          <><PlusCircle size={13} /> Publish Event</>
        )}
      </button>
    </form>
  );
}

// ── Manage Events ─────────────────────────────────────────────────────────────
function ManageEvents() {
  const { data: events, isLoading } = useMaggieEvents();
  const { mutateAsync: createEvent } = useNostrPublish();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (event: (typeof events)[0]) => {
    if (!event) return;
    const confirmed = window.confirm(`Delete "${event.title}"? This will request deletion via NIP-09.`);
    if (!confirmed) return;
    setDeletingId(event.id);
    try {
      await createEvent({
        kind: 5,
        content: 'Event deleted by admin',
        tags: [['e', event.raw.id]],
      });
      toast({ title: 'Deletion requested', description: 'Relays have been asked to remove this event.' });
      queryClient.invalidateQueries({ queryKey: ['maggie-events'] });
    } catch (err) {
      toast({ title: 'Delete failed', description: String(err), variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-8">
        <Loader2 size={16} className="animate-spin" />
        <span className="font-serif text-sm">Loading events…</span>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground font-serif text-sm">No upcoming events found. Publish one using the Publish Event tab.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-2xl">
      {events.map((event) => (
        <div
          key={event.id}
          className="flex items-start justify-between gap-4 p-4 bg-background border border-border rounded-lg"
        >
          <div className="flex-1 min-w-0">
            <p className="font-serif font-bold text-foreground truncate">{event.title}</p>
            <p className="text-xs text-muted-foreground font-display tracking-wide mt-0.5">
              {formatEventDate(event.start, event.timezone)} · {formatEventTime(event.start, event.timezone)}
              {event.stage && ` · ${event.stage}`}
            </p>
            {event.price && (
              <p className="text-xs text-primary font-display mt-0.5">{event.price}</p>
            )}
          </div>
          <button
            onClick={() => handleDelete(event)}
            disabled={deletingId === event.id}
            className="flex-shrink-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors font-display tracking-wider disabled:opacity-50"
          >
            {deletingId === event.id ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Trash2 size={12} />
            )}
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Identity Tab ──────────────────────────────────────────────────────────────
function IdentityTab() {
  const { user } = useCurrentUser();
  const { adminPubkeys, addAdmin, removeAdmin } = useAdminConfig();
  const { toast } = useToast();

  const [newEntry, setNewEntry] = useState('');
  const [entryError, setEntryError] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  /** Accepts npub1... or raw 64-char hex. Returns hex or null on error. */
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

  const handleAdd = () => {
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
    addAdmin(hex);
    setNewEntry('');
    toast({ title: 'Admin added', description: nip19.npubEncode(hex) });
  };

  const handleRemove = (pk: string) => {
    if (adminPubkeys.length <= 1) {
      toast({
        title: 'Cannot remove',
        description: 'At least one admin must remain.',
        variant: 'destructive',
      });
      return;
    }
    removeAdmin(pk);
    toast({ title: 'Admin removed' });
  };

  const currentNpub = user ? nip19.npubEncode(user.pubkey) : '';
  const fieldClass =
    'flex-1 bg-background border border-border rounded px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground';

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Current logged-in identity */}
      <div className="bg-background border border-border rounded-lg p-5 space-y-4">
        <h3 className="font-display text-xs tracking-widest uppercase text-muted-foreground">
          Logged-In Identity
        </h3>
        <div className="space-y-3">
          <div>
            <p className="font-display text-xs tracking-wider uppercase text-muted-foreground mb-1">npub</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-muted px-3 py-2 rounded font-mono text-foreground truncate">
                {currentNpub || '—'}
              </code>
              {currentNpub && (
                <button
                  onClick={() => copy(currentNpub)}
                  className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                  title="Copy npub"
                >
                  {copiedKey === currentNpub ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              )}
            </div>
          </div>
          <div>
            <p className="font-display text-xs tracking-wider uppercase text-muted-foreground mb-1">Hex Pubkey</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-muted px-3 py-2 rounded font-mono text-foreground truncate">
                {user?.pubkey ?? '—'}
              </code>
              {user && (
                <button
                  onClick={() => copy(user.pubkey)}
                  className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                  title="Copy hex"
                >
                  {copiedKey === user.pubkey ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              )}
            </div>
          </div>
        </div>
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
            Only these pubkeys can access the admin console. Changes are saved locally in your browser.
          </p>
        </div>

        {/* Existing admins */}
        <div className="space-y-2">
          {adminPubkeys.map((pk) => {
            const npub = nip19.npubEncode(pk);
            const isBarIdentity = pk === MAGGIE_MAES_PUBKEY;
            const isDefault = DEFAULT_ADMIN_PUBKEYS.includes(pk);
            const isMe = user?.pubkey === pk;
            return (
              <div key={pk} className="flex items-center gap-2 group">
                <div className="flex-1 min-w-0 bg-muted rounded px-3 py-2">
                  <p className="text-xs font-mono text-foreground truncate">{npub}</p>
                  <p className="text-[10px] font-mono text-muted-foreground truncate">{pk}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isBarIdentity && (
                    <span className="text-[10px] font-display tracking-wider text-primary border border-primary/30 rounded-full px-2 py-0.5">
                      Bar Identity
                    </span>
                  )}
                  {isMe && !isBarIdentity && (
                    <span className="text-[10px] font-display tracking-wider text-green-500 border border-green-500/30 rounded-full px-2 py-0.5">
                      You
                    </span>
                  )}
                  <button
                    onClick={() => copy(npub)}
                    className="text-muted-foreground hover:text-primary transition-colors p-1"
                    title="Copy npub"
                  >
                    {copiedKey === npub ? <CheckCircle2 size={12} className="text-green-500" /> : <Copy size={12} />}
                  </button>
                  <button
                    onClick={() => handleRemove(pk)}
                    disabled={adminPubkeys.length <= 1}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Remove admin"
                  >
                    <UserMinus size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add new admin */}
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
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button
              onClick={handleAdd}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground font-display text-xs tracking-widest uppercase rounded hover:bg-primary/80 transition-all flex-shrink-0"
            >
              <UserPlus size={13} />
              Add
            </button>
          </div>
          {entryError && (
            <p className="flex items-center gap-1.5 text-xs text-destructive font-serif">
              <AlertTriangle size={11} /> {entryError}
            </p>
          )}
          <p className="text-xs text-muted-foreground font-serif">
            Accepts npub1… or raw 64-character hex pubkey. Stored in browser localStorage.
          </p>
        </div>
      </div>

    </div>
  );
}

// ── Main Admin Page ───────────────────────────────────────────────────────────
export default function Admin() {
  useSeoMeta({
    title: "Admin — Maggie Mae's",
    description: 'Admin console for Maggie Mae\'s Bar.',
  });

  const { user } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<AdminTab>('publish');
  const { isAdmin: checkAdmin } = useAdminConfig();

  const isAdmin = user && checkAdmin(user.pubkey);

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center space-y-5 max-w-sm">
            <Shield className="w-12 h-12 text-primary/40 mx-auto" />
            <h1 className="font-serif text-2xl font-bold text-foreground">Admin Console</h1>
            <p className="text-muted-foreground font-serif">
              You need to log in with a Nostr identity to access this page.
            </p>
            <LoginArea className="max-w-xs mx-auto" />
          </div>
        </div>
      </Layout>
    );
  }

  // ── Not authorized ─────────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center space-y-4 max-w-sm">
            <Shield className="w-12 h-12 text-destructive/40 mx-auto" />
            <h1 className="font-serif text-2xl font-bold text-foreground">Not Authorized</h1>
            <p className="text-muted-foreground font-serif text-sm">
              Your Nostr identity is not on the admin list. Switch to the Maggie Mae's account to continue.
            </p>
            <code className="block text-xs bg-muted px-3 py-2 rounded font-mono text-muted-foreground truncate">
              {user.pubkey}
            </code>
            <LoginArea className="max-w-xs mx-auto" />
          </div>
        </div>
      </Layout>
    );
  }

  // ── Admin console ──────────────────────────────────────────────────────────
  return (
    <Layout>
      <div className="min-h-screen bg-background pt-28 pb-16">
        <div className="container mx-auto px-4 md:px-8">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <Shield className="w-5 h-5 text-primary" />
              <p className="font-display text-primary text-xs tracking-[0.3em] uppercase">Admin Console</p>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-black text-foreground">
              Maggie Mae's <span className="gold-text">Management</span>
            </h1>
          </div>

          {/* Tab bar */}
          <div className="flex flex-wrap gap-2 mb-8 border-b border-border pb-4">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 font-display text-xs tracking-widest uppercase rounded transition-all',
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'border border-border text-muted-foreground hover:border-primary/40 hover:text-primary',
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div>
            {activeTab === 'publish' && (
              <section>
                <h2 className="font-serif text-xl font-bold text-foreground mb-1">Publish New Event</h2>
                <p className="text-muted-foreground font-serif text-sm mb-6">
                  Creates a NIP-52 kind:31923 calendar event on Nostr, visible on the public Events page.
                </p>
                <PublishEventForm />
              </section>
            )}

            {activeTab === 'events' && (
              <section>
                <h2 className="font-serif text-xl font-bold text-foreground mb-1">Upcoming Events</h2>
                <p className="text-muted-foreground font-serif text-sm mb-6">
                  Events authored by the Maggie Mae's identity. Delete sends a NIP-09 deletion request.
                </p>
                <ManageEvents />
              </section>
            )}

            {activeTab === 'relays' && (
              <section>
                <h2 className="font-serif text-xl font-bold text-foreground mb-1">Relay Management</h2>
                <p className="text-muted-foreground font-serif text-sm mb-6">
                  Configure which Nostr relays this site reads from and publishes to. Changes are published as NIP-65 events.
                </p>
                <div className="max-w-2xl">
                  <RelayListManager />
                </div>
              </section>
            )}

            {activeTab === 'identity' && (
              <section>
                <h2 className="font-serif text-xl font-bold text-foreground mb-1">Identity & Access</h2>
                <p className="text-muted-foreground font-serif text-sm mb-6">
                  Manage which Nostr pubkeys have admin access to this console.
                </p>
                <IdentityTab />
              </section>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
