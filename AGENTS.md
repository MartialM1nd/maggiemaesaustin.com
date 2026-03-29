# Maggie Mae's Bar - Agent Development Guide

## Commands

```bash
# Development
npm run dev           # Start dev server on localhost:8080

# Build & Validate
npm run build         # Production build with type checking
npm run test          # Full: tsc + eslint + vitest + build

# Single test file
npx vitest run src/lib/genUserName.test.ts
npm test -- --run src/lib/genUserName.test.ts   # via npm test alias

# Linting
npx eslint src/       # Lint specific directory
```

## Code Style Guidelines

### Imports (in order)
1. React imports (`react`)
2. External libraries (`@nostrify/react`, `@tanstack/query`, etc.)
3. Project imports (`@/...`)
4. Relative imports (`./`, `../`)

```typescript
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { Button } from '@/components/ui/button';
import { useMaggieEvents } from '@/hooks/useMaggieEvents';
import { MAGGIE_MAES_STAGES } from '@/lib/config';
import { parseMaggieEvent } from './maggie';
```

### Formatting
- **Prettier** is built into the project - run `npx prettier --write` on changed files
- Use 2 spaces for indentation
- Max line length: 100 characters (soft limit)
- Trailing commas in arrays and objects

### Types
- **NEVER use `any`** - always use proper TypeScript types
- Use explicit return types for hooks and utility functions
- Prefer interfaces for object shapes, types for unions/aliases
- Use `as` casts only when type narrowing fails after exhaustive checks

```typescript
// ✅ Good
interface MaggieEvent {
  raw: NostrEvent;
  id: string;
  title: string;
  stage: MaggieStage | string;
}

// ❌ Bad
const event: any = getEvent();
function parse(data: any): any { ... }
```

### Naming Conventions
- **Variables/functions**: `camelCase` (`useMaggieEvents`, `eventList`)
- **Components**: `PascalCase` (`EventCard`, `LoginArea`)
- **Constants**: `SCREAMING_SNAKE_CASE` for config values, `camelCase` for objects
- **Files**: `kebab-case.tsx` for components, `camelCase.ts` for hooks/utils

### Error Handling
- Wrap async operations in try/catch
- Display user-friendly error messages via toast
- Never silently swallow errors
- Log errors for debugging with context

```typescript
try {
  await publishEvent(event);
  toast({ title: 'Event published successfully' });
} catch (err) {
  console.error('Failed to publish event:', err);
  toast({ 
    title: 'Failed to publish', 
    description: err instanceof Error ? err.message : 'Unknown error',
    variant: 'destructive'
  });
}
```

## Project Essentials

### Tech Stack
- React 18.x, TypeScript 5.x, Vite 8.x, TailwindCSS 3.x
- shadcn/ui + Radix UI components
- Nostrify + nostr-tools for Nostr protocol
- TanStack Query for data fetching

### Key Config Values
```typescript
// src/lib/config.ts
MAGGIE_MAES_PUBKEY = 'ac391a41b2cfb30d77480b5c32322e1989db91db89a253775162871677d1954e'
MAGGIE_MAES_TAG = 'maggiemaes'
MAGGIE_MAES_STAGES = ['The Pub', 'Disco Room', 'Gibson Room', 'Piano Room', 'Cypherpunk Lounge', 'Rooftop Patio']
ADMIN_LIST_DTAG = 'maggiemaes-admin-list'      // NIP-78 kind 30078
TEMPLATES_DTAG = 'maggiemaes-event-templates'  // NIP-78 kind 30078
```

### NIP-52 Calendar Events
- Kind 31923 for time-based events
- Custom tags: `stage`, `price`
- Filter by `t: maggiemaes` hashtag

### Project Structure
```
src/
├── components/ui/    # shadcn/ui components
├── hooks/            # Custom hooks (useMaggieEvents, usePublishMaggieEvent, etc.)
├── lib/              # Utilities (config.ts, maggie.ts)
├── pages/            # Route pages (Index, Events, Admin, Contact)
├── contexts/         # React contexts
└── test/             # Test utilities (TestApp, setup.ts)
```

## Nostr Security Rules

### CRITICAL: Author Filtering
Nostr is permissionless - anyone can publish any event. For admin/privileged operations:

```typescript
// ✅ Secure - filter by trusted authors
await nostr.query([{
  kinds: [30078],
  authors: getAdminPubkeys(),  // Only accept from admins
  '#d': ['maggiemaes-admin-list'],
  limit: 1
}]);

// ❌ INSECURE - accepts events from anyone
await nostr.query([{
  kinds: [30078],
  '#d': ['maggiemaes-admin-list']
}]);
```

### Addressable Events (kinds 30000-39999)
Always include author in URL and filter:
```typescript
// ✅ Secure URL: /article/:npub/:slug
// ✅ Secure filter: { kinds: [30023], authors: [pubkey], '#d': [slug] }
```

## Testing Rules

### When to Write Tests
Only write tests if user explicitly:
- Asks for tests in plain language
- Describes a bug and requests tests to diagnose
- Says they're still experiencing a problem after a fix

### When to Run Tests
**ALWAYS run `npm test`** after any code changes. Task is not complete until it passes.

### Test Setup
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<TestApp><MyComponent /></TestApp>);
    expect(screen.getByText('Expected')).toBeInTheDocument();
  });
});
```

## Validation Checklist

Before committing:
- [ ] `npm run test` passes (tsc + eslint + vitest + build)
- [ ] No TypeScript errors
- [ ] No lint errors
- [ ] Build succeeds
- [ ] Git commit with descriptive message

## Design Standards

- Production-ready, no placeholders
- Apple/Stripe-level polish
- Dynamic, immersive headers (not icon + text)
- Use skeleton loading for feeds, spinners for buttons
- Use `cn()` utility for class merging
- Add `isolate` when using negative z-index