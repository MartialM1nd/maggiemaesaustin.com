import React, { useEffect, useRef } from 'react';
import { NostrEvent, NostrFilter, NPool, NRelay1 } from '@nostrify/nostrify';
import { NostrContext } from '@nostrify/react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/hooks/useAppContext';
import { useBarRelays } from '@/hooks/useBarRelays';

interface NostrProviderProps {
  children: React.ReactNode;
}

const NostrProvider: React.FC<NostrProviderProps> = (props) => {
  const { children } = props;
  const { config } = useAppContext();
  const { barRelays } = useBarRelays();

  const queryClient = useQueryClient();

  // Create NPool instance only once
  const pool = useRef<NPool | undefined>(undefined);

  // Use refs so the pool always has the latest relay data
  const relayMetadata = useRef(config.relayMetadata);
  const barRelaysRef = useRef(barRelays);

  // Keep refs in sync
  useEffect(() => {
    relayMetadata.current = config.relayMetadata;
    queryClient.invalidateQueries({ queryKey: ['nostr'] });
  }, [config.relayMetadata, queryClient]);

  useEffect(() => {
    barRelaysRef.current = barRelays;
    // Invalidate bar event queries when bar relays change
    queryClient.invalidateQueries({ queryKey: ['maggie-events'] });
  }, [barRelays, queryClient]);

  // Initialize NPool only once
  if (!pool.current) {
    pool.current = new NPool({
      open(url: string) {
        return new NRelay1(url);
      },
      reqRouter(filters: NostrFilter[]) {
        const routes = new Map<string, NostrFilter[]>();

        // Check if this is a bar-related query (kind:31923 events or kind:30078 admin list)
        const isBarQuery = filters.some((f) =>
          f.kinds?.includes(31923) || f.kinds?.includes(30078),
        );

        if (isBarQuery) {
          // Route bar-related queries ONLY to bar relays
          for (const url of barRelaysRef.current) {
            routes.set(url, filters);
          }
        } else {
          // All other queries go to the user's relay list
          const readRelays = relayMetadata.current.relays
            .filter((r) => r.read)
            .map((r) => r.url);

          for (const url of readRelays) {
            routes.set(url, filters);
          }
        }

        return routes;
      },
      eventRouter(event: NostrEvent) {
        if (event.kind === 31923 || event.kind === 30078 || event.kind === 5) {
          // Bar calendar events, admin list, and deletions (kind:5) publish to bar relays
          return barRelaysRef.current;
        }

        // Everything else goes to the user's write relays
        const writeRelays = relayMetadata.current.relays
          .filter((r) => r.write)
          .map((r) => r.url);

        return [...new Set(writeRelays)];
      },
      eoseTimeout: 4000,
    });
  }

  return (
    <NostrContext.Provider value={{ nostr: pool.current }}>
      {children}
    </NostrContext.Provider>
  );
};

export default NostrProvider;
