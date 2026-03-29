import type { NostrEvent } from '@nostrify/nostrify';
import type { MaggieStage } from './config';

/**
 * A parsed, typed representation of a NIP-52 kind:31923 calendar event
 * with Maggie Mae's custom extensions (stage, price).
 */
export interface MaggieEvent {
  /** Raw Nostr event */
  raw: NostrEvent;
  /** Unique d-tag identifier */
  id: string;
  /** Event title */
  title: string;
  /** Description / content */
  description: string;
  /** Unix timestamp (seconds) — inclusive start */
  start: number;
  /** Unix timestamp (seconds) — exclusive end (may be undefined) */
  end: number | undefined;
  /** IANA timezone string e.g. "America/Chicago" */
  timezone: string;
  /** Physical location string */
  location: string;
  /** Image URL */
  image: string | undefined;
  /** Maggie Mae's custom: which stage */
  stage: MaggieStage | string;
  /** Maggie Mae's custom: cover price e.g. "$10" or "Free" */
  price: string;
  /** Summary / short description */
  summary: string;
}

/** Parse a raw NIP-52 kind:31923 event into a typed MaggieEvent. Returns null if invalid. */
export function parseMaggieEvent(event: NostrEvent): MaggieEvent | null {
  if (event.kind !== 31923) return null;
  if (!event.tags) return null;

  const tag = (name: string) => event.tags.find(([t]) => t === name)?.[1];

  const id = tag('d');
  const title = tag('title');
  const startRaw = tag('start');

  // Required fields
  if (!id || !title || !startRaw) return null;

  const start = parseInt(startRaw, 10);
  if (isNaN(start)) return null;

  const endRaw = tag('end');
  const end = endRaw ? parseInt(endRaw, 10) : undefined;
  if (end !== undefined && isNaN(end)) return null;

  return {
    raw: event,
    id,
    title,
    description: event.content ?? '',
    start,
    end,
    timezone: tag('start_tzid') ?? 'America/Chicago',
    location: tag('location') ?? '323 E. 6th Street, Austin TX',
    image: tag('image'),
    stage: tag('stage') ?? '',
    price: tag('price') ?? 'Free',
    summary: tag('summary') ?? '',
  };
}

/** Returns true if the event is in the future (or currently ongoing). */
export function isFutureEvent(event: MaggieEvent): boolean {
  const now = Math.floor(Date.now() / 1000);
  // If the event has an end time, keep it visible until it ends
  if (event.end !== undefined) return event.end > now;
  // Otherwise keep it visible until 4 hours after start
  return event.start + 4 * 3600 > now;
}

/** Sort comparator: earliest start first. */
export function sortByStart(a: MaggieEvent, b: MaggieEvent): number {
  return a.start - b.start;
}

/**
 * Format a unix timestamp for display using the event's timezone.
 */
export function formatEventDate(ts: number, tz: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(ts * 1000));
}

export function formatEventTime(ts: number, tz: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(ts * 1000));
}

export function formatEventDay(ts: number, tz: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    day: 'numeric',
  }).format(new Date(ts * 1000));
}

export function formatEventMonth(ts: number, tz: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    month: 'short',
  }).format(new Date(ts * 1000)).toUpperCase();
}

/**
 * Build the NIP-52 event coordinate string for a calendar event.
 * Used in RSVP `a` tags: "31923:<pubkey>:<d-tag>"
 */
export function eventCoordinate(event: MaggieEvent): string {
  return `31923:${event.raw.pubkey}:${event.id}`;
}

/**
 * Generate ICS (iCalendar) file content for an event.
 * Works with Apple Calendar, Google Calendar, Outlook, etc.
 */
export function generateICS(event: MaggieEvent): string {
  const formatICSDate = (ts: number) => {
    return new Date(ts * 1000).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const start = formatICSDate(event.start);
  const end = event.end ? formatICSDate(event.end) : formatICSDate(event.start + 2 * 3600);
  const now = formatICSDate(Math.floor(Date.now() / 1000));

  const escapeICS = (text: string) =>
    text.replace(/[,;\\]/g, '\\$&').replace(/\n/g, '\\n');

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Maggie Mae's Bar//EN
BEGIN:VEVENT
UID:${event.id}@maggiemaesaustin.com
DTSTAMP:${now}
DTSTART:${start}
DTEND:${end}
SUMMARY:${escapeICS(event.title)}
DESCRIPTION:${escapeICS(event.description || event.summary)}
LOCATION:${escapeICS(event.location)}
END:VEVENT
END:VCALENDAR`;
}

/**
 * A parsed NIP-52 kind:31925 RSVP event.
 */
export interface MaggieRSVP {
  raw: NostrEvent;
  /** pubkey of the person RSVPing */
  pubkey: string;
  /** "accepted" | "declined" | "tentative" */
  status: 'accepted' | 'declined' | 'tentative';
  /** The coordinate of the calendar event being RSVP'd */
  eventCoord: string;
  /** Optional note */
  note: string;
}

/** Parse a raw kind:31925 RSVP event. Returns null if invalid. */
export function parseRSVP(event: NostrEvent): MaggieRSVP | null {
  if (event.kind !== 31925) return null;
  if (!event.tags) return null;

  const tag = (name: string) => event.tags.find(([t]) => t === name)?.[1];

  const statusRaw = tag('status');
  if (!statusRaw || !['accepted', 'declined', 'tentative'].includes(statusRaw)) return null;

  const aTag = event.tags.find(([t]) => t === 'a')?.[1];
  if (!aTag) return null;

  return {
    raw: event,
    pubkey: event.pubkey,
    status: statusRaw as 'accepted' | 'declined' | 'tentative',
    eventCoord: aTag,
    note: event.content ?? '',
  };
}
