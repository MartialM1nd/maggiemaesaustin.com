import { useState } from 'react';
import { PlusCircle, Trash2, AlertTriangle, RotateCcw, Upload } from 'lucide-react';
import { useBarRelays } from '@/hooks/useBarRelays';
import { useBlossomServers } from '@/hooks/useBlossomServers';
import { useToast } from '@/hooks/useToast';
import { DEFAULT_BAR_RELAYS } from '@/lib/config';

const fieldClass =
  'flex-1 bg-background border border-border rounded px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground';

function validateWss(url: string): boolean {
  try {
    return new URL(url.trim()).protocol === 'wss:';
  } catch {
    return false;
  }
}

function validateHttps(url: string): boolean {
  try {
    const proto = new URL(url.trim()).protocol;
    return proto === 'https:' || proto === 'http:';
  } catch {
    return false;
  }
}

export function BarRelaysTab() {
  const { barRelays, addRelay, removeRelay, resetToDefaults } = useBarRelays();
  const { servers, addServer, removeServer, resetToDefaults: resetBlossomDefaults } = useBlossomServers();
  const { toast } = useToast();

  const [newUrl, setNewUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [newServer, setNewServer] = useState('');
  const [serverError, setServerError] = useState('');

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
    normalized = normalized.replace(/\/$/, '');

    if (!validateHttps(normalized)) {
      setServerError('Must be a valid https:// server URL.');
      return;
    }
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

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Bar Relays */}
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
          {barRelays.map((url) => (
            <div key={url} className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-muted px-3 py-2 rounded font-mono text-foreground truncate">
                {url}
              </code>
              {DEFAULT_BAR_RELAYS.includes(url) && (
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
          ))}
        </div>

        <div className="space-y-2 pt-2 border-t border-border">
          <p className="font-display text-xs tracking-widest uppercase text-muted-foreground">Add Relay</p>
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
            onClick={() => { resetBlossomDefaults(); toast({ title: 'Blossom servers reset to defaults' }); }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors font-display tracking-wider"
          >
            <RotateCcw size={11} /> Reset to defaults
          </button>
        </div>

        <div className="space-y-2">
          {servers.map((url) => (
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
          ))}
        </div>

        <div className="space-y-2 pt-2 border-t border-border">
          <p className="font-display text-xs tracking-widest uppercase text-muted-foreground">Add Server</p>
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
