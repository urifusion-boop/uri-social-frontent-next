'use client';

import type { BrandProfileData } from '@/src/api/BrandProfileService';
import { C, font, GRADIENT } from '@/src/components/app/workspace/PlaybookPanel';
import { useEffect, useRef, useState } from 'react';
import { SETUP_RETURN_KEY } from './setupReturn';
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

  // Instagram or Facebook asked for but not connected yet: offer to connect it right here.
  const [needsConnect, setNeedsConnect] = useState<SocialSource | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectNote, setConnectNote] = useState('');
  const readSocial = async (source: SocialSource) => {
    setNeedsConnect(null);
    setConnectNote('');
    const r = await start('', false, source);
    if (!r) setNeedsConnect(source); // only "not connected" stops it before it starts
  };

  // A read that started and then found no connection says so the same way.
  const failedSource = failed && read?.error?.code === 'not_connected' ? sourceOf(read) : null;
  const connectFor = needsConnect && ((error && /connect/i.test(error)) || connectNote) ? needsConnect : failedSource;

  /** Meta's sign-in, in this same tab. Once it's connected the app brings the owner straight back
   * here (see returnToSetup in WorkspaceDashboard) and the read starts by itself. A separate
   * sign-in window couldn't be relied on: after Facebook's pages it no longer knew it had been
   * opened by setup, so it stayed open on Connected Accounts and people lost their place. */
  const connect = (source: SocialSource) => {
    const apiBase = process.env.NEXT_PUBLIC_URI_API_BASE_URL?.replace(/\/$/, '') ?? '';
    const path = source === 'instagram' ? 'instagram-direct' : 'facebook-direct';
    localStorage.setItem('outstand_connect_platform', source);
    localStorage.setItem(SETUP_RETURN_KEY, JSON.stringify({ source, at: Date.now() }));
    setConnecting(true);
    setConnectNote('');
    window.location.href = `${apiBase}/social-media/connect/${path}/initiate?source=settings`;
  };

  // Back from Facebook: read the account just connected, or say it wasn't connected.
  const handledReturn = useRef(false);
  useEffect(() => {
    if (!resumed || handledReturn.current || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const readNow = params.get('read');
    const notConnected = params.get('connect_failed');
    if (!readNow && !notConnected) return;
    handledReturn.current = true;
    params.delete('read');
    params.delete('connect_failed');
    const rest = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (rest ? `?${rest}` : ''));
    if (readNow === 'instagram' || readNow === 'facebook') {
      if (failed) reset();
      void readSocial(readNow);
    } else if (notConnected === 'instagram' || notConnected === 'facebook') {
      setNeedsConnect(notConnected);
      setConnectNote(`Your ${LABEL[notConnected]} isn't connected yet. Try again, or choose another way below.`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumed]);

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
          skipLabel="Setup Manually"
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
          Setup Manually instead
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
      {failed && read?.error && !failedSource && (
        <div role="alert" style={{ background: C.amberBg, color: C.amber, borderRadius: 10, padding: '10px 14px', fontSize: 13, maxWidth: 460 }}>
          {read.error.message} You can try again, or set it up manually — it takes a few minutes.
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
      {connectFor ? (
        <div
          role="alert"
          style={{
            background: C.amberBg,
            borderRadius: 12,
            padding: '12px 16px',
            maxWidth: 460,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div style={{ fontSize: 13, color: C.amber, lineHeight: 1.5 }}>
            {connecting
              ? `Taking you to Facebook… You'll come straight back here and I'll read your ${LABEL[connectFor]}.`
              : `Your ${LABEL[connectFor]} isn't connected yet. Connect it here and I'll read it straight away.`}
          </div>
          <button type="button" disabled={connecting} onClick={() => connect(connectFor)} style={{ ...primaryBtn, opacity: connecting ? 0.7 : 1 }}>
            {connecting ? 'Opening Facebook…' : `Connect ${LABEL[connectFor]}`}
          </button>
        </div>
      ) : (
        error && (
          <div role="alert" style={{ fontSize: 12.5, color: C.red }}>
            {error}
          </div>
        )
      )}
      {connectNote && (
        <div role="status" style={{ fontSize: 12.5, color: C.red, maxWidth: 460 }}>
          {connectNote}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', maxWidth: 460, color: C.muted, fontSize: 12 }}>
        <span style={{ flex: 1, height: 1, background: C.line }} />
        or
        <span style={{ flex: 1, height: 1, background: C.line }} />
      </div>
      <button type="button" onClick={() => onManual(url.trim() || undefined)} style={manualBtn}>
        Setup Manually
      </button>
      <div style={{ fontSize: 13, color: C.muted, display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
        No website?
        <button type="button" disabled={starting || connecting} onClick={() => void readSocial('instagram')} style={linkBtn}>
          Read my Instagram
        </button>
        ·
        <button type="button" disabled={starting || connecting} onClick={() => void readSocial('facebook')} style={linkBtn}>
          Read my Facebook Page
        </button>
      </div>
    </div>
  );
}

type SocialSource = 'instagram' | 'facebook';

const LABEL: Record<SocialSource, string> = { instagram: 'Instagram', facebook: 'Facebook Page' };

/** Which account a "not connected" read was for — the read itself only says so in its message. */
function sourceOf(read: { error?: { message?: string } } | null): SocialSource {
  return /instagram/i.test(read?.error?.message || '') ? 'instagram' : 'facebook';
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

const primaryBtn: React.CSSProperties = {
  ...font,
  border: 'none',
  borderRadius: 24,
  padding: '10px 20px',
  background: GRADIENT,
  color: '#fff',
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
  boxShadow: '0 4px 14px rgba(194,24,91,.25)',
};

const manualBtn: React.CSSProperties = {
  ...font,
  width: '100%',
  maxWidth: 460,
  background: '#fff',
  border: `1.5px solid ${C.pink}`,
  borderRadius: 24,
  padding: '11px 22px',
  color: C.pink,
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
};
