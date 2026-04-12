import { useState, useEffect, useRef } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Shield, PlusCircle, Radio, Calendar, Trash2, Loader2, CheckCircle2, Copy, UserPlus, UserMinus, AlertTriangle, RotateCcw, Save, Pencil, Upload } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { isValidImageUrl } from '@/lib/validation';
import { nip19 } from 'nostr-tools';
import { Layout } from '@/components/Layout';
import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useMaggieEvents, useMaggiePastEvents } from '@/hooks/useMaggieEvents';
import { usePublishMaggieEvent } from '@/hooks/usePublishMaggieEvent';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useQueryClient } from '@tanstack/react-query';
import { useAdminConfig, useTemplateList, useTemplateMutations, type EventTemplate } from '@/hooks/useAdminConfig';
import { useAdminMutations } from '@/hooks/useAdminMutations';
import { useBarRelays } from '@/hooks/useBarRelays';
import { useBlossomServers } from '@/hooks/useBlossomServers';
import { useUploadFile } from '@/hooks/useUploadFile';
import { MAGGIE_MAES_PUBKEY, MAGGIE_MAES_STAGES, DEFAULT_ADMIN_PUBKEYS, DEFAULT_BAR_RELAYS } from '@/lib/config';
import { formatEventDate, formatEventTime, type MaggieEvent } from '@/lib/maggie';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

// Helper: convert Unix timestamp to YYYY-MM-DD
function unixToDate(unix: number): string {
  const date = new Date(unix * 1000);
  return date.toISOString().split('T')[0];
}

// Helper: convert Unix timestamp to HH:MM
function unixToTime(unix: number): string {
  const date = new Date(unix * 1000);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// Editing state for existing events
interface EditingEvent {
  dTag: string;
  event: MaggieEvent;
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
interface PublishEventFormProps {
  editingEvent?: EditingEvent | null;
  onCancelEdit?: () => void;
}

function PublishEventForm({ editingEvent, onCancelEdit }: PublishEventFormProps) {
  const isEditing = !!editingEvent;
  const { toast } = useToast();
  const { mutate: publishEvent, isPending } = usePublishMaggieEvent();
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const tags = await uploadFile(file);
      const urlTag = tags.find(([name]) => name === 'url');
      if (urlTag && urlTag[1]) {
        set('imageUrl', urlTag[1]);
        setShowUrlInput(false);
        toast({ title: 'Image uploaded', description: 'Image uploaded successfully.' });
      }
    } catch (err) {
      toast({ 
        title: 'Upload failed', 
        description: err instanceof Error ? err.message : 'Failed to upload image', 
        variant: 'destructive' 
      });
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Initialize form with editing event data if provided
  const getInitialForm = () => {
    if (editingEvent) {
      const evt = editingEvent.event;
      return {
        title: evt.title,
        summary: evt.summary,
        description: evt.description,
        startDate: unixToDate(evt.start),
        startTime: unixToTime(evt.start),
        endTime: evt.end ? unixToTime(evt.end) : '',
        location: evt.location,
        stage: evt.stage || MAGGIE_MAES_STAGES[0] as string,
        price: evt.price,
        imageUrl: evt.image || '',
        artistLightningAddress: evt.artistLightningAddress || '',
      };
    }
      return {
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
        artistLightningAddress: '',
      };
  };

  const [form, setForm] = useState(getInitialForm);
  const [published, setPublished] = useState(false);

  // Reset form when editingEvent changes
  useEffect(() => {
    setForm(getInitialForm());
    setPublished(false);
  }, [editingEvent]);

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

  // Templates from Nostr
  const { data: templates = [] } = useTemplateList();
  const { createTemplate, updateTemplate, deleteTemplate } = useTemplateMutations();
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

  const handleSaveTemplate = async () => {
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
    try {
      await createTemplate(newTemplate)(templates);
      setTemplateName('');
      toast({ title: 'Template saved', description: `"${newTemplate.name}" saved to Nostr.` });
    } catch (err) {
      toast({ title: 'Failed to save template', description: String(err), variant: 'destructive' });
    }
  };

  const handleUpdateTemplate = async () => {
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
    try {
      await updateTemplate(updatedTemplate, templates);
      toast({ title: 'Template updated', description: `"${template.name}" updated on Nostr.` });
    } catch (err) {
      toast({ title: 'Failed to update template', description: String(err), variant: 'destructive' });
    }
  };

  const handleDeleteTemplate = async () => {
    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) return;
    if (!confirm(`Delete template "${template.name}"?`)) return;
    try {
      await deleteTemplate(selectedTemplateId, templates);
      setSelectedTemplateId('');
      toast({ title: 'Template deleted', description: `"${template.name}" removed from Nostr.` });
    } catch (err) {
      toast({ title: 'Failed to delete template', description: String(err), variant: 'destructive' });
    }
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
        artistLightningAddress: form.artistLightningAddress || undefined,
        existingDTag: isEditing ? editingEvent.dTag : undefined,
      },
      {
        onSuccess: () => {
          const action = isEditing ? 'updated' : 'published';
          toast({ title: `Event ${action}!`, description: `"${form.title}" is now live on Nostr.` });
          setPublished(true);
          if (isEditing && onCancelEdit) {
            onCancelEdit();
          } else {
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
              artistLightningAddress: '',
            });
          }
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
    <form onSubmit={handleSubmit} className={cn('space-y-5 max-w-2xl', isEditing && 'border border-primary/40 rounded-lg p-5 bg-primary/5')}>
      {isEditing && (
        <div className="flex items-center gap-2 text-primary text-sm font-display tracking-wider">
          <Save size={14} />
          Editing existing event — changes will replace the original
        </div>
      )}
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

        {/* Artist Lightning Address */}
        <div>
          <label className={labelClass}>Artist Lightning Address</label>
          <input
            className={fieldClass}
            placeholder="artist@lightning.address"
            value={form.artistLightningAddress}
            onChange={(e) => set('artistLightningAddress', e.target.value)}
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
          <label className={labelClass}>Event Image</label>
          
          {form.imageUrl ? (
            <div className="relative mt-2">
              <img
                src={form.imageUrl}
                alt="preview"
                className="h-32 rounded object-cover border border-border"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
              <button
                type="button"
                onClick={() => {
                  set('imageUrl', '');
                  setShowUrlInput(false);
                }}
                className="absolute top-2 right-2 p-1.5 bg-background/80 hover:bg-background rounded-full text-muted-foreground hover:text-destructive transition-colors"
                title="Remove image"
              >
                <Trash2 size={14} />
              </button>
              <button
                type="button"
                onClick={() => setShowUrlInput(true)}
                className="absolute bottom-2 right-2 px-2 py-1 bg-background/80 hover:bg-background rounded text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Replace
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-border rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <Upload size={16} />
                  <span className="text-sm font-display">Upload Image</span>
                </button>
                {showUrlInput && (
                  <input
                    className={fieldClass}
                    placeholder="https://..."
                    value={form.imageUrl}
                    onChange={(e) => set('imageUrl', e.target.value)}
                    autoFocus
                  />
                )}
              </div>
              {!showUrlInput && (
                <button
                  type="button"
                  onClick={() => setShowUrlInput(true)}
                  className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors font-display"
                >
                  or enter image URL manually
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}
          
          {isUploading && (
            <div className="mt-3 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-primary" />
              <span className="text-xs text-muted-foreground font-display">Uploading to Blossom server...</span>
            </div>
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

      <div className="flex items-center gap-3">
        {isEditing && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="flex items-center gap-2 px-4 py-2.5 border border-border text-muted-foreground font-display text-xs tracking-widest uppercase rounded hover:border-destructive hover:text-destructive transition-all"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-display text-xs tracking-widest uppercase rounded hover:bg-primary/80 transition-all shadow-md shadow-primary/20 disabled:opacity-60"
        >
          {isPending ? (
            <><Loader2 size={13} className="animate-spin" /> {isEditing ? 'Updating…' : 'Publishing…'}</>
          ) : published ? (
            <><CheckCircle2 size={13} /> {isEditing ? 'Updated!' : 'Published!'}</>
          ) : isEditing ? (
            <><Save size={13} /> Update Event</>
          ) : (
            <><PlusCircle size={13} /> Publish Event</>
          )}
        </button>
      </div>
    </form>
  );
}

// ── Manage Events ─────────────────────────────────────────────────────────────
interface ManageEventsProps {
  onEditEvent: (event: MaggieEvent) => void;
}

interface EventListItemProps {
  event: MaggieEvent;
  isEventOwner: boolean;
  onEditEvent: (event: MaggieEvent) => void;
  onDelete: (event: MaggieEvent) => void;
  deletingId: string | null;
}

function EventListItem({ event, isEventOwner, onEditEvent, onDelete, deletingId }: EventListItemProps) {
  const author = useAuthor(event.raw.pubkey);
  const meta = author.data?.metadata;
  const authorName = meta?.name ?? genUserName(event.raw.pubkey);

  return (
    <div className="flex items-start justify-between gap-4 p-4 bg-background border border-border rounded-lg">
      <div className="flex-1 min-w-0">
        <p className="font-serif font-bold text-foreground truncate">{event.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <Avatar className="w-5 h-5">
            <AvatarImage src={isValidImageUrl(meta?.picture || '') ? meta?.picture : undefined} alt={authorName} />
            <AvatarFallback className="text-[8px] bg-primary/20">
              {authorName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-muted-foreground font-mono cursor-help">
                {event.raw.pubkey.slice(0, 8)}...
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{event.raw.pubkey}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <p className="text-xs text-muted-foreground font-display tracking-wide mt-0.5">
          {formatEventDate(event.start, event.timezone)} · {formatEventTime(event.start, event.timezone)}
          {event.stage && ` · ${event.stage}`}
        </p>
        {event.price && (
          <p className="text-xs text-primary font-display mt-0.5">{event.price}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {isEventOwner && (
          <button
            onClick={() => onEditEvent(event)}
            className="flex-shrink-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors font-display tracking-wider"
          >
            <Pencil size={12} />
            Edit
          </button>
        )}
        {isEventOwner && (
          <button
            onClick={() => onDelete(event)}
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
        )}
      </div>
    </div>
  );
}

function ManageEvents({ onEditEvent }: ManageEventsProps) {
  const { data: upcomingEvents, isLoading: upcomingLoading } = useMaggieEvents();
  const { mutateAsync: createEvent } = useNostrPublish();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { user } = useCurrentUser();
  const currentUserPubkey = user?.pubkey.toLowerCase();

  // Past events state
  const [showPast, setShowPast] = useState(false);
  const [pastEvents, setPastEvents] = useState<MaggieEvent[]>([]);
  const [pastLimit, setPastLimit] = useState(10);

  const { data: newPastEvents, isLoading: pastLoading } = useMaggiePastEvents(pastLimit);

  // Update past events when new data arrives
  useEffect(() => {
    if (newPastEvents && showPast) {
      setPastEvents(newPastEvents);
    }
  }, [newPastEvents, showPast]);

  const hasMorePast = pastEvents.length >= pastLimit && pastEvents.length > 0;

  const handleLoadMore = () => {
    setPastLimit((prev) => prev + 10);
  };

  const handleShowPast = () => {
    setShowPast(true);
    setPastLimit(10);
  };

  const handleBackToUpcoming = () => {
    setShowPast(false);
    setPastEvents([]);
    setPastLimit(10);
  };

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
      queryClient.invalidateQueries({ queryKey: ['maggie-past-events'] });
    } catch (err) {
      toast({ title: 'Delete failed', description: String(err), variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const renderEventList = (events: MaggieEvent[]) => (
    <div className="space-y-3 max-w-2xl">
      {events.map((event) => (
        <EventListItem
          key={event.id}
          event={event}
          isEventOwner={currentUserPubkey === event.raw.pubkey.toLowerCase()}
          onEditEvent={onEditEvent}
          onDelete={handleDelete}
          deletingId={deletingId}
        />
      ))}
    </div>
  );

  // Loading state
  if (upcomingLoading || (showPast && pastLoading)) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-8">
        <Loader2 size={16} className="animate-spin" />
        <span className="font-serif text-sm">Loading events…</span>
      </div>
    );
  }

  // Show past events
  if (showPast) {
    if (!pastEvents || pastEvents.length === 0) {
      return (
        <div className="space-y-4">
          <button
            onClick={handleBackToUpcoming}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            ← Back to Upcoming
          </button>
          <div className="py-8 text-center">
            <p className="text-muted-foreground font-serif text-sm">No past events found.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <button
          onClick={handleBackToUpcoming}
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          ← Back to Upcoming
        </button>
        <div className="flex items-center justify-between">
          <p className="font-display text-xs tracking-widest uppercase text-muted-foreground">
            Past Events ({pastEvents.length} shown)
          </p>
        </div>
        {renderEventList(pastEvents)}
        {hasMorePast && (
          <button
            onClick={handleLoadMore}
            className="w-full py-2 text-sm text-muted-foreground hover:text-primary border border-border rounded hover:border-primary/50 transition-colors"
          >
            Load More
          </button>
        )}
      </div>
    );
  }

  // Show upcoming events (or empty state)
  const hasUpcomingEvents = upcomingEvents && upcomingEvents.length > 0;

  return (
    <div className="space-y-4">
      {/* Show Past Events button - always visible when not showing past */}
      {!showPast && (
        <div className="flex items-center justify-between">
          <button
            onClick={handleShowPast}
            className="text-sm text-muted-foreground hover:text-primary transition-colors font-display tracking-wider"
          >
            Show Past Events →
          </button>
        </div>
      )}

      {hasUpcomingEvents ? (
        renderEventList(upcomingEvents)
      ) : (
        !showPast && (
          <div className="py-8 text-center">
            <p className="text-muted-foreground font-serif text-sm">No upcoming events found. Publish one using the Publish Event tab.</p>
          </div>
        )
      )}
    </div>
  );
}

// ── Bar Relays Tab ────────────────────────────────────────────────────────────
function BarRelaysTab() {
  const { barRelays, addRelay, removeRelay, resetToDefaults } = useBarRelays();
  const { servers, addServer, removeServer, resetToDefaults: resetBlossomDefaults } = useBlossomServers();
  const { toast } = useToast();
  const [newUrl, setNewUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [newServer, setNewServer] = useState('');
  const [serverError, setServerError] = useState('');

  const validateWss = (url: string) => {
    try {
      const u = new URL(url.trim());
      return u.protocol === 'wss:';
    } catch {
      return false;
    }
  };

  const validateHttps = (url: string) => {
    try {
      const u = new URL(url.trim());
      return u.protocol === 'https:' || u.protocol === 'http:';
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

  const handleAddServer = () => {
    setServerError('');
    const trimmed = newServer.trim().replace(/\/$/, '');
    if (!trimmed) return;
    
    let normalized = trimmed;
    if (!normalized.startsWith('https://') && !normalized.startsWith('http://')) {
      normalized = 'https://' + normalized;
    }
    
    if (!validateHttps(normalized)) {
      setServerError('Must be a valid https:// server URL.');
      return;
    }
    
    normalized = normalized.replace(/\/$/, '');
    if (servers.includes(normalized)) {
      setServerError('Server already in list.');
      return;
    }
    
    addServer(normalized);
    setNewServer('');
    toast({ title: 'Blossom server added', description: normalized });
  };

  const handleRemoveServer = (url: string) => {
    if (servers.length <= 1) {
      toast({ title: 'Cannot remove', description: 'At least one server must remain.', variant: 'destructive' });
      return;
    }
    removeServer(url);
    toast({ title: 'Blossom server removed' });
  };

  const handleResetBlossom = () => {
    resetBlossomDefaults();
    toast({ title: 'Blossom servers reset to defaults' });
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

      {/* Blossom Servers */}
      <div className="bg-background border border-border rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload size={14} className="text-muted-foreground" />
            <h3 className="font-display text-xs tracking-widest uppercase text-muted-foreground">
              Blossom Servers (Media Upload)
            </h3>
          </div>
          <button
            onClick={handleResetBlossom}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors font-display tracking-wider"
          >
            <RotateCcw size={11} /> Reset to defaults
          </button>
        </div>

        <div className="space-y-2">
          {servers.map((url) => {
            return (
              <div key={url} className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-muted px-3 py-2 rounded font-mono text-foreground truncate">
                  {url}
                </code>
                <button
                  onClick={() => handleRemoveServer(url)}
                  disabled={servers.length <= 1}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Remove server"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Add server */}
        <div className="space-y-2 pt-2 border-t border-border">
          <p className="font-display text-xs tracking-widest uppercase text-muted-foreground">
            Add Server
          </p>
          <div className="flex gap-2">
            <input
              className={fieldClass}
              placeholder="https://blossom.example.com"
              value={newServer}
              onChange={(e) => { setNewServer(e.target.value); setServerError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleAddServer()}
            />
            <button
              onClick={handleAddServer}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground font-display text-xs tracking-widest uppercase rounded hover:bg-primary/80 transition-all flex-shrink-0"
            >
              <PlusCircle size={13} />
              Add
            </button>
          </div>
          {serverError && (
            <p className="flex items-center gap-1.5 text-xs text-destructive font-serif">
              <AlertTriangle size={11} /> {serverError}
            </p>
          )}
          <p className="text-xs text-muted-foreground font-serif">
            Files are uploaded to Blossom servers when publishing events. Uploads try servers in order, falling back on failure.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Identity Tab ──────────────────────────────────────────────────────────────
function IdentityTab() {
  const { user } = useCurrentUser();
  const { adminPubkeys, isOwner } = useAdminConfig();
  const { addAdmin, removeAdmin, isPending: isMutating } = useAdminMutations();
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

  const handleAdd = async () => {
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
    const confirmed = window.confirm(`Are you sure you want to add this pubkey as an admin?\n\nThey will have full access to manage events and settings.`);
    if (!confirmed) return;
    try {
      const newList = [...adminPubkeys, hex];
      await addAdmin(newList);
      setNewEntry('');
      toast({ title: 'Admin added', description: nip19.npubEncode(hex) });
    } catch (err) {
      toast({ title: 'Failed to add admin', description: String(err), variant: 'destructive' });
    }
  };

  const handleRemove = async (pk: string) => {
    if (!isOwner) {
      toast({ title: 'Permission denied', description: 'Only the venue owner can remove admins.', variant: 'destructive' });
      return;
    }
    if (adminPubkeys.length <= 1) {
      toast({ title: 'Cannot remove', description: 'At least one admin must remain.', variant: 'destructive' });
      return;
    }
    const confirmed = window.confirm(`Are you sure you want to remove this admin?\n\nThey will lose access to the admin console.`);
    if (!confirmed) return;
    try {
      await removeAdmin(pk, adminPubkeys);
      toast({ title: 'Admin removed' });
    } catch (err) {
      toast({ title: 'Failed to remove admin', description: String(err), variant: 'destructive' });
    }
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
        {user && (() => {
          const author = useAuthor(user.pubkey);
          const meta = author.data?.metadata;
          const npub = currentNpub;
          const displayName = meta?.name ?? meta?.display_name ?? meta?.nip05 ?? npub.slice(0, 12) + '...';
          const avatarUrl = meta?.picture;

          return (
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 flex-shrink-0">
                <AvatarImage src={avatarUrl} alt={displayName} />
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
              <button
                onClick={() => copy(npub)}
                className="text-muted-foreground hover:text-primary transition-colors p-1"
                title="Copy npub"
              >
                {copiedKey === npub ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
              </button>
            </div>
          );
        })()}
        {!user && (
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

        {/* Existing admins */}
        <div className="space-y-2">
          {adminPubkeys.map((pk) => {
            const author = useAuthor(pk);
            const meta = author.data?.metadata;
            const npub = nip19.npubEncode(pk);
            const isBarIdentity = pk === MAGGIE_MAES_PUBKEY;
            const _isDefault = DEFAULT_ADMIN_PUBKEYS.includes(pk);
            const isMe = user?.pubkey === pk;

            // Human-readable name: name → display_name → nip05 → truncated npub
            const displayName = meta?.name ?? meta?.display_name ?? meta?.nip05 ?? npub.slice(0, 12) + '...';
            const avatarUrl = meta?.picture;

            return (
              <div key={pk} className="flex items-center gap-2 group">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={avatarUrl} alt={displayName} />
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
                  {isOwner && (
                    <button
                      onClick={() => handleRemove(pk)}
                      disabled={adminPubkeys.length <= 1}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Remove admin"
                    >
                      <UserMinus size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add new admin - owner only */}
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
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <button
                onClick={handleAdd}
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
  const { isAdmin: checkAdmin, isLoading: isAdminListLoading } = useAdminConfig();

  const isAdmin = user && checkAdmin(user.pubkey);

  // Editing state for existing events
  const [editingEvent, setEditingEvent] = useState<EditingEvent | null>(null);

  const handleEditEvent = (event: MaggieEvent) => {
    setEditingEvent({ dTag: event.id, event });
    setActiveTab('publish');
  };

  const handleCancelEdit = () => {
    setEditingEvent(null);
  };

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

  // ── Loading admin list ──────────────────────────────────────────────────────
  if (!isAdmin && isAdminListLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center space-y-5 max-w-sm">
            <Loader2 className="w-10 h-10 text-primary/40 mx-auto animate-spin" />
            <p className="text-muted-foreground font-serif text-sm">
              Checking authorization&hellip;
            </p>
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
                <PublishEventForm editingEvent={editingEvent} onCancelEdit={handleCancelEdit} />
              </section>
            )}

            {activeTab === 'events' && (
              <section>
                <h2 className="font-serif text-xl font-bold text-foreground mb-1">Upcoming Events</h2>
                <p className="text-muted-foreground font-serif text-sm mb-6">
                  Events authored by the Maggie Mae's identity. Delete sends a NIP-09 deletion request.
                </p>
                <ManageEvents onEditEvent={handleEditEvent} />
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
