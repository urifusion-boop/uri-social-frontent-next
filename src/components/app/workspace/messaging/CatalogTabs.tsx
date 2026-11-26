'use client';

import { useCallback, useEffect, useState } from 'react';
import { CatalogService, type CatalogReport, type Reservation, type StockMovement } from '@/src/api/CatalogService';
import { Btn, Muted, Pill, Title, apiError } from './ui';
import { RESERVATION_TONE, TONE, Table, cell, until, when } from './catalogUi';

const FILTERS = [
  { id: '', label: 'All' },
  { id: 'awaiting_confirmation', label: 'Needs approval' },
  { id: 'pending', label: 'Held' },
  { id: 'confirmed', label: 'Paid' },
  { id: 'fulfilled', label: 'Fulfilled' },
  { id: 'expired', label: 'Expired' },
];

export function ReservationsTab() {
  const [status, setStatus] = useState('');
  const [rows, setRows] = useState<Reservation[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    CatalogService.listReservations({ status: status || undefined, limit: 100 })
      .then((r) => setRows(r.reservations))
      .catch((e) => setError(apiError(e, 'Could not load reservations.')));
  }, [status]);
  useEffect(load, [load]);

  const act = async (id: string, action: Parameters<typeof CatalogService.reservationAction>[1]) => {
    setError('');
    try {
      await CatalogService.reservationAction(id, action);
      load();
    } catch (e) {
      setError(apiError(e, 'That did not work.'));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Title sub="Stock and places held for customers. Unpaid holds release themselves when the time is up.">
        Reservations
      </Title>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {FILTERS.map((f) => (
          <Btn
            key={f.id}
            kind={status === f.id ? 'primary' : 'outline'}
            style={{ height: 30 }}
            onClick={() => setStatus(f.id)}
          >
            {f.label}
          </Btn>
        ))}
      </div>
      {error && <div style={{ color: '#C62828', fontSize: 12.5 }}>{error}</div>}
      {!rows ? (
        <Muted>Loading…</Muted>
      ) : rows.length === 0 ? (
        <Muted>No reservations here.</Muted>
      ) : (
        <Table head={['Item', 'Qty', 'For', 'Status', 'Time left', '']}>
          {rows.map((r) => {
            const tone = RESERVATION_TONE[r.status];
            return (
              <tr key={r.id}>
                <td style={cell}>
                  {r.item_name}
                  <Muted>{r.order_id}</Muted>
                </td>
                <td style={cell}>{r.quantity}</td>
                <td style={cell}>{r.start_at ? when(r.start_at) : r.customer?.name || '—'}</td>
                <td style={cell}>
                  <Pill {...TONE[tone.tone]}>{tone.label}</Pill>
                </td>
                <td style={cell}>{r.status === 'pending' ? until(r.expires_at) : '—'}</td>
                <td style={{ ...cell, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {r.status === 'awaiting_confirmation' && (
                    <>
                      <Btn style={{ height: 28 }} onClick={() => act(r.id, 'approve')}>
                        Approve
                      </Btn>{' '}
                      <Btn kind="danger" style={{ height: 28 }} onClick={() => act(r.id, 'decline')}>
                        Decline
                      </Btn>
                    </>
                  )}
                  {r.status === 'pending' && (
                    <>
                      <Btn kind="outline" style={{ height: 28 }} onClick={() => act(r.id, 'extend')}>
                        Extend
                      </Btn>{' '}
                      <Btn kind="outline" style={{ height: 28 }} onClick={() => act(r.id, 'confirm')}>
                        Mark paid
                      </Btn>{' '}
                      <Btn kind="danger" style={{ height: 28 }} onClick={() => act(r.id, 'release')}>
                        Release
                      </Btn>
                    </>
                  )}
                  {r.status === 'confirmed' && (
                    <Btn kind="outline" style={{ height: 28 }} onClick={() => act(r.id, 'fulfil')}>
                      Mark fulfilled
                    </Btn>
                  )}
                </td>
              </tr>
            );
          })}
        </Table>
      )}
    </div>
  );
}

export function HistoryTab() {
  const [rows, setRows] = useState<StockMovement[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    CatalogService.movements({ limit: 100 })
      .then((r) => setRows(r.movements))
      .catch((e) => setError(apiError(e, 'Could not load stock history.')));
  }, []);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Title sub="Every change to stock, newest first.">Stock history</Title>
      {error && <div style={{ color: '#C62828', fontSize: 12.5 }}>{error}</div>}
      {!rows ? (
        <Muted>Loading…</Muted>
      ) : rows.length === 0 ? (
        <Muted>No stock changes yet.</Muted>
      ) : (
        <Table head={['When', 'Item', 'Change', 'Held', 'Why', 'Left in stock', 'By']}>
          {rows.map((m) => (
            <tr key={m.id}>
              <td style={cell}>{when(m.created_at)}</td>
              <td style={cell}>{m.item_name}</td>
              <td style={{ ...cell, color: m.quantity_change < 0 ? '#C62828' : '#15803D', fontWeight: 700 }}>
                {m.quantity_change > 0 ? `+${m.quantity_change}` : m.quantity_change}
              </td>
              <td style={cell}>{m.reserved_change || '—'}</td>
              <td style={cell}>{m.movement_type.replace(/_/g, ' ')}</td>
              <td style={cell}>{m.on_hand_after ?? '—'}</td>
              <td style={cell}>{m.created_by || '—'}</td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: '1px solid #EFE8EC', borderRadius: 12, padding: '12px 14px', minWidth: 130, flex: 1 }}>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
      <Muted>{label}</Muted>
    </div>
  );
}

export function ReportsTab() {
  const [days, setDays] = useState(30);
  const [r, setR] = useState<CatalogReport | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    CatalogService.report(days)
      .then(setR)
      .catch((e) => setError(apiError(e, 'Could not load the report.')));
  }, [days]);

  if (!r) return <Muted>{error || 'Loading…'}</Muted>;
  const pct = (n: number | null) => (n === null ? '—' : `${Math.round(n * 100)}%`);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <Title sub={r.note}>Reports</Title>
        <div style={{ display: 'flex', gap: 6 }}>
          {[7, 30, 90].map((d) => (
            <Btn key={d} kind={days === d ? 'primary' : 'outline'} style={{ height: 30 }} onClick={() => setDays(d)}>
              {d} days
            </Btn>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Stat label="Items on sale" value={`${r.items.active}`} />
        <Stat label="Holds that became sales" value={pct(r.reservations.conversion_rate)} />
        <Stat label="Holds that expired" value={`${r.reservations.expired}`} />
        <Stat label="Places filled" value={pct(r.utilisation.rate)} />
      </div>
      <ReportList title="Best sellers" empty="No sales yet." rows={r.sold.map((s) => [s.name, `${s.units} sold`])} />
      <ReportList
        title="Running low"
        empty="Nothing is running low."
        rows={r.low_stock.map((s) => [s.name, `${s.available} left`])}
      />
      <ReportList
        title="Most asked about"
        empty="No enquiries yet."
        rows={r.most_requested.map((s) => [s.name, `${s.requests} asks`])}
      />
      <ReportList
        title="Customers asked, but it wasn't available"
        empty="None."
        rows={r.demand_without_availability.map((s) => [s.name, `${s.enquiries} asks`])}
      />
    </div>
  );
}

function ReportList({ title, rows, empty }: { title: string; rows: string[][]; empty: string }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{title}</div>
      {rows.length === 0 ? (
        <Muted>{empty}</Muted>
      ) : (
        <Table head={['Item', '']}>
          {rows.map(([a, b]) => (
            <tr key={a}>
              <td style={cell}>{a}</td>
              <td style={{ ...cell, textAlign: 'right' }}>{b}</td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
