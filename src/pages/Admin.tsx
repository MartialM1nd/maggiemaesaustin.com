import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Shield, PlusCircle, Radio, Calendar, Trash2, Loader2, CheckCircle2, Copy, UserPlus, UserMinus, AlertTriangle, RotateCcw, Save } from 'lucide-react';
import { nip19 } from 'nostr-tools';
import { Layout } from '@/components/Layout';
import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useMaggieEvents } from '@/hooks/useMaggieEvents';
import { usePublishMaggieEvent } from '@/hooks/usePublishMaggieEvent';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useQueryClient } from '@tanstack/react-query';
import { useAdminConfig } from '@/hooks/useAdminConfig';
import { useBarRelays } from '@/hooks/useBarRelays';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { MAGGIE_MAES_PUBKEY, MAGGIE_MAES_STAGES, DEFAULT_ADMIN_PUBKEYS, DEFAULT_BAR_RELAYS } from '@/lib/config';
import { formatEventDate, formatEventTime, type MaggieEvent } from '@/lib/maggie';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

interface EventTemplate {
  id: string;
  name: string;
  title: string;
  summary: string;
  description: string;
  location: string;
  stage: string;
  price: string;
  imageUrl: string;
}

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
    startDate: '',
    startTime: '',
    endTime: '',
    location: '323 E. 6th Street, Austin TX 78701',
    stage: MAGGIE_MAES_STAGES[0] as string,
    price: 'Free',
    imageUrl: '',
  });
  const [published, setPublished] = useState(false);

  // Generate time slots from 4pm to 4am
  const timeSlots: { value: string; label: string }[] = [];
  for (let h = 16; h <= 28; h++) {
    const hour24 = h > 24 ? h - 24 : h;
    for (const min of ['00', '30']) {
      const displayHour = hour24 > 12 ? hour24 - 12 : hour24;
      const ampm = hour24 >= 12 && h <= 28 ? (hour24 === 24 ? 'AM' : 'PM') : (hour24 === 12 ? 'PM' : 'AM');
      timeSlots.push({
        value: `${String(hour24).padStart(2, '0')}:${min}`,
        label: `${displayHour}:${min} ${ampm}`,
      });
    }
  }

  // Derive startLocal and endLocal from form fields
  const getStartLocal = () => {
    if (!form.startDate || !form.startTime) return '';
    return `${form.startDate}T${form.startTime}`;
  };

  const getEndLocal = () => {
    if (!form.startDate || !form.endTime) return '';
    // If end time is "earlier" than start time numerically (e.g., 01:00 vs 21:00), it's next day
    const endHour = parseInt(form.endTime.split(':')[0]);
    const startHour = parseInt(form.startTime.split(':')[0]);
    const isNextDay = endHour < startHour;
    
    let endDate = form.startDate;
    if (isNextDay) {
      const d = new Date(form.startDate);
      d.setDate(d.getDate() + 1);
      endDate = d.toISOString().split('T')[0];
    }
    return `${endDate}T${form.endTime}`;
  };

  const set = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    // Auto-populate end time with start + 4 hours if start time is set and end is empty
    if (field === 'startTime' && value && !form.endTime) {
      const [h, m] = value.split(':').map(Number);
      let endHour = h + 4;
      const endMin = m;
      if (endHour >= 24) {
        endHour = endHour - 24;
      }
      const endTimeValue = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
      setForm((prev) => ({ ...prev, endTime: endTimeValue }));
    }
  };

  // Templates
  const [templates, setTemplates] = useLocalStorage<EventTemplate[]>('maggie:eventTemplates', []);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templateName, setTemplateName] = useState('');

  const handleLoadTemplate = () => {
    const template = templates.find(t => t.id === selectedTemplateId);
    if (template) {
      setForm(prev => ({
        ...prev,
        title: template.title,
        summary: template.summary,
        description: template.description,
        location: template.location,
        stage: template.stage,
        price: template.price,
        imageUrl: template.imageUrl,
      }));
      toast({ title: 'Template loaded', description: `"${template.name}" applied. Dates unchanged.` });
    }
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast({ title: 'Name required', description: 'Enter a name for this template.', variant: 'destructive' });
      return;
    }
    const newTemplate: EventTemplate = {
      id: Date.now().toString(),
      name: templateName.trim(),
      title: form.title,
      summary: form.summary,
      description: form.description,
      location: form.location,
      stage: form.stage,
      price: form.price,
      imageUrl: form.imageUrl,
    };
    setTemplates(prev => [...prev, newTemplate]);
    setTemplateName('');
    toast({ title: 'Template saved', description: `"${newTemplate.name}" saved for future use.` });
  };

  const handleUpdateTemplate = () => {
    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) {
      toast({ title: 'No template selected', description: 'Select a template to update.', variant: 'destructive' });
      return;
    }
    const updatedTemplate: EventTemplate = {
      ...template,
      title: form.title,
      summary: form.summary,
      description: form.description,
      location: form.location,
      stage: form.stage,
      price: form.price,
      imageUrl: form.imageUrl,
    };
    setTemplates(prev => prev.map(t => t.id === selectedTemplateId ? updatedTemplate : t));
    toast({ title: 'Template updated', description: `"${template.name}" updated with current form values.` });
  };

  const handleDeleteTemplate = () => {
    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) return;
    if (!confirm(`Delete template "${template.name}"?`)) return;
    setTemplates(prev => prev.filter(t => t.id !== selectedTemplateId));
    setSelectedTemplateId('');
    toast({ title: 'Template deleted', description: `"${template.name}" removed.` });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.startDate || !form.startTime) {
      toast({ title: 'Missing fields', description: 'Title, date, and start time are required.', variant: 'destructive' });
      return;
    }
    publishEvent(
      {
        title: form.title,
        summary: form.summary,
        description: form.description,
        startLocal: getStartLocal(),
        endLocal: getEndLocal() || undefined,
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
            startDate: '',
            startTime: '',
            endTime: '',
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
      {/* Template Controls */}
      <div className="flex flex-wrap items-end gap-2 p-4 bg-muted/30 rounded-lg border border-border">
        <div className="flex-1 min-w-[200px]">
          <label className={labelClass}>Load Template</label>
          <select
            className={fieldClass}
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
          >
            <option value="">Select a template...</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handleLoadTemplate}
          disabled={!selectedTemplateId}
          className="px-3 py-2 bg-secondary text-secondary-foreground font-display text-xs tracking-widest uppercase rounded hover:bg-secondary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Load
        </button>
        <button
          type="button"
          onClick={handleUpdateTemplate}
          disabled={!selectedTemplateId}
          className="px-3 py-2 bg-secondary text-secondary-foreground font-display text-xs tracking-widest uppercase rounded hover:bg-secondary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Update
        </button>
        <button
          type="button"
          onClick={handleDeleteTemplate}
          disabled={!selectedTemplateId}
          className="p-2 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Delete template"
        >
          <Trash2 size={16} />
        </button>
      </div>

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

        {/* Date */}
        <div>
          <label className={labelClass}>Date *</label>
          <input
            type="date"
            className={fieldClass}
            value={form.startDate}
            onChange={(e) => set('startDate', e.target.value)}
            required
          />
        </div>

        {/* Start Time */}
        <div>
          <label className={labelClass}>Start Time *</label>
          <select
            className={fieldClass}
            value={form.startTime}
            onChange={(e) => set('startTime', e.target.value)}
            required
          >
            <option value="">Select time...</option>
            {timeSlots.map((slot) => (
              <option key={slot.value} value={slot.value}>{slot.label}</option>
            ))}
          </select>
        </div>

        {/* End Time */}
        <div>
          <label className={labelClass}>End Time *</label>
          <select
            className={fieldClass}
            value={form.endTime}
            onChange={(e) => set('endTime', e.target.value)}
            required
          >
            <option value="">Select time...</option>
            {timeSlots.map((slot) => (
              <option key={slot.value} value={slot.value}>{slot.label}</option>
            ))}
          </select>
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

      {/* Save as Template */}
      <div className="flex flex-wrap items-end gap-2 p-4 bg-muted/30 rounded-lg border border-border">
        <div className="flex-1 min-w-[200px]">
          <label className={labelClass}>Save as Template</label>
          <input
            className={fieldClass}
            placeholder="Template name (e.g., Blues Night)"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={handleSaveTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground font-display text-xs tracking-widest uppercase rounded hover:bg-secondary/80 transition-colors"
        >
          <Save size={13} />
          Save Template
        </button>
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

  const handleDelete = async (event: MaggieEvent) => {
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

// ── Bar Relays Tab ────────────────────────────────────────────────────────────
function BarRelaysTab() {
  const { barRelays, addRelay, removeRelay, resetToDefaults } = useBarRelays();
  const { toast } = useToast();
  const [newUrl, setNewUrl] = useState('');
  const [urlError, setUrlError] = useState('');

  const validateWss = (url: string) => {
    try {
      const u = new URL(url.trim());
      return u.protocol === 'wss:' || u.protocol === 'ws:';
    } catch {
      return false;
    }
  };

  const handleAdd = () => {
    setUrlError('');
    const trimmed = newUrl.trim().replace(/\/$/, '');
    if (!validateWss(trimmed)) {
      setUrlError('Must be a valid wss:// relay URL.');
      return;
    }
    if (barRelays.includes(trimmed)) {
      setUrlError('Relay already in list.');
      return;
    }
    addRelay(trimmed);
    setNewUrl('');
    toast({ title: 'Relay added', description: trimmed });
  };

  const handleRemove = (url: string) => {
    if (barRelays.length <= 1) {
      toast({ title: 'Cannot remove', description: 'At least one relay must remain.', variant: 'destructive' });
      return;
    }
    removeRelay(url);
    toast({ title: 'Relay removed' });
  };

  const handleReset = () => {
    resetToDefaults();
    toast({ title: 'Reset to defaults' });
  };

  const fieldClass = 'flex-1 bg-background border border-border rounded px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground';

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Current relay list */}
      <div className="bg-background border border-primary/20 rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xs tracking-widest uppercase text-primary">
            Active Bar Relays
          </h3>
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors font-display tracking-wider"
          >
            <RotateCcw size={11} /> Reset to defaults
          </button>
        </div>

        <div className="space-y-2">
          {barRelays.map((url) => {
            const isDefault = DEFAULT_BAR_RELAYS.includes(url);
            return (
              <div key={url} className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-muted px-3 py-2 rounded font-mono text-foreground truncate">
                  {url}
                </code>
                {isDefault && (
                  <span className="text-[10px] font-display tracking-wider text-primary border border-primary/30 rounded-full px-2 py-0.5 flex-shrink-0">
                    Default
                  </span>
                )}
                <button
                  onClick={() => handleRemove(url)}
                  disabled={barRelays.length <= 1}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Remove relay"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Add relay */}
        <div className="space-y-2 pt-2 border-t border-border">
          <p className="font-display text-xs tracking-widest uppercase text-muted-foreground">
            Add Relay
          </p>
          <div className="flex gap-2">
            <input
              className={fieldClass}
              placeholder="wss://relay.example.com"
              value={newUrl}
              onChange={(e) => { setNewUrl(e.target.value); setUrlError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button
              onClick={handleAdd}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground font-display text-xs tracking-widest uppercase rounded hover:bg-primary/80 transition-all flex-shrink-0"
            >
              <PlusCircle size={13} />
              Add
            </button>
          </div>
          {urlError && (
            <p className="flex items-center gap-1.5 text-xs text-destructive font-serif">
              <AlertTriangle size={11} /> {urlError}
            </p>
          )}
          <p className="text-xs text-muted-foreground font-serif">
            Stored in browser localStorage. Does not affect your personal Nostr relay list.
          </p>
        </div>
      </div>
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
            const _isDefault = DEFAULT_ADMIN_PUBKEYS.includes(pk);
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
                <h2 className="font-serif text-xl font-bold text-foreground mb-1">Bar Event Relays</h2>
                <p className="text-muted-foreground font-serif text-sm mb-6">
                  These relays are used exclusively for reading and publishing Maggie Mae's calendar events.
                  Completely separate from any logged-in user's personal relay list.
                </p>
                <BarRelaysTab />
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
