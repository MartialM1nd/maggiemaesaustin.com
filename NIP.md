# NIP: Maggie Mae's Calendar Extensions

## Summary

This document describes Maggie Mae's custom extensions to NIP-52 (Calendar Events) for a live music venue website. The extensions add venue-specific tags for stage location and cover price.

## Base Standard

This extension builds upon [NIP-52](https://github.com/nostr-protocol/nips/blob/master/52.md) (Calendar Events), specifically:
- **Kind 31923**: Time-based calendar events (with start/end timestamps)
- **Kind 31925**: Event RSVPs

## Custom Tags

In addition to standard NIP-52 tags, Maggie Mae's events include the following custom tags:

### `stage` Tag

| Attribute | Value |
|-----------|-------|
| Tag Name | `stage` |
| Multiplicity | Single (0-1 per event) |
| Purpose | Specifies which venue stage/space the event takes place in |

**Allowed Values:**
- `"The Deck"` - Rooftop balcony stage overlooking Sixth Street
- `"Disco Room"` - High-energy dance floor space with disco ball
- `"Piano Room"` - Intimate space with grand piano for acoustic/jazz
- `"Gibson Room"` - Guitar-themed performance space with backline
- `"Cypherpunk Lounge"` - Bitcoin/crypto-friendly lounge space
- `"The Pub"` - Historic ground floor pub area

**Example:**
```json
["stage", "The Deck"]
```

### `price` Tag

| Attribute | Value |
|-----------|-------|
| Tag Name | `price` |
| Multiplicity | Single (0-1 per event) |
| Purpose | Specifies the cover price for entry |

**Allowed Values:**
- `"Free"` - No cover charge
- `"$10"`, `"$15"`, `"$20"`, etc. - Dollar amount
- `"Varies"` - Price varies by event
- Empty string - Default to "Free"

**Example:**
```json
["price", "$10"]
```

## Filtering

Events are filtered using the `t` (hashtag) tag to ensure only official Maggie Mae's events are displayed:

```json
["t", "maggiemaes"]
```

Additional recommended tags for discoverability:
- `["t", "livemusic"]` - For live music events
- `["t", "austin"]` - For Austin, TX venue

## Complete Event Example

A complete kind:31923 calendar event for Maggie Mae's:

```json
{
  "kind": 31923,
  "content": "Join us for an unforgettable night of blues with local Austin favorites!",
  "tags": [
    ["d", "maggie-1712272800-abc123"],
    ["title", "Blues Night with The Austin Kings"],
    ["summary", "Blues Night with The Austin Kings"],
    ["start", "1712272800"],
    ["start_tzid", "America/Chicago"],
    ["end", "1712287200"],
    ["end_tzid", "America/Chicago"],
    ["location", "323 E. 6th Street, Austin TX 78701"],
    ["stage", "The Deck"],
    ["price", "$10"],
    ["t", "maggiemaes"],
    ["t", "livemusic"],
    ["t", "austin"],
    ["D", "19789"]
  ],
  "created_at": 1712272800,
  "pubkey": "ac391a41b2cfb30d77480b5c32322e1989db91db89a253775162871677d1954e",
  "id": "..."
}
```

## RSVP Events

RSVPs use standard NIP-52 kind:31925 with the following structure:

```json
{
  "kind": 31925,
  "content": "Can't wait!",
  "tags": [
    ["d", "rsvp-31923:ac391a41b2cfb30d77480b5c32322e1989db91db89a253775162871677d1954e:maggie-1712272800-abc123"],
    ["a", "31923:ac391a41b2cfb30d77480b5c32322e1989db91db89a253775162871677d1954e:maggie-1712272800-abc123"],
    ["p", "ac391a41b2cfb30d77480b5c32322e1989db91db89a253775162871677d1954e"],
    ["status", "accepted"]
  ],
  "created_at": 1712272800,
  "pubkey": "..."
}
```

## Relay Configuration

Maggie Mae's events are published to a dedicated relay pool separate from user relays:
- `wss://relay.nostr.place`
- `wss://relay.ditto.pub`
- `wss://nos.lol`

This ensures bar events are discoverable independently of the user's personal relay list.

## Implementation

### Parsing Events

```typescript
import { parseMaggieEvent, type MaggieEvent } from '@/lib/maggie';

function handleEvent(event: NostrEvent): MaggieEvent | null {
  return parseMaggieEvent(event);
}
```

### Publishing Events

```typescript
import { usePublishMaggieEvent } from '@/hooks/usePublishMaggieEvent';

const { mutate: createEvent } = usePublishMaggieEvent();

createEvent({
  title: 'Blues Night with The Austin Kings',
  description: 'Join us for an unforgettable night of blues!',
  startLocal: '2025-04-04T21:00',
  endLocal: '2025-04-05T01:00',
  location: '323 E. 6th Street, Austin TX 78701',
  stage: 'The Deck',
  price: '$10',
  summary: 'Blues Night with The Austin Kings',
});
```

## Changelog

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | 2024-04-01 | Initial version with stage and price tags |