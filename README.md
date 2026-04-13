# Maggie Mae's Bar Austin — Live Music Venue Website

A Nostr-powered live music venue website for Maggie Mae's Bar in Austin, TX. Built with React, TailwindCSS, and Nostrify.

## Overview

Maggie Mae's is a historic live music venue on 6th Street in Austin, Texas. This website integrates with the Nostr protocol to publish and manage live music events, RSVPs, and community interactions.

## Features

- **Live Music Events Calendar** — NIP-52 powered calendar events showing upcoming shows
- **Event RSVPs** — Attendees can RSVP to events (accepted/declined/tentative)
- **Recurring Events** — Support for weekly, bi-weekly, and monthly recurring shows (up to 6 months)
- **Admin Panel** — Secure admin console for publishing and managing events
- **Direct Messaging** — NIP-04 encrypted messaging between patrons
- **Nostr Integration** — Full protocol support including profiles, notes, and zaps
- **Blossom Media Upload** — Image uploads via Blossom servers
- **Pluggable Authentication** — NIP-07 compatible signers (Alby, nos2x, etc.)

## Tech Stack

- **React 18** — UI framework with hooks and concurrent rendering
- **Vite** — Fast build tool and dev server
- **TailwindCSS 3** — Utility-first styling
- **shadcn/ui** — Accessible components built on Radix UI
- **Nostrify** — Nostr protocol framework
- **TanStack Query** — Data fetching and caching
- **TypeScript** — Type-safe JavaScript

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── ui/           # shadcn/ui components
│   ├── auth/         # Authentication components
│   ├── dm/           # Direct messaging UI
│   └── zap/          # Lightning zap components
├── contexts/         # React context providers
├── hooks/            # Custom hooks for Nostr, auth, events
├── lib/              # Utilities and config
│   ├── config.ts     # Venue configuration
│   └── maggie.ts     # Event type definitions
└── pages/            # Route pages
    ├── Index.tsx     # Home page
    ├── Events.tsx    # Calendar/events page
    ├── Contact.tsx   # Contact/hours page
    ├── Admin.tsx     # Admin console
    └── Messages.tsx  # Direct messages
```

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Configuration

The venue is configured in `src/lib/config.ts`:

```typescript
// Venue's Nostr public key (hex)
export const MAGGIE_MAES_PUBKEY = '...';

// Hashtag for filtering venue events
export const MAGGIE_MAES_TAG = 'maggiemaes';

// Venue stages/spaces
export const MAGGIE_MAES_STAGES = [
  'The Pub',
  'Disco Room',
  'Piano Room',
  'Gibson Room',
  'Cypherpunk Lounge',
  'Rooftop Patio',
];
```

## NIP-52 Calendar Events

Events use NIP-52 kind:31923 with custom tags:

| Tag | Description | Example |
|-----|-------------|---------|
| `stage` | Venue stage | `"Rooftop Patio"` |
| `price` | Cover price | `"$10"`, `"Free"` |
| `recurring` | Recurrence type | `"weekly"`, `"biweekly"`, `"monthly"` |

Events are filtered by `#t: maggiemaes` hashtag.

## Nostr Kinds Used

- **Kind 0** — User metadata
- **Kind 1** — Short text notes
- **Kind 31922** — Date-based calendar events
- **Kind 31923** — Time-based calendar events
- **Kind 31925** — Event RSVPs
- **Kind 65001** — NIP-78 admin configuration
- **NIP-04** — Encrypted direct messages

## Deployment

Build creates a static SPA. Deploy to any static host:

```bash
npm run build
# Output in dist/
```

For Vercel: Connect repository and it auto-deploys on push.

## License

MIT
