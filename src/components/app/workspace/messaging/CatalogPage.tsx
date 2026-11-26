'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CatalogService, type CatalogAlert, type CatalogItem, type ImportResult } from '@/src/api/CatalogService';
import { CatalogDetail } from './CatalogDetail';
import { CatalogEditor } from './CatalogEditor';
import { HistoryTab, ReportsTab, ReservationsTab } from './CatalogTabs';
import { Btn, Field, Muted, Pane, Pill, Title, apiError } from './ui';
import { AVAILABILITY_LABEL, Modal, Select, TONE, TYPE_LABEL, Table, cell, money } from './catalogUi';

type Tab = 'items' | 'reservations' | 'history' | 'reports';
const TABS: { id: Tab; label: string }[] = [
  { id: 'items', label: 'Items' },
  { id: 'reservations', label: 'Reservations' },
  { id: 'history', label: 'Stock history' },
  { id: 'reports', label: 'Reports' },
];

function stockCell(i: CatalogItem): string {
  switch (i.availability_type) {
    case 'quantity':
      return `${i.available_quantity ?? 0} available`;
    case 'unlimited':
      return 'Unlimited';
    case 'manual':
      return 'You confirm';
    default:
      return AVAILABILITY_LABEL[i.availability_type];
  }
}

function ImportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [csv, setCsv] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const run = async (dry: boolean) => {
    setBusy(true);
    setError('');
    try {
      const r = await CatalogService.importCsv(csv, dry);
      setResult(r);
      if (!dry && r.errors.length === 0) onDone();
    } catch (e) {
      setError(apiError(e, 'Could not read that file.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Import from CSV" onClose={onClose}>
      <Muted>
        Columns: name, item_type, category, sku, price, currency, availability_type, quantity, variant. Rows with the
        same name become options of one item. Existing SKUs are updated. Preview first, nothing is saved until you
        import.
      </Muted>
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        style={{ margin: '10px 0' }}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) {
            setCsv(await f.text());
            setResult(null);
          }
        }}
      />
      <Field
        multiline
        mono
        value={csv}
        onChange={(v) => {
          setCsv(v);
          setResult(null);
        }}
        placeholder="Or paste CSV here"
        style={{ minHeight: 140 }}
      />
      {error && <div style={{ color: '#C62828', fontSize: 12.5, marginTop: 8 }}>{error}</div>}
      {result && (
        <div style={{ marginTop: 10, fontSize: 12.5 }}>
          <b>
            {result.dry_run ? 'Preview: ' : 'Done: '}
            {result.created} new, {result.updated} updated, {result.errors.length} with problems
          </b>
          {result.errors.map((e) => (
            <div key={`${e.row}-${e.name}`} style={{ color: '#C62828' }}>
              Row {e.row} {e.name && `(${e.name})`}: {e.error}
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
        <Btn kind="outline" disabled={!csv.trim() || busy} onClick={() => run(true)}>
          Preview
        </Btn>
        <Btn
          disabled={!csv.trim() || busy || !result || result.errors.length > 0 || !result.dry_run}
          onClick={() => run(false)}
        >
          Import
        </Btn>
      </div>
    </Modal>
  );
}

function Items({ isMobile }: { isMobile: boolean }) {
  const [items, setItems] = useState<CatalogItem[] | null>(null);
  const [alerts, setAlerts] = useState<CatalogAlert[]>([]);
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('active');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<CatalogItem | null | undefined>(undefined);
  const [openId, setOpenId] = useState('');
  const [importing, setImporting] = useState(false);

  const load = useCallback(() => {
    CatalogService.listItems({
      q: q || undefined,
      item_type: type || undefined,
      status: status || undefined,
      limit: 200,
    })
      .then((r) => setItems(r.items))
      .catch((e) => setError(apiError(e, 'Could not load your items.')));
    CatalogService.alerts()
      .then(setAlerts)
      .catch(() => setAlerts([]));
  }, [q, type, status]);

  useEffect(() => {
    const t = setTimeout(load, q ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const download = async () => {
    const blob = await CatalogService.exportCsv();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'catalog.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
          alignItems: 'flex-start',
        }}
      >
        <Title sub="What you sell. Your AI assistant answers price and availability from here, live.">
          Products &amp; Services
        </Title>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn kind="outline" onClick={() => setImporting(true)}>
            Import CSV
          </Btn>
          <Btn kind="outline" onClick={() => download().catch((e) => setError(apiError(e, 'Export failed.')))}>
            Export CSV
          </Btn>
          <Btn onClick={() => setEditing(null)}>Add item</Btn>
        </div>
      </div>

      {alerts.length > 0 && (
        <div
          style={{ background: '#FFF4E5', borderRadius: 10, padding: '10px 12px', fontSize: 12.5, color: '#7A4A00' }}
        >
          {alerts.slice(0, 4).map((a) => (
            <div key={a.key}>
              <b>{a.title}.</b> {a.message}
            </div>
          ))}
          {alerts.length > 4 && <div>And {alerts.length - 4} more.</div>}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr', gap: 8 }}>
        <Field value={q} onChange={setQ} placeholder="Search by name, SKU or category" />
        <Select
          value={type}
          onChange={setType}
          options={[
            { value: '', label: 'All types' },
            ...(Object.keys(TYPE_LABEL) as (keyof typeof TYPE_LABEL)[]).map((t) => ({
              value: t as string,
              label: TYPE_LABEL[t],
            })),
          ]}
        />
        <Select
          value={status}
          onChange={setStatus}
          options={[
            { value: 'active', label: 'For sale' },
            { value: 'inactive', label: 'Hidden' },
            { value: 'archived', label: 'Archived' },
            { value: '', label: 'Everything' },
          ]}
        />
      </div>

      {error && <div style={{ color: '#C62828', fontSize: 12.5 }}>{error}</div>}
      {!items ? (
        <Muted>Loading…</Muted>
      ) : items.length === 0 ? (
        <div style={{ padding: '30px 0', textAlign: 'center' }}>
          <Muted>No items yet. Add what you sell so your assistant can answer price and stock questions.</Muted>
          <Btn style={{ marginTop: 12 }} onClick={() => setEditing(null)}>
            Add your first item
          </Btn>
        </div>
      ) : (
        <Table head={['Item', 'Type', 'Price', 'Availability', '']}>
          {items.map((i) => (
            <tr key={i.id} style={{ cursor: 'pointer' }} onClick={() => setOpenId(i.id)}>
              <td style={cell}>
                <b>{i.name}</b>
                <Muted>
                  {[i.category, i.sku, i.variant_count ? `${i.variant_count} options` : ''].filter(Boolean).join(' · ')}
                </Muted>
              </td>
              <td style={cell}>{TYPE_LABEL[i.item_type]}</td>
              <td style={cell}>{money(i.price, i.currency)}</td>
              <td style={cell}>
                {stockCell(i)} {i.low_stock && <Pill {...TONE.amber}>Low</Pill>}
                {i.status !== 'active' && <Pill {...TONE.grey}>{i.status === 'archived' ? 'Archived' : 'Hidden'}</Pill>}
              </td>
              <td style={{ ...cell, textAlign: 'right' }}>
                <Btn
                  kind="outline"
                  style={{ height: 28 }}
                  onClick={() => {
                    setOpenId('');
                    CatalogService.getItem(i.id)
                      .then(setEditing)
                      .catch(() => setError('Could not open that item.'));
                  }}
                >
                  Edit
                </Btn>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {openId && (
        <CatalogDetail
          itemId={openId}
          onClose={() => setOpenId('')}
          onChanged={load}
          onEdit={(item) => {
            setOpenId('');
            setEditing(item);
          }}
        />
      )}
      {editing !== undefined && (
        <CatalogEditor
          item={editing}
          canSeeCost
          onClose={() => setEditing(undefined)}
          onSaved={(saved) => {
            setEditing(undefined);
            load();
            setOpenId(saved.id);
          }}
        />
      )}
      {importing && <ImportModal onClose={() => setImporting(false)} onDone={load} />}
    </div>
  );
}

export default function CatalogPage({ isMobile }: { isMobile: boolean }) {
  const [tab, setTab] = useState<Tab>('items');
  return (
    <div style={{ padding: isMobile ? 14 : '0 28px 28px' }}>
      <Pane style={{ display: 'block', padding: '18px 20px' }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid #F1EBEE' }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              style={{
                border: 'none',
                background: 'none',
                padding: '8px 12px',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                color: tab === t.id ? '#E0156B' : '#3A3240',
                borderBottom: `2px solid ${tab === t.id ? '#E0156B' : 'transparent'}`,
                marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab === 'items' && <Items isMobile={isMobile} />}
        {tab === 'reservations' && <ReservationsTab />}
        {tab === 'history' && <HistoryTab />}
        {tab === 'reports' && <ReportsTab />}
      </Pane>
    </div>
  );
}
