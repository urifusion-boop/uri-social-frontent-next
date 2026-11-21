'use client';

// Admin → User Details → Delete account.
// Preview first (what goes, what has to be settled), then one of two clearly
// different deletions, confirmed by typing the account's email, then a live
// progress and a final report that says whether anything was left behind.
// The backend does the real work and the real checks (app/services/account_deletion.py).

import { useEffect, useRef, useState } from 'react';
import {
  AccountDeletionJob,
  AccountDeletionMode,
  AccountDeletionPreview,
  AdminService,
  AdminUserDetails,
} from '@/src/api/AdminService';

const RED = '#B71C1C';
const card: React.CSSProperties = {
  padding: 16,
  background: 'rgba(0,0,0,.02)',
  border: '1px solid rgba(0,0,0,.06)',
  borderRadius: 8,
};
const btn = (bg: string, disabled = false): React.CSSProperties => ({
  padding: '8px 14px',
  fontSize: 12,
  fontWeight: 700,
  color: 'white',
  background: bg,
  border: 'none',
  borderRadius: 8,
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.5 : 1,
});
const naira = (n: number) => `₦${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

function errorText(error: unknown, fallback: string): string {
  const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (detail && typeof detail === 'object' && 'message' in detail) return String((detail as { message: string }).message);
  return fallback;
}

export default function AdminDeleteAccount({
  user,
  onDeleted,
}: {
  user: AdminUserDetails;
  onDeleted: (userId: string) => void;
}) {
  const [preview, setPreview] = useState<AccountDeletionPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pausing, setPausing] = useState(false);
  const [pauseNote, setPauseNote] = useState<string | null>(null);
  const [walletOk, setWalletOk] = useState(false);
  const [mode, setMode] = useState<AccountDeletionMode | null>(null);
  const [typed, setTyped] = useState('');
  const [starting, setStarting] = useState(false);
  const [job, setJob] = useState<AccountDeletionJob | null>(null);
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (poll.current) clearInterval(poll.current);
  }, []);

  const loadPreview = async () => {
    setLoading(true);
    setError(null);
    try {
      setPreview(await AdminService.getDeletionPreview(user.id));
      setWalletOk(false);
    } catch (e) {
      setError(errorText(e, 'Could not load what would be deleted.'));
    } finally {
      setLoading(false);
    }
  };

  const pauseAll = async () => {
    setPausing(true);
    setPauseNote(null);
    try {
      const r = await AdminService.pauseUserCampaigns(user.id);
      setPauseNote(
        r.failed.length
          ? `Paused ${r.paused.length}. Could not pause: ${r.failed.map((f) => `${f.name} (${f.platform}): ${f.error}`).join('; ')}`
          : `Paused ${r.paused.length} campaign${r.paused.length === 1 ? '' : 's'}.`
      );
      await loadPreview();
    } catch (e) {
      setPauseNote(errorText(e, 'Could not pause the campaigns.'));
    } finally {
      setPausing(false);
    }
  };

  const follow = (jobId: string) => {
    if (poll.current) clearInterval(poll.current);
    const tick = async () => {
      try {
        const j = await AdminService.getAccountDeletion(jobId);
        setJob(j);
        if (j.status !== 'running' && poll.current) {
          clearInterval(poll.current);
          poll.current = null;
        }
      } catch {
        /* next tick tries again */
      }
    };
    void tick();
    poll.current = setInterval(tick, 2000);
  };

  const start = async () => {
    if (!preview || !mode) return;
    setStarting(true);
    setError(null);
    try {
      const wallet = preview.blockers.find((b) => b.kind === 'ad_wallet');
      const r = await AdminService.deleteUserAccount(user.id, {
        mode,
        confirm_email: typed.trim(),
        ...(wallet && walletOk ? { forfeit_wallet_ngn: wallet.total_ngn } : {}),
      });
      follow(r.job_id);
    } catch (e) {
      setError(errorText(e, 'The deletion could not start.'));
      await loadPreview();
    } finally {
      setStarting(false);
    }
  };

  const resume = async () => {
    if (!job) return;
    try {
      await AdminService.resumeAccountDeletion(job.job_id);
      follow(job.job_id);
    } catch (e) {
      setError(errorText(e, 'Could not resume.'));
    }
  };

  // ── After starting: progress, then the report ──────────────────────────────
  if (job) {
    const r = job.report || {};
    const sum = (o?: Record<string, number>) => Object.values(o || {}).reduce((a, b) => a + b, 0);
    const left = Object.entries(r.remaining || {});
    const access = Object.entries(r.connected_accounts || {});
    return (
      <Section>
        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {job.status === 'running' && (
            <div style={{ fontSize: 13, color: '#1a1a1a' }}>
              <strong>Deleting…</strong> <span style={{ color: '#666' }}>{job.progress}</span>
            </div>
          )}
          {job.status === 'failed' && (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: RED }}>The deletion stopped part-way.</div>
              <div style={{ fontSize: 12, color: '#666' }}>{job.error}</div>
              <div>
                <button style={btn(RED)} onClick={resume}>
                  Finish the deletion
                </button>
              </div>
            </>
          )}
          {(job.status === 'done' || job.status === 'done_with_leftovers') && (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: left.length ? RED : '#2E7D32' }}>
                {left.length ? 'Deleted, but some traces were found afterwards' : 'Account deleted. Nothing of it remains.'}
              </div>
              <div style={{ fontSize: 12, color: '#444', lineHeight: 1.6 }}>
                {sum(r.deleted).toLocaleString()} records deleted · {sum(r.scrubbed).toLocaleString()} shared records
                cleaned
                {job.mode === 'keep_payments' && <> · {sum(r.anonymised).toLocaleString()} payment records kept without personal details</>}
                {' · '}
                {(r.files?.deleted ?? 0).toLocaleString()} files deleted
                {job.forfeited_wallet_ngn ? <> · {naira(job.forfeited_wallet_ngn)} ad wallet balance given up</> : null}
              </div>
              {access.length > 0 && (
                <div style={{ fontSize: 12, color: '#666' }}>
                  Connected accounts: {access.map(([k, v]) => `${k} ×${v}`).join(', ')}
                </div>
              )}
              {left.length > 0 && (
                <>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    Still mentioned in: {left.map(([k, v]) => `${k} (${v})`).join(', ')}
                  </div>
                  <div>
                    <button style={btn(RED)} onClick={resume}>
                      Run the clean-up again
                    </button>
                  </div>
                </>
              )}
              {!!r.errors?.length && (
                <details style={{ fontSize: 12, color: '#666' }}>
                  <summary style={{ cursor: 'pointer' }}>{r.errors.length} note(s)</summary>
                  <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                    {r.errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </details>
              )}
              {!left.length && (
                <div>
                  <button style={btn('#1a1a1a')} onClick={() => onDeleted(user.id)}>
                    Close
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </Section>
    );
  }

  // ── Before: the entry point ──────────────────────────────────────────────
  if (!preview) {
    return (
      <Section>
        <div style={{ ...card, borderColor: 'rgba(183,28,28,.25)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 13, color: '#444' }}>
            Permanently removes this account and everything it owns. This cannot be undone.
          </div>
          <div>
            <button style={btn(RED, loading)} disabled={loading} onClick={loadPreview}>
              {loading ? 'Checking…' : 'Review what will be deleted'}
            </button>
          </div>
          {error && <div style={{ fontSize: 12, fontWeight: 600, color: RED }}>{error}</div>}
        </div>
      </Section>
    );
  }

  // ── Preview, blockers, the two choices, confirmation ─────────────────────
  const live = preview.blockers.find((b) => b.kind === 'live_campaigns');
  const wallet = preview.blockers.find((b) => b.kind === 'ad_wallet');
  const admin = preview.blockers.find((b) => b.kind === 'admin');
  const blocked = !!live || !!admin || (!!wallet && !walletOk);
  const emailMatches = typed.trim().toLowerCase() === (preview.email || '').toLowerCase() && typed.trim() !== '';
  const canDelete = !blocked && !!mode && emailMatches && !starting;
  const pay = preview.payment_records;

  return (
    <Section>
      <div style={{ ...card, borderColor: 'rgba(183,28,28,.25)', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* What goes */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 }}>
            {preview.records_total.toLocaleString()} records will be deleted
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {preview.areas.map((a) => (
              <span
                key={a.area}
                style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 999, background: 'rgba(0,0,0,.05)', color: '#444' }}
              >
                {a.area} · {a.count.toLocaleString()}
              </span>
            ))}
          </div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 8, lineHeight: 1.6 }}>
            {preview.brands.length > 0 && <>Brands: {preview.brands.map((b) => b.name || b.brand_id).join(', ')}. </>}
            {preview.connected_accounts > 0 && (
              <>
                {preview.connected_accounts} connected social account{preview.connected_accounts === 1 ? '' : 's'}: Uri&apos;s
                access is cancelled and the saved tokens deleted.{' '}
              </>
            )}
            Uploaded files are deleted too. Mentions in shared records are replaced with &quot;deleted account&quot;.
          </div>
          {preview.agencies.map((a) => (
            <div key={a.agency_id} style={{ fontSize: 12, color: RED, marginTop: 6 }}>
              Owns the agency “{a.name || a.agency_id}”: the agency and all its client brands are deleted too
              {a.other_members.length > 0 && <>, and these members lose access: {a.other_members.join(', ')}</>}.
            </div>
          ))}
        </div>

        {/* What has to be settled first */}
        {(live || wallet || admin) && (
          <div style={{ padding: 12, borderRadius: 8, background: 'rgba(237,108,2,.07)', border: '1px solid rgba(237,108,2,.25)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {admin && <div style={{ fontSize: 12, fontWeight: 600, color: '#8a4b00' }}>{admin.message} (Admin Access, above.)</div>}
            {live && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#8a4b00' }}>{live.message}</div>
                <div style={{ fontSize: 12, color: '#666' }}>
                  {(live.items || []).map((c) => ('name' in c ? `${c.name} (${c.platform})` : '')).join(', ')}
                </div>
                <div>
                  <button style={btn('#ED6C02', pausing)} disabled={pausing} onClick={pauseAll}>
                    {pausing ? 'Pausing…' : 'Pause all and continue'}
                  </button>
                </div>
              </div>
            )}
            {pauseNote && <div style={{ fontSize: 12, color: '#666' }}>{pauseNote}</div>}
            {wallet && (
              <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: '#8a4b00', cursor: 'pointer' }}>
                <input type="checkbox" checked={walletOk} onChange={(e) => setWalletOk(e.target.checked)} style={{ marginTop: 2 }} />
                <span>
                  <strong>{naira(wallet.total_ngn || 0)}</strong> is left in the ad wallet. I have refunded it to the customer,
                  or they give it up: it will be lost when the account is deleted.
                </span>
              </label>
            )}
          </div>
        )}

        {/* The two deletions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          <Choice
            active={mode === 'everything'}
            onClick={() => setMode('everything')}
            title="Delete everything"
            text={`Wipes the account completely, including its payment history${pay ? ` (${pay} payment record${pay === 1 ? '' : 's'})` : ''}. Nothing of it remains.`}
          />
          <Choice
            active={mode === 'keep_payments'}
            onClick={() => setMode('keep_payments')}
            title="Delete, keep payment records"
            text={`Deletes everything else. ${pay ? `Keeps ${pay} payment record${pay === 1 ? '' : 's'}` : 'Keeps payment records'} for the books: amounts, dates and references stay; name, email, phone and card details are removed.`}
          />
        </div>

        {/* Confirm */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 12, color: '#444' }}>
            Type <strong>{preview.email}</strong> to confirm
          </div>
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={preview.email}
            autoComplete="off"
            style={{ padding: '8px 10px', fontSize: 13, border: '1px solid rgba(0,0,0,.15)', borderRadius: 8, outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button style={btn(RED, !canDelete)} disabled={!canDelete} onClick={start}>
            {starting ? 'Starting…' : mode === 'keep_payments' ? 'Delete, keep payment records' : 'Delete everything'}
          </button>
          <button
            style={{ ...btn('transparent'), color: '#666', border: '1px solid rgba(0,0,0,.12)' }}
            onClick={() => {
              setPreview(null);
              setMode(null);
              setTyped('');
            }}
          >
            Cancel
          </button>
          {blocked && <span style={{ fontSize: 12, color: '#8a4b00' }}>Settle the items above first.</span>}
          {!blocked && !mode && <span style={{ fontSize: 12, color: '#999' }}>Choose one of the two deletions.</span>}
        </div>
        {error && <div style={{ fontSize: 12, fontWeight: 600, color: RED }}>{error}</div>}
      </div>
    </Section>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px', color: RED }}>Delete account</h3>
      {children}
    </div>
  );
}

function Choice({ active, onClick, title, text }: { active: boolean; onClick: () => void; title: string; text: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: 'left',
        padding: 12,
        borderRadius: 8,
        cursor: 'pointer',
        background: active ? 'rgba(183,28,28,.06)' : 'white',
        border: `1.5px solid ${active ? RED : 'rgba(0,0,0,.1)'}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 700, color: active ? RED : '#1a1a1a' }}>{title}</span>
      <span style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>{text}</span>
    </button>
  );
}
