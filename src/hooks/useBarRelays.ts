import { useLocalStorage } from '@/hooks/useLocalStorage';
import { DEFAULT_BAR_RELAYS, BAR_RELAYS_STORAGE_KEY } from '@/lib/config';

/**
 * Reactive hook for reading and writing the bar-specific relay list.
 *
 * These relays are used exclusively for:
 *   - Reading Maggie Mae's calendar events (kind:31923)
 *   - Publishing calendar events from the admin console
 *
 * Completely separate from the logged-in user's personal relay list.
 * Stored in localStorage under BAR_RELAYS_STORAGE_KEY.
 * Falls back to DEFAULT_BAR_RELAYS when nothing is stored.
 */
export function useBarRelays() {
  const [barRelays, setBarRelays] = useLocalStorage<string[]>(
    BAR_RELAYS_STORAGE_KEY,
    DEFAULT_BAR_RELAYS,
  );

  const addRelay = (url: string) => {
    const trimmed = url.trim().replace(/\/$/, ''); // normalize trailing slash
    if (!trimmed || barRelays.includes(trimmed)) return;
    setBarRelays([...barRelays, trimmed]);
  };

  const removeRelay = (url: string) => {
    if (barRelays.length <= 1) return; // always keep at least one
    setBarRelays(barRelays.filter((r) => r !== url));
  };

  const resetToDefaults = () => {
    setBarRelays(DEFAULT_BAR_RELAYS);
  };

  return { barRelays, addRelay, removeRelay, resetToDefaults };
}
