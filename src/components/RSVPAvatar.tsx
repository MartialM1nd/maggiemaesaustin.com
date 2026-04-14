import { Link } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { isValidImageUrl } from '@/lib/validation';
import { cn } from '@/lib/utils';

interface RSVPAvatarProps {
  pubkey: string;
  /** 'sm' = 7x7 (event card), 'md' = 8x8 (event detail). Defaults to 'sm'. */
  size?: 'sm' | 'md';
}

export function RSVPAvatar({ pubkey, size = 'sm' }: RSVPAvatarProps) {
  const author = useAuthor(pubkey);
  const meta = author.data?.metadata;
  const name = meta?.name ?? genUserName(pubkey);
  const npub = nip19.npubEncode(pubkey);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link to={`/${npub}`} className="hover:opacity-80 transition-opacity">
          <Avatar
            className={cn(
              'border-2 border-background -ml-2 first:ml-0 hover:z-10 relative transition-transform hover:scale-110',
              size === 'md' ? 'w-8 h-8' : 'w-7 h-7',
            )}
          >
            <AvatarImage
              src={isValidImageUrl(meta?.picture || '') ? meta?.picture : undefined}
              alt={name}
            />
            <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
              {name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="text-xs">{name}</p>
      </TooltipContent>
    </Tooltip>
  );
}
