import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';
import { useAdminConfig } from '@/hooks/useAdminConfig';
import { useBarRelays } from '@/hooks/useBarRelays';
import { MAGGIE_MAES_TAG } from '@/lib/config';
import { nowSecs } from '@/lib/utils';
import {
  parseMaggieEvent,
  isFutureEvent,
  sortByStart,
  type MaggieEvent,
} from '@/lib/maggie';

/** Sort comparator: latest start first (descending) */
function sortByStartDesc(a: MaggieEvent, b: MaggieEvent): number {
  return b.start - a.start;
}

/**
 * Parse, validate and filter a raw Nostr event array into typed MaggieEvents.
 * Shared pipeline used by all three query functions below.
 */
function parseMaggieEventList(events: NostrEvent[]): MaggieEvent[] {
  return events
    .map(parseMaggieEvent)
    .filter((e): e is MaggieEvent => e !== null)
    .filter((e) => e.raw.tags.some(([name, val]) => name === 't' && val === MAGGIE_MAES_TAG));
}

/**
 * Query upcoming NIP-52 kind:31923 calendar events for Maggie Mae's.
 *
 * @param limit - Maximum number of events to return (default 20)
 */
export function useMaggieEvents(limit: number = 20) {
  const { nostr } = useNostr();
  const { adminPubkeys } = useAdminConfig();
  const { barRelays } = useBarRelays();

  // Always fetch at least 100 to ensure we get enough future events after filtering
  const fetchLimit = Math.max(limit * 3, 100);

  return useQuery({
    queryKey: ['maggie-events', limit, adminPubkeys.join(','), barRelays.join(',')],
    queryFn: async ({ signal }) => {
      const events = await nostr.query(
        [{ kinds: [31923], authors: adminPubkeys, limit: fetchLimit }],
        { signal },
      );

      return parseMaggieEventList(events)
        .filter(isFutureEvent)
        .sort(sortByStart)
        .slice(0, limit);
    },
    staleTime: 60_000,
    retry: 1,
  });
}

/**
 * Query past NIP-52 kind:31923 calendar events for Maggie Mae's.
 * 
 * @param limit - Maximum number of events to return (default 10)
 */
export function useMaggiePastEvents(limit: number = 10) {
  const { nostr } = useNostr();
  const { adminPubkeys } = useAdminConfig();
  const { barRelays } = useBarRelays();

  const now = nowSecs();

  return useQuery({
    queryKey: ['maggie-past-events', limit, adminPubkeys.join(','), barRelays.join(',')],
    queryFn: async ({ signal }) => {
      const events = await nostr.query(
        [{ kinds: [31923], authors: adminPubkeys, until: now, limit }],
        { signal },
      );

      return parseMaggieEventList(events)
        .filter((e) => !isFutureEvent(e))
        .sort(sortByStartDesc);
    },
    staleTime: 30_000,
    retry: 1,
  });
}

/**
 * Query NIP-52 kind:31923 calendar events for a specific month range.
 * Used by Calendar page to dynamically load events as user navigates months.
 * 
 * @param startDate - Start of month (Date object)
 * @param endDate - End of month (Date object)
 */
export function useMaggieEventsForMonth(startDate: Date, endDate: Date) {
  const { nostr } = useNostr();
  const { adminPubkeys } = useAdminConfig();
  const { barRelays } = useBarRelays();

  // The start of the month in unix seconds (for client-side filtering by event start tag)
  const monthSince = Math.floor(startDate.getTime() / 1000);
  // Include entire last day of the month
  const monthUntil = Math.floor(endDate.getTime() / 1000) + 86400;

  const enabled = adminPubkeys.length > 0 && barRelays.length > 0;

  return useQuery({
    queryKey: ['maggie-events-month', monthSince, monthUntil, adminPubkeys.join(','), barRelays.join(',')],
    enabled,
    refetchOnMount: true,
    queryFn: async ({ signal }) => {
      // NOTE: Nostr `since`/`until` filter by the event's created_at (publish time),
      // NOT the NIP-52 `start` tag. Events are published weeks/months before they occur,
      // so we must fetch all events and filter by the `start` tag in JS.
      const events = await nostr.query(
        [{ kinds: [31923], authors: adminPubkeys, limit: 500 }],
        { signal },
      );

      return parseMaggieEventList(events)
        .filter((e) => e.start >= monthSince && e.start < monthUntil)
        .sort(sortByStart);
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}