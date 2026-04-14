import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { ArrowLeft, Zap, Copy, Check, Users, UserPlus, UserMinus, Globe, MessageCircle } from 'lucide-react';
import { useSeoMeta } from '@unhead/react';
import { useAuthor } from '@/hooks/useAuthor';
import { useUserNotes } from '@/hooks/useUserNotes';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useIsFollowing, useFollow } from '@/hooks/useFollow';

import { ZapButton } from '@/components/ZapButton';
import { NoteContent } from '@/components/NoteContent';
import { Layout } from '@/components/Layout';
import { Skeleton } from '@/components/ui/skeleton';
import { genUserName } from '@/lib/genUserName';
import { isValidImageUrl } from '@/lib/validation';
import { cn } from '@/lib/utils';

interface ProfilePageProps {
  pubkey: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="text-muted-foreground hover:text-primary transition-colors p-1"
      title="Copy npub"
    >
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
    </button>
  );
}

function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header skeleton */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <Skeleton className="w-20 h-20 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
      {/* Posts skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-24" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4 space-y-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfilePage({ pubkey }: ProfilePageProps) {
  useSeoMeta({
    title: 'Profile — Maggie Mae\'s Bar',
  });

  const { user: currentUser } = useCurrentUser();
  const { data: author, isLoading: authorLoading, error: authorError } = useAuthor(pubkey);
  const { data: notesData, isLoading: notesLoading } = useUserNotes(pubkey);
  const { data: isFollowing = false } = useIsFollowing(pubkey);
  const { mutate: toggleFollow, isPending: followPending } = useFollow();
  const [showLogin, setShowLogin] = useState(false);

  const metadata = author?.metadata;
  const npub = useMemo(() => nip19.npubEncode(pubkey), [pubkey]);
  const displayName = metadata?.display_name || metadata?.name || genUserName(pubkey);
  const username = metadata?.name || genUserName(pubkey);
  const about = metadata?.about;
  const website = metadata?.website;
  const lightningAddress = metadata?.lud16 || metadata?.lud06;
  const avatarUrl = isValidImageUrl(metadata?.picture || '') ? metadata?.picture : undefined;

  const isOwnProfile = currentUser?.pubkey === pubkey;

  const handleFollow = () => {
    if (!currentUser) {
      setShowLogin(true);
      return;
    }
    toggleFollow({ pubkey, action: isFollowing ? 'unfollow' : 'follow' });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return `${diffMins}m ago`;
      }
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (authorLoading) {
    return (
      <Layout>
        <div className="pt-32 pb-12 px-4">
          <ProfileSkeleton />
        </div>
      </Layout>
    );
  }

  if (authorError || !author?.event) {
    return (
      <Layout>
        <div className="pt-32 pb-12 px-4">
          <div className="text-center py-12">
            <h1 className="font-serif text-2xl font-bold text-foreground mb-2">Profile Not Found</h1>
            <p className="text-muted-foreground">This user doesn't have a Nostr profile.</p>
            <Link to="/" className="inline-flex items-center gap-2 mt-4 text-primary hover:underline">
              <ArrowLeft size={16} /> Back to Home
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="pt-32 pb-12 px-4">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-20 h-20 rounded-full object-cover border-2 border-primary/30"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30">
                    <span className="text-2xl font-bold text-primary">
                      {displayName.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Name & npub */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-serif text-2xl font-bold text-foreground truncate">
                    {displayName}
                  </h1>
                </div>
                <p className="text-muted-foreground text-sm font-mono truncate">
                  @{username}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs text-muted-foreground/60 truncate max-w-[200px]">
                    {npub.slice(0, 20)}...
                  </code>
                  <CopyButton text={npub} />
                </div>
              </div>
            </div>

            {/* About */}
            {about && (
              <p className="mt-4 text-foreground/80 text-sm leading-relaxed whitespace-pre-wrap">
                {about}
              </p>
            )}

            {/* Website */}
            {website && (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Globe size={14} />
                {website.replace(/^https?:\/\//, '')}
              </a>
            )}

            {/* Lightning & Zap */}
            {lightningAddress && (
              <div className="mt-4 flex items-center gap-3">
                <span className="text-sm text-primary font-mono">
                  ⚡ {lightningAddress}
                </span>
                {lightningAddress && (
                  <ZapButton
                    target={{ pubkey, kind: 0 } as any}
                    lightningAddress={lightningAddress}
                    className="text-xs"
                  >
                    <Zap size={14} />
                  </ZapButton>
                )}
              </div>
            )}

            {/* Stats & Follow Button */}
            <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4 text-sm">
                <button className="flex items-center gap-1 text-foreground hover:text-primary transition-colors">
                  <Users size={16} className="text-muted-foreground" />
                  <span className="font-medium">{notesData?.followersCount ?? 0}</span>
                  <span className="text-muted-foreground">Followers</span>
                </button>
                <button className="flex items-center gap-1 text-foreground hover:text-primary transition-colors">
                  <Users size={16} className="text-muted-foreground" />
                  <span className="font-medium">{notesData?.followingCount ?? 0}</span>
                  <span className="text-muted-foreground">Following</span>
                </button>
              </div>

              {!isOwnProfile && (
                <button
                  onClick={handleFollow}
                  disabled={followPending}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-full font-display text-xs tracking-wider uppercase transition-all',
                    isFollowing
                      ? 'border border-primary/50 text-primary hover:bg-primary/10'
                      : 'bg-primary text-primary-foreground hover:bg-primary/80'
                  )}
                >
                  {followPending ? (
                    '...'
                  ) : isFollowing ? (
                    <>
                      <UserMinus size={14} /> Following
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} /> Follow
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Recent Posts */}
          <div>
            <h2 className="font-serif text-xl font-bold text-foreground mb-4">Recent Posts</h2>
            {notesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-card border border-border rounded-lg p-4 space-y-3">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            ) : notesData?.posts && notesData.posts.length > 0 ? (
              <div className="space-y-4">
                {notesData.posts.map((post) => (
                  <article
                    key={post.id}
                    className="bg-card border border-border rounded-lg p-4"
                  >
                    <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                      <MessageCircle size={12} />
                      {formatDate(post.created_at)}
                    </div>
                    <div className="text-sm">
                      <NoteContent event={post} />
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg p-8 text-center">
                <p className="text-muted-foreground">No posts yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}