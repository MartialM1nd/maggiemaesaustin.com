import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Shield, PlusCircle, Radio, Calendar, Loader2 } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAdminConfig } from '@/hooks/useAdminConfig';
import { PublishEventForm, type EditingEvent } from '@/components/admin/PublishEventForm';
import { ManageEvents } from '@/components/admin/ManageEvents';
import { BarRelaysTab } from '@/components/admin/BarRelaysTab';
import { IdentityTab } from '@/components/admin/IdentityTab';
import { cn } from '@/lib/utils';
import type { MaggieEvent } from '@/lib/maggie';

// ── Tabs ──────────────────────────────────────────────────────────────────────

type AdminTab = 'events' | 'publish' | 'relays' | 'identity';

const TABS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: 'publish', label: 'Publish Event', icon: <PlusCircle size={14} /> },
  { id: 'events', label: 'Manage Events', icon: <Calendar size={14} /> },
  { id: 'relays', label: 'Relays', icon: <Radio size={14} /> },
  { id: 'identity', label: 'Identity', icon: <Shield size={14} /> },
];

// ── Main Admin Page ───────────────────────────────────────────────────────────

export default function Admin() {
  useSeoMeta({
    title: "Admin — Maggie Mae's",
    description: "Admin console for Maggie Mae's Bar.",
  });

  const { user } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<AdminTab>('publish');
  const { isAdmin: checkAdmin, isLoading: isAdminListLoading } = useAdminConfig();

  const isAdmin = user && checkAdmin(user.pubkey);

  const [editingEvent, setEditingEvent] = useState<EditingEvent | null>(null);

  const handleEditEvent = (event: MaggieEvent) => {
    setEditingEvent({ dTag: event.id, event });
    setActiveTab('publish');
  };

  const handleCancelEdit = () => setEditingEvent(null);

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
