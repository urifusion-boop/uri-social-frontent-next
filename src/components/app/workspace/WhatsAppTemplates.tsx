'use client';

import { useState } from 'react';
import { InboxService, WhatsAppTemplate } from '@/src/api/InboxService';

/*
 * After 24 hours without a message from the customer, WhatsApp only allows approved
 * templates. This lists the number's approved templates and sends one.
 */
export function WhatsAppTemplatePicker({ conversationId }: { conversationId: string }) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<WhatsAppTemplate[] | null>(null);
  const [picked, setPicked] = useState<WhatsAppTemplate | null>(null);
  const [params, setParams] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const next = !open;
    setOpen(next);
    setStatus('');
    if (next && templates === null) {
      try {
        setTemplates(await InboxService.whatsappTemplates(conversationId));
      } catch {
        setTemplates([]);
        setStatus("Couldn't load your WhatsApp templates.");
      }
    }
  }

  async function send() {
    if (!picked) return;
    setBusy(true);
    setStatus('');
    try {
      const r = await InboxService.sendWhatsAppTemplate(conversationId, picked.name, picked.language, params);
      setStatus(r.delivery === 'accepted' ? 'Template sent.' : `Not sent: ${r.failure_reason || r.delivery}`);
      if (r.delivery === 'accepted') {
        setPicked(null);
        setParams([]);
      }
    } catch (e) {
      const d = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setStatus(d || "Couldn't send that template.");
    }
    setBusy(false);
  }

  const field = {
    border: '1px solid rgba(0,0,0,.15)',
    borderRadius: 8,
    padding: '6px 8px',
    fontSize: 12.5,
    width: '100%',
    boxSizing: 'border-box' as const,
  };

  return (
    <div style={{ marginTop: 8, fontSize: 12 }}>
      <button
        type="button"
        onClick={toggle}
        style={{ background: 'none', border: 'none', color: '#1B8A4B', fontWeight: 700, cursor: 'pointer', padding: 0 }}
      >
        {open ? 'Hide templates' : 'Send a WhatsApp template (needed after 24 hours)'}
      </button>
      {open && (
        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {templates === null && <div style={{ color: '#999' }}>Loading…</div>}
          {templates?.length === 0 && !status && (
            <div style={{ color: '#999' }}>No approved templates yet. Create them in WhatsApp Manager.</div>
          )}
          {templates && templates.length > 0 && (
            <select
              value={picked?.name ?? ''}
              onChange={(e) => {
                const t = templates.find((x) => x.name === e.target.value) ?? null;
                setPicked(t);
                setParams(Array(t?.variables ?? 0).fill(''));
              }}
              style={field}
            >
              <option value="">Choose a template…</option>
              {templates.map((t) => (
                <option key={`${t.name}:${t.language}`} value={t.name}>
                  {t.name} ({t.language})
                </option>
              ))}
            </select>
          )}
          {picked && (
            <>
              <div
                style={{
                  background: '#F1FBF5',
                  borderRadius: 8,
                  padding: '8px 10px',
                  color: '#333',
                  whiteSpace: 'pre-line',
                }}
              >
                {picked.body}
              </div>
              {params.map((p, i) => (
                <input
                  key={i}
                  style={field}
                  placeholder={`Value for {{${i + 1}}}`}
                  value={p}
                  onChange={(e) => setParams(params.map((x, j) => (j === i ? e.target.value : x)))}
                />
              ))}
              <button
                type="button"
                onClick={send}
                disabled={busy || params.some((p) => !p.trim())}
                style={{
                  alignSelf: 'flex-start',
                  background: '#25D366',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '6px 14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  opacity: busy || params.some((p) => !p.trim()) ? 0.6 : 1,
                }}
              >
                {busy ? 'Sending…' : 'Send template'}
              </button>
            </>
          )}
          {status && <div style={{ color: status === 'Template sent.' ? '#2E7D32' : '#C62828' }}>{status}</div>}
        </div>
      )}
    </div>
  );
}
