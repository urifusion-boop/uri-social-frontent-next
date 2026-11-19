'use client';

import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from 'react-icons/fa';

export const PLATFORM_LABEL: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  whatsapp: 'WhatsApp',
  tiktok: 'TikTok',
};

const PLATFORM_BG: Record<string, string> = {
  instagram: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fd5949 45%, #d6249f 60%, #285AEB 90%)',
  facebook: '#1877F2',
  whatsapp: '#25D366',
  tiktok: '#111111',
};

function Glyph({ platform, size }: { platform: string; size: number }) {
  const s = Math.round(size * 0.58);
  if (platform === 'instagram') return <FaInstagram size={s} color="#fff" />;
  if (platform === 'facebook') return <FaFacebookF size={s} color="#fff" />;
  if (platform === 'whatsapp') return <FaWhatsapp size={s} color="#fff" />;
  if (platform === 'tiktok') return <FaTiktok size={s} color="#fff" />;
  return null;
}

/** A network's own round mark. */
export function PlatformIcon({ platform, size = 16, radius = '50%' }: { platform: string; size?: number; radius?: string }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: PLATFORM_BG[platform] ?? '#999',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Glyph platform={platform} size={size} />
    </span>
  );
}

const AVATAR_COLORS = ['#26348B', '#F07B1F', '#6A2DB5', '#1E7468', '#4B3BA6', '#C2185B', '#0E7490', '#9A3412'];

export function avatarColor(seed: string): string {
  let h = 0;
  for (const ch of seed || '?') h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function initialsOf(name: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return ((parts[0][0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}

/** A contact's avatar (initials on a colour) with their network's mark on the corner.
 *  `plain` draws just the network mark. */
export function PlatformBadge({
  platform,
  size,
  initials,
  color,
  plain,
}: {
  platform: string;
  size: number;
  initials?: string;
  color?: string;
  plain?: boolean;
}) {
  if (plain) return <PlatformIcon platform={platform} size={size} />;
  const badge = Math.max(14, Math.round(size * 0.42));
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: color ?? '#26348B',
        color: '#fff',
        fontWeight: 600,
        fontSize: Math.round(size * 0.33),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {initials ?? '?'}
      <span
        style={{
          position: 'absolute',
          right: -5,
          bottom: -4,
          border: '2px solid #fff',
          borderRadius: '50%',
          display: 'flex',
        }}
      >
        <PlatformIcon platform={platform} size={badge} />
      </span>
    </div>
  );
}
