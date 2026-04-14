import { useState, useEffect, useRef } from 'react';
import { PlusCircle, Loader2, CheckCircle2, Save, Trash2, Upload } from 'lucide-react';
import { usePublishMaggieEvent } from '@/hooks/usePublishMaggieEvent';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useAdminConfig, useTemplateList, useTemplateMutations, type EventTemplate } from '@/hooks/useAdminConfig';
import { useToast } from '@/hooks/useToast';
import { MAGGIE_MAES_STAGES } from '@/lib/config';
import { cn } from '@/lib/utils';
import type { MaggieEvent } from '@/lib/maggie';

// ── Helpers ───────────────────────────────────────────────────────────────────

function unixToDate(unix: number): string {
  return new Date(unix * 1000).toISOString().split('T')[0];
}

function unixToTime(unix: number): string {
  const d = new Date(unix * 1000);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EditingEvent {
  dTag: string;
  event: MaggieEvent;
}

export interface PublishEventFormProps {
  editingEvent?: EditingEvent | null;
  onCancelEdit?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PublishEventForm({ editingEvent, onCancelEdit }: PublishEventFormProps) {
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
      if (urlTag?.[1]) {
        set('imageUrl', urlTag[1]);
        setShowUrlInput(false);
        toast({ title: 'Image uploaded', description: 'Image uploaded successfully.' });
      }
    } catch (err) {
      toast({ title: 'Upload failed', description: err instanceof Error ? err.message : 'Failed to upload image', variant: 'destructive' });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
        recurring: evt.recurring || '',
        recurringAmount: '',
      };
    }
    return {
      title: '', summary: '', description: '',
      startDate: '', startTime: '', endTime: '',
      location: '323 E. 6th Street, Austin TX 78701',
      stage: MAGGIE_MAES_STAGES[0] as string,
      price: 'Free', imageUrl: '', artistLightningAddress: '',
      recurring: '', recurringAmount: '',
    };
  };

  const [form, setForm] = useState(getInitialForm);
  const [published, setPublished] = useState(false);

  useEffect(() => {
    setForm(getInitialForm());
    setPublished(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingEvent]);

  useEffect(() => {
    if (form.recurring && !form.recurringAmount) {
      const maxAmounts = { weekly: 26, biweekly: 13, monthly: 6 };
      const max = maxAmounts[form.recurring as keyof typeof maxAmounts] || 26;
      setForm((prev) => ({ ...prev, recurringAmount: String(max) }));
    }
  }, [form.recurring]);

  // Time slots 4pm → 4am
  const timeSlots: { value: string; label: string }[] = [];
  for (let h = 16; h <= 28; h++) {
    const hour24 = h > 24 ? h - 24 : h;
    for (const min of ['00', '30']) {
      const displayHour = hour24 > 12 ? hour24 - 12 : hour24 === 0 ? 12 : hour24;
      const ampm = hour24 >= 12 ? 'PM' : 'AM';
      timeSlots.push({ value: `${String(hour24).padStart(2, '0')}:${min}`, label: `${displayHour}:${min} ${ampm}` });
    }
  }

  const getStartLocal = () => (!form.startDate || !form.startTime) ? '' : `${form.startDate}T${form.startTime}`;

  const getEndLocal = () => {
    if (!form.startDate || !form.endTime) return '';
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
    setForm((prev) => {
      const updates: Record<string, string> = { [field]: value };
      if (field === 'recurring' && value === '') updates.recurringAmount = '';
      return { ...prev, ...updates };
    });
    if (field === 'startTime' && value && !form.endTime) {
      const [h, m] = value.split(':').map(Number);
      let endHour = (h + 4) % 24;
      setForm((prev) => ({ ...prev, endTime: `${String(endHour).padStart(2, '0')}:${String(m).padStart(2, '0')}` }));
    }
  };

  // Templates
  const { data: templates = [] } = useTemplateList();
  const { createTemplate, updateTemplate, deleteTemplate } = useTemplateMutations();
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templateName, setTemplateName] = useState('');

  const handleLoadTemplate = () => {
    const template = templates.find((t) => t.id === selectedTemplateId);
    if (template) {
      setForm((prev) => ({ ...prev, title: template.title, summary: template.summary, description: template.description, location: template.location, stage: template.stage, price: template.price, imageUrl: template.imageUrl }));
      toast({ title: 'Template loaded', description: `"${template.name}" applied. Dates unchanged.` });
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast({ title: 'Name required', description: 'Enter a name for this template.', variant: 'destructive' });
      return;
    }
    const newTemplate: EventTemplate = { id: Date.now().toString(), name: templateName.trim(), title: form.title, summary: form.summary, description: form.description, location: form.location, stage: form.stage, price: form.price, imageUrl: form.imageUrl };
    try {
      await createTemplate(newTemplate)(templates);
      setTemplateName('');
      toast({ title: 'Template saved', description: `"${newTemplate.name}" saved to Nostr.` });
    } catch (err) {
      toast({ title: 'Failed to save template', description: String(err), variant: 'destructive' });
    }
  };

  const handleUpdateTemplate = async () => {
    const template = templates.find((t) => t.id === selectedTemplateId);
    if (!template) {
      toast({ title: 'No template selected', description: 'Select a template to update.', variant: 'destructive' });
      return;
    }
    try {
      await updateTemplate({ ...template, title: form.title, summary: form.summary, description: form.description, location: form.location, stage: form.stage, price: form.price, imageUrl: form.imageUrl }, templates);
      toast({ title: 'Template updated', description: `"${template.name}" updated on Nostr.` });
    } catch (err) {
      toast({ title: 'Failed to update template', description: String(err), variant: 'destructive' });
    }
  };

  const handleDeleteTemplate = async () => {
    const template = templates.find((t) => t.id === selectedTemplateId);
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
        title: form.title, summary: form.summary, description: form.description,
        startLocal: getStartLocal(), endLocal: getEndLocal() || undefined,
        location: form.location, stage: form.stage, price: form.price,
        imageUrl: form.imageUrl || undefined,
        artistLightningAddress: form.artistLightningAddress || undefined,
        existingDTag: isEditing ? editingEvent.dTag : undefined,
        recurring: form.recurring as '' | 'weekly' | 'biweekly' | 'monthly',
        recurringAmount: form.recurring ? (parseInt(form.recurringAmount) || 26) : undefined,
      },
      {
        onSuccess: () => {
          const action = isEditing ? 'updated' : 'published';
          toast({ title: `Event ${action}!`, description: `"${form.title}" is now live on Nostr.` });
          setPublished(true);
          if (isEditing && onCancelEdit) {
            onCancelEdit();
          } else {
            setForm({ title: '', summary: '', description: '', startDate: '', startTime: '', endTime: '', location: '323 E. 6th Street, Austin TX 78701', stage: MAGGIE_MAES_STAGES[0], price: 'Free', imageUrl: '', artistLightningAddress: '', recurring: '', recurringAmount: '' });
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

      {/* Templates */}
      <div className="flex flex-wrap items-end gap-2 p-4 bg-muted/30 rounded-lg border border-border">
        <div className="flex-1 min-w-[200px]">
          <label className={labelClass}>Load Template</label>
          <select className={fieldClass} value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)}>
            <option value="">Select a template...</option>
            {templates.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
          </select>
        </div>
        <button type="button" onClick={handleLoadTemplate} disabled={!selectedTemplateId} className="px-3 py-2 bg-secondary text-secondary-foreground font-display text-xs tracking-widest uppercase rounded hover:bg-secondary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Load</button>
        <button type="button" onClick={handleUpdateTemplate} disabled={!selectedTemplateId} className="px-3 py-2 bg-secondary text-secondary-foreground font-display text-xs tracking-widest uppercase rounded hover:bg-secondary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Update</button>
        <button type="button" onClick={handleDeleteTemplate} disabled={!selectedTemplateId} className="p-2 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40 disabled:cursor-not-allowed" title="Delete template"><Trash2 size={16} /></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <label className={labelClass}>Event Title *</label>
          <input className={fieldClass} placeholder="Texas Blues Night" value={form.title} onChange={(e) => set('title', e.target.value)} required />
        </div>

        <div>
          <label className={labelClass}>Date *</label>
          <input type="date" className={fieldClass} value={form.startDate} onChange={(e) => set('startDate', e.target.value)} required />
        </div>

        <div>
          <label className={labelClass}>Start Time *</label>
          <select className={fieldClass} value={form.startTime} onChange={(e) => set('startTime', e.target.value)} required>
            <option value="">Select time...</option>
            {timeSlots.map((slot) => (<option key={slot.value} value={slot.value}>{slot.label}</option>))}
          </select>
        </div>

        <div>
          <label className={labelClass}>End Time *</label>
          <select className={fieldClass} value={form.endTime} onChange={(e) => set('endTime', e.target.value)} required>
            <option value="">Select time...</option>
            {timeSlots.map((slot) => (<option key={slot.value} value={slot.value}>{slot.label}</option>))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Stage / Space</label>
          <select className={fieldClass} value={form.stage} onChange={(e) => set('stage', e.target.value)}>
            {MAGGIE_MAES_STAGES.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Cover Price</label>
          <input className={fieldClass} placeholder="Free / $10 / $15" value={form.price} onChange={(e) => set('price', e.target.value)} />
        </div>

        <div>
          <label className={labelClass}>Artist Lightning Address</label>
          <input className={fieldClass} placeholder="artist@lightning.address" value={form.artistLightningAddress} onChange={(e) => set('artistLightningAddress', e.target.value)} />
        </div>

        <div>
          <label className={labelClass}>Recurring</label>
          <select className={fieldClass} value={form.recurring} onChange={(e) => set('recurring', e.target.value)}>
            <option value="">None</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi-weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {form.recurring && (
          <div>
            <label className={labelClass}>Quantity</label>
            <select className={fieldClass} value={form.recurringAmount} onChange={(e) => set('recurringAmount', e.target.value)}>
              {(() => {
                const maxAmounts = { weekly: 26, biweekly: 13, monthly: 6 };
                const max = maxAmounts[form.recurring as keyof typeof maxAmounts] || 26;
                return Array.from({ length: max }, (_, i) => i + 1).map((n) => (<option key={n} value={n}>{n}</option>));
              })()}
            </select>
          </div>
        )}

        <div className="md:col-span-2">
          <label className={labelClass}>Location</label>
          <input className={fieldClass} value={form.location} onChange={(e) => set('location', e.target.value)} />
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Short Summary</label>
          <input className={fieldClass} placeholder="One-line description shown on the events card" value={form.summary} onChange={(e) => set('summary', e.target.value)} />
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Full Description</label>
          <textarea className={cn(fieldClass, 'min-h-[100px] resize-y')} placeholder="Full event description..." value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>

        {/* Image */}
        <div className="md:col-span-2">
          <label className={labelClass}>Event Image</label>
          {form.imageUrl ? (
            <div className="relative mt-2">
              <img src={form.imageUrl} alt="preview" className="h-32 rounded object-cover border border-border" onError={(e) => (e.currentTarget.style.display = 'none')} />
              <button type="button" onClick={() => { set('imageUrl', ''); setShowUrlInput(false); }} className="absolute top-2 right-2 p-1.5 bg-background/80 hover:bg-background rounded-full text-muted-foreground hover:text-destructive transition-colors" title="Remove image">
                <Trash2 size={14} />
              </button>
              <button type="button" onClick={() => setShowUrlInput(true)} className="absolute bottom-2 right-2 px-2 py-1 bg-background/80 hover:bg-background rounded text-xs text-muted-foreground hover:text-foreground transition-colors">Replace</button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-border rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                  <Upload size={16} />
                  <span className="text-sm font-display">Upload Image</span>
                </button>
                {showUrlInput && (
                  <input className={fieldClass} placeholder="https://..." value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} autoFocus />
                )}
              </div>
              {!showUrlInput && (
                <button type="button" onClick={() => setShowUrlInput(true)} className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors font-display">
                  or enter image URL manually
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
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
          <input className={fieldClass} placeholder="Template name (e.g., Blues Night)" value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
        </div>
        <button type="button" onClick={handleSaveTemplate} className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground font-display text-xs tracking-widest uppercase rounded hover:bg-secondary/80 transition-colors">
          <Save size={13} />
          Save Template
        </button>
      </div>

      <div className="flex items-center gap-3">
        {isEditing && onCancelEdit && (
          <button type="button" onClick={onCancelEdit} className="flex items-center gap-2 px-4 py-2.5 border border-border text-muted-foreground font-display text-xs tracking-widest uppercase rounded hover:border-destructive hover:text-destructive transition-all">
            Cancel
          </button>
        )}
        <button type="submit" disabled={isPending} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-display text-xs tracking-widest uppercase rounded hover:bg-primary/80 transition-all shadow-md shadow-primary/20 disabled:opacity-60">
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
