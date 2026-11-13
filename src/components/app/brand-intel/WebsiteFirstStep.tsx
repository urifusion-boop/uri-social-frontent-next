'use client';

import type { BrandProfileData } from '@/src/api/BrandProfileService';
import { C, font, GRADIENT } from '@/src/components/app/workspace/PlaybookPanel';
import { useEffect, useState } from 'react';
import WebsiteFindings from './WebsiteFindings';
import WebsiteReadProgress from './WebsiteReadProgress';
import { useWebsiteRead } from './useWebsiteRead';

interface Props {
  initialUrl?: string;
  /** The website's findings were applied: the page fills itself from these and shortens the setup. */
  onApplied: (updates: Partial<BrandProfileData>) => void;
  /** No website, or the owner would rather type: the full step-by-step setup. */
  onManual: (website?: string) => void;
}

/**
 * Brand setup, step 1: "What's your website?" Jane reads it in the background, shows what she
 * finds as she finds it, then lays it out to check. The owner confirms instead of typing.
 * Leaving and coming back picks the same read up again (it runs on the server).
 */
export default function WebsiteFirstStep({ initialUrl = '', onApplied, onManual }: Props) {
  const { read, start, starting, error, setError, reset, resumed } = useWebsiteRead();
  const [url, setUrl] = useState(initialUrl);
  useEffect(() => {
    if (!url && initialUrl) setUrl(initialUrl);
  }, [initialUrl, url]);

  // A read finished earlier and already used: nothing to pick up, start fresh.
  const usable = read && !(read.status === 'done' && (read.applied?.length ?? 0) > 0);
  const running = usable && (read.status === 'queued' || read.status === 'running');
  const failed = usable && read.status === 'failed';
  const done = usable && read.status === 'done';

  const begin = async () => {
    if (!url.trim()) {
      setError('Add your website address, like yourbusiness.com.');
      return;
    }
    await start(url.trim());
  };

  if (!resumed) return <div style={{ minHeight: 240 }} aria-busy="true" />;

  if (done && read) {
    return (
      <div style={{ ...font, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Heading title="Here's what I found" sub="Check my work. Tap anything to change it, or untick what's wrong." />
        <WebsiteFindings
          read={read}
          mode="onboarding"
          skipLabel="Set up by hand"
          onSkip={() => onManual(read.url)}
          onApplied={(updates) => onApplied({ website: read.url, ...updates })}
        />
      </div>
    );
  }

  if (running && read) {
    return (
      <div style={{ ...font, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <WebsiteReadProgress read={read} />
        <button type="button" onClick={() => onManual(read.url)} style={linkBtn}>
          Set up by hand instead
        </button>
      </div>
    );
  }

  return (
    <div style={{ ...font, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14, padding: '8px 0' }}>
      <div
        aria-hidden
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: GRADIENT,
          color: '#fff',
          fontWeight: 800,
          fontSize: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(194,24,91,.25)',
        }}
      >
        J
      </div>
      <Heading
        title="What's your website?"
        sub="I'll read it and set up your Brand Playbook, so you only check my work instead of typing everything."
        center
      />
      {failed && read?.error && (
        <div role="alert" style={{ background: C.amberBg, color: C.amber, borderRadius: 10, padding: '10px 14px', fontSize: 13, maxWidth: 460 }}>
          {read.error.message} You can try again, or set up by hand — it takes a few minutes.
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (failed) reset();
          void begin();
        }}
        style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 460, flexWrap: 'wrap' }}
      >
        <input
          id="onboarding-website"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (error) setError('');
          }}
          placeholder="yourbusiness.com"
          inputMode="url"
          autoComplete="url"
          aria-label="Your website"
          autoFocus
          style={{
            ...font,
            flex: '1 1 220px',
            minWidth: 0,
            border: `1.5px solid ${error ? C.red : C.line}`,
            borderRadius: 24,
            padding: '12px 16px',
            fontSize: 15,
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={starting}
          style={{
            ...font,
            border: 'none',
            borderRadius: 24,
            padding: '12px 22px',
            background: GRADIENT,
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            cursor: starting ? 'default' : 'pointer',
            opacity: starting ? 0.7 : 1,
            boxShadow: '0 4px 14px rgba(194,24,91,.25)',
          }}
        >
          {starting ? 'Starting…' : failed ? 'Try again' : 'Read it'}
        </button>
      </form>
      {error && (
        <div role="alert" style={{ fontSize: 12.5, color: C.red }}>
          {error}
        </div>
      )}
      <div style={{ fontSize: 13, color: C.muted, display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
        No website?
        <button type="button" disabled={starting} onClick={() => void start('', false, 'instagram')} style={linkBtn}>
          Read my Instagram
        </button>
        ·
        <button type="button" disabled={starting} onClick={() => void start('', false, 'facebook')} style={linkBtn}>
          Read my Facebook Page
        </button>
        ·
        <button type="button" onClick={() => onManual(url.trim() || undefined)} style={linkBtn}>
          Set up by hand
        </button>
      </div>
    </div>
  );
}

function Heading({ title, sub, center = false }: { title: string; sub: string; center?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: center ? 'center' : 'flex-start' }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#0d0e0f' }}>{title}</div>
      <div style={{ fontSize: 14, color: C.muted, maxWidth: 460, lineHeight: 1.55 }}>{sub}</div>
    </div>
  );
}

const linkBtn: React.CSSProperties = {
  ...font,
  background: 'none',
  border: 'none',
  padding: 0,
  color: C.pink,
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
  textDecoration: 'underline',
  textUnderlineOffset: 3,
};
