import { nip19 } from 'nostr-tools';
import { useParams } from 'react-router-dom';
import { ProfilePage } from './ProfilePage';
import { EventPage } from './EventPage';
import NotFound from './NotFound';

export function NIP19Page() {
  const { nip19: identifier } = useParams<{ nip19: string }>();

  if (!identifier) {
    return <NotFound />;
  }

  let decoded;
  try {
    decoded = nip19.decode(identifier);
  } catch {
    return <NotFound />;
  }

  const { type } = decoded;

  switch (type) {
    case 'npub':
    case 'nprofile':
      // npub: decoded.data is the raw hex string
      // nprofile: decoded.data is { pubkey, relays, ... }
      const pubkey = type === 'npub' ? decoded.data : decoded.data.pubkey;
      return <ProfilePage pubkey={pubkey} />;

    case 'note':
      // AI agent should implement note view here
      return <div>Note placeholder</div>;

    case 'nevent':
      // AI agent should implement event view here
      return <div>Event placeholder</div>;

    case 'naddr':
      if (decoded.data.kind === 31923) {
        return <EventPage naddr={decoded.data} />;
      }
      return <NotFound />;

    default:
      return <NotFound />;
  }
}
