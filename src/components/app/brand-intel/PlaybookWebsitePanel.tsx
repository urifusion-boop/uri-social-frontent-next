'use client';

import type { BrandProfileData } from '@/src/api/BrandProfileService';
import { C, font, GRADIENT, pill, PlaybookPanel, usePanelOpen } from '@/src/components/app/workspace/PlaybookPanel';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { ToastService } from '@/src/utils/toast.util';
import { Drawer } from '@mui/material';
import { useEffect, useState } from 'react';
import WebsiteFindings from './WebsiteFindings';
import WebsiteReadProgress from './WebsiteReadProgress';
import { useWebsiteRead } from './useWebsiteRead';

const DISMISSED_KEY = 'uri_website_read_dismissed';

interface Props {
  profile: BrandProfileData | null;
  onProfileUpdate?: (p: BrandProfileData) => void;
  disabledReason?: string;
}

function readDismissed(): string {
  try {
    return localStorage.getItem(DISMISSED_KEY) ?? '';
  } catch {
    return '';
  }
}

/**
 * "Fill your Playbook from your website" — the existing-user entry to Website → Playbook.
 * Sits with the other Playbook panels; the findings open in a side sheet so the Playbook stays
 * in view while the owner decides.
 */
export default function PlaybookWebsitePanel({ profile, onProfileUpdate, disabledReason }: Props) {
  const [open, toggle, setOpen] = usePanelOpen('uri_website_read_open', false);
  const { read, start, starting, error, setError } = useWebsiteRead();
  const [url, setUrl] = useState(profile?.website ?? '');
  const [sheet, setSheet] = useState(false);
  const [dismissed, setDismissed] = useState('');

  useEffect(() => setDismissed(readDismissed()), []);
  useEffect(() => {
    if (!url && profile?.website) setUrl(profile.website);
  }, [profile?.website, url]);

  // Opened from the "Your Playbook is ready to check" notification.
  useEffect(() => {
    if (read?.status !== 'done') return;
    try {
      if (new URLSearchParams(window.location.search).get('website_read') === '1') setSheet(true);
    } catch {
      // no URL access — nothing to open
    }
  }, [read?.status]);

  const running = read?.status === 'queued' || read?.status === 'running';
  const pending = read?.status === 'done' ? (read.findings ?? []).filter((f) => f.status !== 'same' && !(read.applied ?? []).includes(f.key)) : [];
  const waiting = pending.length > 0 && dismissed !== read?.job_id;
  const lastRead = profile?.website_read?.at ?? read?.read_at;
  const host = (read?.url || url || '').replace(/^https?:\/\//, '').replace(/\/$/, '');

  const begin = async (force = false) => {
    if (disabledReason) {
      setError(disabledReason);
      return;
    }
    if (!url.trim()) {
      setError('Add your website address first, like yourbusiness.com.');
      return;
    }
    setOpen(true);
    await start(url.trim(), force);
  };

  const subtitle = running
    ? `Reading ${host}… you can leave this page`
    : read?.status === 'failed'
      ? read.error?.message ?? "That read didn't finish."
      : waiting
        ? `${pending.length} ${pending.length === 1 ? 'suggestion' : 'suggestions'} from ${read?.site ?? host}, waiting for you`
        : lastRead
          ? `Last read ${new Date(lastRead).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} · nothing changes until you approve it`
          : 'Jane reads your site and suggests updates. Nothing changes until you approve it.';

  return (
    <>
      <PlaybookPanel
        id="pb-website-read"
        open={open}
        onToggle={toggle}
        icon={
          <span aria-hidden style={{ fontSize: 15 }}>
            🌐
          </span>
        }
        title="Fill your Playbook from your website"
        tags={
          waiting ? (
            <span style={pill('#FDF2F7', C.pink)}>{pending.length} new</span>
          ) : running ? (
            <span style={pill(C.amberBg, C.amber)}>Reading</span>
          ) : undefined
        }
        subtitle={subtitle}
        actions={
          waiting ? (
            <button type="button" onClick={() => setSheet(true)} style={btn('primary')}>
              Review
            </button>
          ) : undefined
        }
      >
        <div style={{ ...font, padding: '4px 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {running && read ? (
            <WebsiteReadProgress read={read} compact />
          ) : (
            <>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  id="pb-website-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && begin()}
                  placeholder="yourbusiness.com"
                  inputMode="url"
                  aria-label="Your website"
                  style={{
                    ...font,
                    flex: '1 1 220px',
                    minWidth: 0,
                    border: `1.5px solid ${C.line}`,
                    borderRadius: 20,
                    padding: '9px 14px',
                    fontSize: 13.5,
                    outline: 'none',
                  }}
                />
                <button type="button" onClick={() => begin(Boolean(lastRead))} disabled={starting} style={btn('primary', starting)}>
                  {starting ? 'Starting…' : lastRead ? 'Read again' : 'Read my website'}
                </button>
              </div>
              {read?.status === 'failed' && (
                <div role="alert" style={{ background: C.amberBg, color: C.amber, borderRadius: 10, padding: '9px 12px', fontSize: 13 }}>
                  {read.error?.message} Nothing in your Playbook was changed.
                </div>
              )}
              {waiting && (
                <div style={{ fontSize: 13, color: C.body }}>
                  Jane found {pending.length} things to add or update.{' '}
                  <button type="button" onClick={() => setSheet(true)} style={btn('link')}>
                    Review them
                  </button>
                </div>
              )}
            </>
          )}
          {error && (
            <div role="alert" style={{ fontSize: 12.5, color: C.red }}>
              {error}
            </div>
          )}
        </div>
      </PlaybookPanel>

      <Drawer
        anchor="right"
        open={sheet && read?.status === 'done'}
        onClose={() => setSheet(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, display: 'flex', flexDirection: 'column' } }}
      >
        <div style={{ ...font, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: `1px solid ${C.line}` }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.ink }}>Suggestions from your website</div>
            <div style={{ fontSize: 12, color: C.muted }}>{read?.site}</div>
          </div>
          <button type="button" onClick={() => setSheet(false)} aria-label="Close" style={btn('quiet')}>
            ✕
          </button>
        </div>
        <div style={{ padding: '14px 18px 0', overflowY: 'auto', flex: 1 }}>
          {read?.status === 'done' && (
            <WebsiteFindings
              read={read}
              mode="sheet"
              skipLabel="Not now"
              onSkip={() => {
                try {
                  localStorage.setItem(DISMISSED_KEY, read.job_id ?? '');
                } catch {
                  // ignore
                }
                setDismissed(read.job_id ?? '');
                setSheet(false);
              }}
              onApplied={(updates, applied) => {
                if (profile) onProfileUpdate?.({ ...profile, ...updates });
                ToastService.showToast(
                  `Added ${applied.length} ${applied.length === 1 ? 'thing' : 'things'} from your website to your Playbook.`,
                  ToastTypeEnum.Success
                );
                setDismissed(read.job_id ?? '');
                setSheet(false);
              }}
            />
          )}
        </div>
      </Drawer>
    </>
  );
}

const btn = (kind: 'primary' | 'quiet' | 'link', busy = false): React.CSSProperties => ({
  ...font,
  border: 'none',
  borderRadius: kind === 'primary' ? 20 : 8,
  padding: kind === 'primary' ? '8px 16px' : kind === 'link' ? 0 : '4px 8px',
  background: kind === 'primary' ? GRADIENT : 'none',
  color: kind === 'primary' ? '#fff' : kind === 'link' ? C.pink : C.muted,
  fontWeight: 700,
  fontSize: kind === 'primary' ? 12.5 : 13,
  cursor: busy ? 'default' : 'pointer',
  opacity: busy ? 0.7 : 1,
  textDecoration: kind === 'link' ? 'underline' : 'none',
  whiteSpace: 'nowrap',
});
