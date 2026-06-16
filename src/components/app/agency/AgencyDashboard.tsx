'use client';

import React, { useEffect, useState } from 'react';
import {
  AgencyService,
  Agency,
  RosterBrand,
  AgencyMember,
  BrandAccount,
  PortfolioReport,
  setActiveBrandId,
  getActiveBrandId,
} from '@/src/api/AgencyService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { FiPlus, FiUsers, FiGrid, FiBarChart2, FiCreditCard, FiCopy, FiX, FiEdit2, FiCheck } from 'react-icons/fi';

const URI_PINK = '#CD1B78';

type Section = 'roster' | 'members' | 'reports';

export default function AgencyDashboard() {
  const [loading, setLoading] = useState(true);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [section, setSection] = useState<Section>('roster');
  const [activeBrand, setActiveBrand] = useState<string | null>(getActiveBrandId());

  useEffect(() => {
    (async () => {
      try {
        const res = await AgencyService.getAgency();
        setAgency(res.status ? res.responseData ?? null : null);
      } catch {
        setAgency(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>Loading agency…</div>;
  }

  if (!agency) {
    return <CreateAgencyPrompt onCreated={(a) => setAgency(a)} />;
  }

  return (
    <div style={{ padding: '24px 32px 100px', maxWidth: 1200, margin: '0 auto', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <EditableAgencyName agency={agency} onChange={setAgency} />
        <WalletBadge agency={agency} onChange={setAgency} />
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <TabBtn active={section === 'roster'} onClick={() => setSection('roster')} icon={<FiGrid size={15} />} label="Roster" />
        <TabBtn active={section === 'members'} onClick={() => setSection('members')} icon={<FiUsers size={15} />} label="Members" />
        <TabBtn active={section === 'reports'} onClick={() => setSection('reports')} icon={<FiBarChart2 size={15} />} label="Reports" />
      </div>

      {section === 'roster' && (
        <RosterSection
          activeBrand={activeBrand}
          onOpenBrand={(bid) => {
            // Persist the active brand, then do a full navigation so the ENTIRE app
            // (Jane, playbook, drafts, performance, profile) re-fetches for the new
            // brand. Without a hard reset, stale state from the previous brand can be
            // saved under the new brand_id — a cross-brand data corruption risk.
            setActiveBrandId(bid);
            setActiveBrand(bid);
            ToastService.showToast('Switching brand…', ToastTypeEnum.Success);
            window.location.assign('/workspace');
          }}
        />
      )}
      {section === 'members' && <MembersSection />}
      {section === 'reports' && <ReportsSection />}
    </div>
  );
}

// ── Create-agency prompt ──────────────────────────────────────────────────

function CreateAgencyPrompt({ onCreated }: { onCreated: (a: Agency) => void }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <div style={{ padding: '60px 24px', maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🏢</div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111', margin: '0 0 8px' }}>Set up your agency</h1>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
        Manage many brands under one organization with one shared credit pool. Each brand stays fully isolated.
      </p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Agency name (e.g. Lagos Creative Agency)"
        style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `2px solid ${name ? URI_PINK : '#e5e7eb'}`, fontSize: 15, outline: 'none', marginBottom: 16, boxSizing: 'border-box' }}
      />
      <button
        disabled={!name.trim() || busy}
        onClick={async () => {
          setBusy(true);
          try {
            const res = await AgencyService.createAgency(name.trim());
            if (res.status && res.responseData) { ToastService.showToast('Agency created', ToastTypeEnum.Success); onCreated(res.responseData); }
            else ToastService.showToast(res.responseMessage || 'Failed', ToastTypeEnum.Error);
          } catch { ToastService.showToast('Failed to create agency', ToastTypeEnum.Error); }
          finally { setBusy(false); }
        }}
        style={{ width: '100%', padding: 14, borderRadius: 10, border: 'none', background: !name.trim() || busy ? '#e5e7eb' : `linear-gradient(135deg, ${URI_PINK}, #E94396)`, color: !name.trim() || busy ? '#9ca3af' : 'white', fontSize: 15, fontWeight: 700, cursor: !name.trim() || busy ? 'not-allowed' : 'pointer' }}
      >
        {busy ? 'Creating…' : 'Create Agency'}
      </button>
    </div>
  );
}

// ── Editable agency name ─────────────────────────────────────────────────────

function EditableAgencyName({ agency, onChange }: { agency: Agency; onChange: (a: Agency) => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(agency.name);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === agency.name) { setEditing(false); setName(agency.name); return; }
    setBusy(true);
    try {
      const res = await AgencyService.updateAgency(trimmed);
      if (res.status && res.responseData) {
        onChange(res.responseData);
        ToastService.showToast('Agency name updated', ToastTypeEnum.Success);
        setEditing(false);
      } else {
        ToastService.showToast(res.responseMessage || 'Failed to update name', ToastTypeEnum.Error);
      }
    } catch {
      ToastService.showToast('Failed to update name', ToastTypeEnum.Error);
    } finally {
      setBusy(false);
    }
  };

  if (editing) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            autoFocus
            aria-label="Agency name"
            placeholder="Agency name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setEditing(false); setName(agency.name); } }}
            disabled={busy}
            style={{ fontSize: 22, fontWeight: 800, color: '#111', border: `2px solid ${URI_PINK}`, borderRadius: 8, padding: '4px 10px', outline: 'none' }}
          />
          <button onClick={save} disabled={busy} title="Save" style={{ background: 'none', border: 'none', cursor: busy ? 'not-allowed' : 'pointer', color: URI_PINK, padding: 4 }}>
            <FiCheck size={18} />
          </button>
          <button onClick={() => { setEditing(false); setName(agency.name); }} disabled={busy} title="Cancel" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}>
            <FiX size={18} />
          </button>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6b7280' }}>One agency. Many brands. One credit pool.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: '#111' }}>{agency.name}</h1>
        <button onClick={() => setEditing(true)} title="Rename agency" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}>
          <FiEdit2 size={16} />
        </button>
      </div>
      <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6b7280' }}>
        One agency. Many brands. One credit pool.
      </p>
    </div>
  );
}

// ── Wallet badge + top-up ───────────────────────────────────────────────────

function WalletBadge({ agency, onChange }: { agency: Agency; onChange: (a: Agency) => void }) {
  const [open, setOpen] = useState(false);
  const [amt, setAmt] = useState(500);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <FiCreditCard size={16} color={URI_PINK} />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{agency.wallet_credits.toLocaleString()} credits</span>
      </div>
      <button onClick={() => setOpen(true)} style={ghost}>Top up</button>
      {open && (
        <Modal title="Top up wallet" onClose={() => setOpen(false)}>
          <input type="number" value={amt} onChange={(e) => setAmt(Number(e.target.value))} style={input} />
          <button style={primary} onClick={async () => {
            const res = await AgencyService.topUpWallet(amt);
            if (res.status && res.responseData) { onChange({ ...agency, wallet_credits: res.responseData.wallet_credits }); ToastService.showToast('Wallet topped up', ToastTypeEnum.Success); setOpen(false); }
          }}>Add {amt} credits</button>
        </Modal>
      )}
    </div>
  );
}

// ── Roster ───────────────────────────────────────────────────────────────────

function RosterSection({ activeBrand, onOpenBrand }: { activeBrand: string | null; onOpenBrand: (bid: string) => void }) {
  const [brands, setBrands] = useState<RosterBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await AgencyService.getRoster();
      setBrands(res.status ? res.responseData ?? [] : []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 14, color: '#6b7280' }}>{brands.length} brand{brands.length === 1 ? '' : 's'}</span>
        <button style={primary} onClick={() => setShowAdd(true)}><FiPlus size={15} /> Add Brand</button>
      </div>

      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Loading…</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {brands.map((b) => (
            <div key={b.brand_id} style={{ background: '#fff', border: `1px solid ${activeBrand === b.brand_id ? URI_PINK : '#e5e7eb'}`, borderRadius: 12, padding: 18, boxShadow: activeBrand === b.brand_id ? `0 0 0 3px ${URI_PINK}20` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `${URI_PINK}15`, color: URI_PINK, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                  {b.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{b.industry || 'general'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 12, marginBottom: 14 }}>
                <Stat label="pending" value={b.pending_approvals} highlight={b.pending_approvals > 0} />
                <Stat label="today" value={b.scheduled_today} />
                <Stat label="credits/mo" value={b.credits_consumed_this_month} />
              </div>
              <button style={{ ...primary, width: '100%', justifyContent: 'center' }} onClick={() => onOpenBrand(b.brand_id)}>
                {activeBrand === b.brand_id ? '✓ Active' : 'Open'}
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddBrandModal brands={brands} onClose={() => setShowAdd(false)} onAdded={() => { setShowAdd(false); load(); }} />}
    </div>
  );
}

function AddBrandModal({ brands, onClose, onAdded }: { brands: RosterBrand[]; onClose: () => void; onAdded: () => void }) {
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const res = templateId
        ? await AgencyService.duplicateBrand({ template_brand_id: templateId, name: name.trim(), industry: industry || undefined })
        : await AgencyService.addBrand({ name: name.trim(), industry: industry || undefined });
      if (res.status) { ToastService.showToast('Brand added', ToastTypeEnum.Success); onAdded(); }
      else ToastService.showToast(res.responseMessage || 'Failed', ToastTypeEnum.Error);
    } catch { ToastService.showToast('Failed to add brand', ToastTypeEnum.Error); }
    finally { setBusy(false); }
  };

  return (
    <Modal title="Add a brand" onClose={onClose}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Brand name" style={input} />
      <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Industry (optional)" style={input} />
      <label style={{ fontSize: 13, color: '#6b7280', display: 'block', marginBottom: 6 }}>
        <FiCopy size={12} style={{ verticalAlign: 'middle' }} /> Duplicate playbook from (optional)
      </label>
      <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} style={input}>
        <option value="">— Start fresh —</option>
        {brands.map((b) => <option key={b.brand_id} value={b.brand_id}>{b.name}</option>)}
      </select>
      <button style={primary} disabled={busy || !name.trim()} onClick={submit}>
        {busy ? 'Adding…' : templateId ? 'Duplicate & Add' : 'Add Brand'}
      </button>
    </Modal>
  );
}

// ── Members ───────────────────────────────────────────────────────────────────

function MembersSection() {
  const [members, setMembers] = useState<AgencyMember[]>([]);
  const [brands, setBrands] = useState<BrandAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [m, b] = await Promise.all([AgencyService.listMembers(), AgencyService.listBrands()]);
      setMembers(m.status ? m.responseData ?? [] : []);
      setBrands(b.status ? b.responseData ?? [] : []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const toggleBrand = async (m: AgencyMember, brandId: string, assigned: boolean) => {
    if (assigned) await AgencyService.unassignBrand(m.agency_member_id, brandId);
    else await AgencyService.assignBrand(m.agency_member_id, brandId);
    load();
  };

  return (
    <div>
      {/* Invite Member is hidden for now — a user invited into a second agency while
          already belonging to one silently breaks (V1 supports one agency per user). */}
      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Loading…</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {members.map((m) => (
            <div key={m.agency_member_id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div>
                  <span style={{ fontWeight: 700, color: '#111' }}>
                    {m.email || (m.user_id ? `${m.user_id.slice(0, 14)}…` : 'Pending invite')}
                  </span>
                  {m.status === 'invited' && (
                    <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: '#ca8a04', background: '#fef9c3', padding: '2px 8px', borderRadius: 10 }}>pending</span>
                  )}
                  <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 700, color: m.role === 'admin' ? URI_PINK : '#6b7280', textTransform: 'uppercase' }}>{m.role}</span>
                </div>
                {m.role !== 'admin' && (
                  <button style={ghost} onClick={async () => { await AgencyService.removeMember(m.agency_member_id); load(); }}>Remove</button>
                )}
              </div>
              {m.role === 'admin' ? (
                <div style={{ fontSize: 12, color: '#9ca3af' }}>Admins can access all brands.</div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {brands.map((b) => {
                    const assigned = (m.assigned_brand_ids || []).includes(b.brand_id);
                    return (
                      <button key={b.brand_id} onClick={() => toggleBrand(m, b.brand_id, assigned)}
                        style={{ padding: '4px 10px', borderRadius: 16, fontSize: 12, cursor: 'pointer', border: `1px solid ${assigned ? URI_PINK : '#e5e7eb'}`, background: assigned ? `${URI_PINK}10` : '#fff', color: assigned ? URI_PINK : '#6b7280', fontWeight: assigned ? 600 : 400 }}>
                        {assigned ? '✓ ' : ''}{b.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InviteModal({ onClose, onInvited }: { onClose: () => void; onInvited: () => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'agent'>('agent');
  return (
    <Modal title="Invite member" onClose={onClose}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="member@email.com" style={input} />
      <select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'agent')} style={input}>
        <option value="agent">Agent — content ops on assigned brands</option>
        <option value="admin">Admin — full access</option>
      </select>
      <button style={primary} onClick={async () => {
        const res = await AgencyService.inviteMember(email.trim(), role);
        if (res.status) { ToastService.showToast('Member invited', ToastTypeEnum.Success); onInvited(); }
        else ToastService.showToast(res.responseMessage || 'No user with that email', ToastTypeEnum.Error);
      }}>Send invite</button>
    </Modal>
  );
}

// ── Reports ───────────────────────────────────────────────────────────────────

function ReportsSection() {
  const [report, setReport] = useState<PortfolioReport | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { try { const r = await AgencyService.getPortfolioReport(); setReport(r.status ? r.responseData ?? null : null); } finally { setLoading(false); } })(); }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Loading…</div>;
  if (!report) return <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>No report data.</div>;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <KPI label="Wallet credits" value={report.wallet_credits.toLocaleString()} />
        <KPI label="Consumed this month" value={report.total_credits_consumed_this_month.toLocaleString()} />
        <KPI label="Posts published" value={report.total_posts_published} />
        <KPI label="Brands" value={report.brand_count} />
      </div>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        {report.per_brand.map((b, i) => (
          <div key={b.brand_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: i ? '1px solid #f3f4f6' : 'none' }}>
            <div>
              <span style={{ fontWeight: 600, color: '#111' }}>{b.name}</span>
              {b.needs_attention && <span style={{ marginLeft: 8, fontSize: 11, color: '#ca8a04', background: '#fef9c3', padding: '2px 8px', borderRadius: 10 }}>needs attention</span>}
            </div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>
              {b.credits_consumed_this_month} credits · {b.posts_published} posts · {b.pending_approvals} pending
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Shared bits ───────────────────────────────────────────────────────────────

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: `2px solid ${active ? URI_PINK : '#e5e7eb'}`, background: active ? `${URI_PINK}10` : '#fff', color: active ? URI_PINK : '#6b7280', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
      {icon}{label}
    </button>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <span style={{ padding: '3px 8px', borderRadius: 6, background: highlight ? `${URI_PINK}10` : '#f3f4f6', color: highlight ? URI_PINK : '#6b7280', fontWeight: 600 }}>
      {value} {label}
    </span>
  );
}

function KPI({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#111' }}>{value}</div>
      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 24, width: 'min(440px, 92vw)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111' }}>{title}</h3>
          <FiX size={20} style={{ cursor: 'pointer', color: '#9ca3af' }} onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  );
}

const input: React.CSSProperties = { width: '100%', padding: '11px 14px', borderRadius: 10, border: '2px solid #e5e7eb', fontSize: 14, outline: 'none', marginBottom: 12, boxSizing: 'border-box' };
const primary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 8, border: 'none', background: `linear-gradient(135deg, ${URI_PINK}, #E94396)`, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' };
const ghost: React.CSSProperties = { padding: '7px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer' };
