import { useLocalStorage } from '@/hooks/useLocalStorage';
import { DEFAULT_BLOSSOM_SERVERS, BLOSSOM_SERVERS_STORAGE_KEY } from '@/lib/config';

/**
 * Reactive hook for reading and writing the Blossom server list.
 *
 * Blossom servers are used for uploading media files (images, etc.)
 * via the Blossom protocol (NIP-96).
 *
 * Stored in localStorage under BLOSSOM_SERVERS_STORAGE_KEY.
 * Falls back to DEFAULT_BLOSSOM_SERVERS when nothing is stored.
 */
export function useBlossomServers() {
  const [servers, setServers] = useLocalStorage<string[]>(
    BLOSSOM_SERVERS_STORAGE_KEY,
    DEFAULT_BLOSSOM_SERVERS,
  );

  const addServer = (url: string) => {
    let normalized = url.trim();
    if (!normalized.startsWith('https://') && !normalized.startsWith('http://')) {
      normalized = 'https://' + normalized;
    }
    normalized = normalized.replace(/\/$/, '');
    if (!normalized || servers.includes(normalized)) return false;
    setServers([...servers, normalized]);
    return true;
  };

  const removeServer = (url: string) => {
    if (servers.length <= 1) return; // always keep at least one
    setServers(servers.filter((s) => s !== url));
  };

  const resetToDefaults = () => {
    setServers(DEFAULT_BLOSSOM_SERVERS);
  };

  return { servers, addServer, removeServer, resetToDefaults };
}
