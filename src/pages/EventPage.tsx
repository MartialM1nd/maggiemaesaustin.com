import type { AddressPointer } from 'nostr-tools/nip19';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/Layout';
import { EventDetail } from '@/components/EventDetail';
import { Skeleton } from '@/components/ui/skeleton';
import { parseMaggieEvent, type MaggieEvent } from '@/lib/maggie';
import NotFound from './NotFound';

interface EventPageProps {
  naddr: AddressPointer;
}

function EventPageSkeleton() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="w-full aspect-video rounded-lg" />
        <div className="space-y-3">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </Layout>
  );
}

export function EventPage({ naddr }: EventPageProps) {
  const { nostr } = useNostr();

  const { data: event, isLoading } = useQuery({
    queryKey: ['maggie-event', naddr.pubkey, naddr.identifier],
    queryFn: async ({ signal }) => {
      const events = await nostr.query(
        [{ kinds: [31923], authors: [naddr.pubkey], '#d': [naddr.identifier] }],
        { signal: signal ?? AbortSignal.timeout(8000) },
      );
      if (events.length === 0) return null;
      return parseMaggieEvent(events[0]);
    },
    staleTime: 60_000,
    retry: 1,
  });

  if (isLoading) return <EventPageSkeleton />;
  if (!event) return <NotFound />;

  return (
    <Layout>
      <EventDetail event={event as MaggieEvent} />
    </Layout>
  );
}
