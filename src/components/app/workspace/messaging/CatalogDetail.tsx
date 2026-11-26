'use client';

import { useCallback, useEffect, useState } from 'react';
import { CatalogService, type AvailabilityResult, type CatalogItem, type CatalogSlot } from '@/src/api/CatalogService';
import { Btn, Field, Label, Muted, Pill, Toggle, apiError } from './ui';
import {
  AVAILABILITY_LABEL,
  Grid,
  Modal,
  NumberInput,
  Row,
  Select,
  TONE,
  TYPE_LABEL,
  Table,
  cell,
  fromLocalInput,
  money,
  when,
} from './catalogUi';

const REASONS = [
  { value: 'restock', label: 'Restock (add units)' },
  { value: 'damage', label: 'Damaged (remove)' },
  { value: 'loss', label: 'Lost (remove)' },
  { value: 'return', label: 'Customer return (add)' },
  { value: 'correction', label: 'Set the exact count' },
];
const ADDS = new Set(['restock', 'return']);

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        borderTop: '1px solid #F1EBEE',
        paddingTop: 14,
        marginTop: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700 }}>{title}</div>
      {children}
    </div>
  );
}

function Notice({ text, bad }: { text: string; bad?: boolean }) {
  return <div style={{ fontSize: 12.5, color: bad ? '#C62828' : '#15803D' }}>{text}</div>;
}

function StockPanel({ item, reload }: { item: CatalogItem; reload: () => void }) {
  const [reason, setReason] = useState('restock');
  const [qty, setQty] = useState('');
  const [target, setTarget] = useState(item.variants?.[0]?.id ?? '');
  const [vName, setVName] = useState('');
  const [vQty, setVQty] = useState('');
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);
  const variants = item.variants ?? [];

  const run = async (fn: () => Promise<unknown>, done: string) => {
    setMsg(null);
    try {
      await fn();
      setMsg({ text: done });
      reload();
    } catch (e) {
      setMsg({ text: apiError(e, 'That did not work.'), bad: true });
    }
  };

  const adjust = () => {
    const n = Number(qty);
    if (!Number.isFinite(n) || qty === '') return setMsg({ text: 'Enter a number.', bad: true });
    const body =
      reason === 'correction' ? { set_to: n } : { quantity_change: ADDS.has(reason) ? Math.abs(n) : -Math.abs(n) };
    return run(
      () =>
        CatalogService.adjustStock({
          item_id: item.id,
          variant_id: target || null,
          movement_type: reason === 'correction' ? 'correction' : reason,
          reason,
          ...body,
        }),
      'Stock updated.'
    ).then(() => setQty(''));
  };

  return (
    <Section title="Stock">
      {variants.length > 0 ? (
        <Table head={['Option', 'SKU', 'Price', 'In stock', 'Held', 'Available']}>
          {variants.map((v) => (
            <tr key={v.id}>
              <td style={cell}>{v.name}</td>
              <td style={cell}>{v.sku || '—'}</td>
              <td style={cell}>{v.price === null ? 'Same' : money(v.price, v.currency)}</td>
              <td style={cell}>{v.stock?.on_hand ?? 0}</td>
              <td style={cell}>{v.stock?.reserved ?? 0}</td>
              <td style={cell}>
                <b>{v.stock?.available ?? 0}</b>
              </td>
            </tr>
          ))}
        </Table>
      ) : (
        <Muted>
          {item.stock
            ? `${item.stock.on_hand} in stock, ${item.stock.reserved} held, ${item.stock.available} available.`
            : 'No stock recorded yet.'}
        </Muted>
      )}
      <Grid cols={4}>
        {variants.length > 0 && (
          <Row label="Option">
            <Select
              value={target}
              onChange={setTarget}
              options={variants.map((v) => ({ value: v.id, label: v.name }))}
            />
          </Row>
        )}
        <Row label="Change">
          <Select value={reason} onChange={setReason} options={REASONS} />
        </Row>
        <Row label={reason === 'correction' ? 'Count is now' : 'Units'}>
          <NumberInput value={qty} onChange={setQty} />
        </Row>
        <Row label=" ">
          <Btn onClick={adjust}>Update stock</Btn>
        </Row>
      </Grid>
      <Grid cols={3}>
        <Row label="Add a size, colour or option">
          <Field value={vName} onChange={setVName} placeholder="e.g. Size 42 / Black" />
        </Row>
        <Row label="Units to start with">
          <NumberInput value={vQty} onChange={setVQty} />
        </Row>
        <Row label=" ">
          <Btn
            kind="outline"
            disabled={!vName.trim()}
            onClick={() =>
              run(
                () =>
                  CatalogService.createVariant(item.id, { name: vName.trim(), initial_quantity: Number(vQty) || 0 }),
                'Option added.'
              ).then(() => {
                setVName('');
                setVQty('');
              })
            }
          >
            Add option
          </Btn>
        </Row>
      </Grid>
      {msg && <Notice {...msg} />}
    </Section>
  );
}

function SessionsPanel({ item }: { item: CatalogItem }) {
  const [slots, setSlots] = useState<CatalogSlot[] | null>(null);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [total, setTotal] = useState('10');
  const [label, setLabel] = useState('');
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);
  const isSchedule = item.availability_type === 'schedule';

  const load = useCallback(() => {
    CatalogService.calendar(item.id)
      .then(setSlots)
      .catch(() => setSlots([]));
  }, [item.id]);
  useEffect(load, [load]);

  const add = async () => {
    setMsg(null);
    const s = fromLocalInput(start);
    const e = fromLocalInput(end);
    if (!s || !e) return setMsg({ text: 'Pick a start and end time.', bad: true });
    try {
      await CatalogService.createSlot(item.id, { start_at: s, end_at: e, total: Number(total) || 1, label });
      setStart('');
      setEnd('');
      setLabel('');
      load();
    } catch (err) {
      setMsg({ text: apiError(err, 'Could not add that.'), bad: true });
    }
  };

  const patch = (id: string, body: { total?: number; status?: 'open' | 'closed' }) =>
    CatalogService.updateSlot(id, body)
      .then(load)
      .catch((err) => setMsg({ text: apiError(err, 'Could not update.'), bad: true }));

  return (
    <Section title={isSchedule ? 'Upcoming time slots' : 'Dates and sessions'}>
      {isSchedule && (
        <Muted>Slots are created from your weekly hours. Close one to block it, or add an extra one below.</Muted>
      )}
      {!slots ? (
        <Muted>Loading…</Muted>
      ) : slots.length === 0 ? (
        <Muted>Nothing scheduled yet.</Muted>
      ) : (
        <Table head={['When', 'Places', 'Booked', 'Left', '']}>
          {slots.slice(0, 40).map((s) => (
            <tr key={s.id}>
              <td style={cell}>
                {s.label || when(s.start_at)}
                {s.label ? <Muted>{when(s.start_at)}</Muted> : null}
              </td>
              <td style={cell}>{s.total}</td>
              <td style={cell}>{s.reserved + s.confirmed}</td>
              <td style={cell}>{s.status === 'closed' ? <Pill {...TONE.grey}>Closed</Pill> : <b>{s.remaining}</b>}</td>
              <td style={{ ...cell, textAlign: 'right' }}>
                <Btn
                  kind="outline"
                  style={{ height: 28 }}
                  onClick={() => patch(s.id, { status: s.status === 'closed' ? 'open' : 'closed' })}
                >
                  {s.status === 'closed' ? 'Reopen' : 'Close'}
                </Btn>
              </td>
            </tr>
          ))}
        </Table>
      )}
      <Grid cols={4}>
        <Row label="Starts">
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            style={{ height: 34, border: '1px solid #ECE6EA', borderRadius: 9, padding: '0 8px', fontSize: 12.5 }}
          />
        </Row>
        <Row label="Ends">
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            style={{ height: 34, border: '1px solid #ECE6EA', borderRadius: 9, padding: '0 8px', fontSize: 12.5 }}
          />
        </Row>
        <Row label="Places">
          <NumberInput value={total} onChange={setTotal} min={1} />
        </Row>
        <Row label="Label (optional)">
          <Field value={label} onChange={setLabel} placeholder="e.g. Lagos departure" />
        </Row>
      </Grid>
      <div>
        <Btn kind="outline" onClick={add}>
          Add {isSchedule ? 'a slot' : 'a date'}
        </Btn>
      </div>
      {msg && <Notice {...msg} />}
    </Section>
  );
}

function ManualPanel({ item, reload }: { item: CatalogItem; reload: () => void }) {
  const [on, setOn] = useState(item.availability_config.available !== false);
  const [note, setNote] = useState(String(item.availability_config.note ?? ''));
  const [saved, setSaved] = useState(false);
  const save = async () => {
    await CatalogService.setManualAvailability(item.id, on, note);
    setSaved(true);
    reload();
  };
  return (
    <Section title="Availability you confirm yourself">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Toggle
          on={on}
          onChange={(v) => {
            setOn(v);
            setSaved(false);
          }}
          label="Available"
        />
        <Label>{on ? 'Available right now' : 'Not available right now'}</Label>
      </div>
      <Muted>
        Last updated {when(item.availability_updated_at)}. If this goes out of date your assistant stops promising it.
      </Muted>
      <Field
        value={note}
        onChange={(v) => {
          setNote(v);
          setSaved(false);
        }}
        placeholder="Note for customers (optional)"
      />
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Btn onClick={save}>Confirm availability</Btn>
        {saved && <Notice text="Saved." />}
      </div>
    </Section>
  );
}

function CheckPanel({ item }: { item: CatalogItem }) {
  const [qty, setQty] = useState('1');
  const [variant, setVariant] = useState('');
  const [slot, setSlot] = useState('');
  const [result, setResult] = useState<AvailabilityResult | null>(null);
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);
  const variants = item.variants ?? [];
  const needsTime = item.availability_type === 'schedule' || item.availability_type === 'capacity';

  const params = () => ({
    item_id: item.id,
    variant_id: variant || undefined,
    quantity: Number(qty) || 1,
    start_at: fromLocalInput(slot),
  });

  const check = async () => {
    setMsg(null);
    try {
      setResult(await CatalogService.checkAvailability(params()));
    } catch (e) {
      setMsg({ text: apiError(e, 'Could not check.'), bad: true });
    }
  };

  const hold = async () => {
    setMsg(null);
    try {
      const r = await CatalogService.reserve({ ...params(), quantity: Number(qty) || 1 });
      setMsg({
        text:
          r.status === 'awaiting_confirmation' ? 'Request sent for your approval.' : 'Held. See it under Reservations.',
      });
      setResult(null);
    } catch (e) {
      setMsg({ text: apiError(e, 'Could not hold that.'), bad: true });
    }
  };

  return (
    <Section title="Check or hold">
      <Grid cols={4}>
        {variants.length > 0 && (
          <Row label="Option">
            <Select
              value={variant}
              onChange={setVariant}
              options={[{ value: '', label: 'Any' }, ...variants.map((v) => ({ value: v.id, label: v.name }))]}
            />
          </Row>
        )}
        <Row label="Quantity">
          <NumberInput value={qty} onChange={setQty} min={1} />
        </Row>
        {needsTime && (
          <Row label="Date and time">
            <input
              type="datetime-local"
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              style={{ height: 34, border: '1px solid #ECE6EA', borderRadius: 9, padding: '0 8px', fontSize: 12.5 }}
            />
          </Row>
        )}
        <Row label=" ">
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn kind="outline" onClick={check}>
              Check
            </Btn>
            <Btn onClick={hold}>Hold</Btn>
          </div>
        </Row>
      </Grid>
      {result && (
        <div
          style={{
            background: result.available ? '#E7F7EE' : '#FDECEA',
            borderRadius: 10,
            padding: '10px 12px',
            fontSize: 12.5,
          }}
        >
          <b>{result.available ? 'Available' : 'Not available'}</b>
          {result.available_quantity !== null && result.available_quantity !== undefined
            ? ` · ${result.available_quantity} left`
            : ''}
          {result.requires_confirmation ? ' · needs your approval' : ''}
          <div style={{ marginTop: 3 }}>{result.message}</div>
        </div>
      )}
      {msg && <Notice {...msg} />}
    </Section>
  );
}

export function CatalogDetail({
  itemId,
  onClose,
  onEdit,
  onChanged,
}: {
  itemId: string;
  onClose: () => void;
  onEdit: (item: CatalogItem) => void;
  onChanged: () => void;
}) {
  const [item, setItem] = useState<CatalogItem | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    CatalogService.getItem(itemId)
      .then(setItem)
      .catch((e) => setError(apiError(e, 'Could not load this item.')));
  }, [itemId]);
  useEffect(load, [load]);

  const reload = () => {
    load();
    onChanged();
  };

  const archive = async () => {
    if (!item || !window.confirm(`Archive ${item.name}? It stops being sold. Past orders are kept.`)) return;
    try {
      await CatalogService.archiveItem(item.id);
      onChanged();
      onClose();
    } catch (e) {
      setError(apiError(e, 'Could not archive this item.'));
    }
  };

  const t = item?.availability_type;
  return (
    <Modal title={item?.name ?? 'Loading…'} onClose={onClose} width={820}>
      {!item ? (
        <Muted>{error || 'Loading…'}</Muted>
      ) : (
        <div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <Pill {...TONE.pink}>{TYPE_LABEL[item.item_type]}</Pill>
            <Pill {...TONE.grey}>{AVAILABILITY_LABEL[item.availability_type]}</Pill>
            {item.status !== 'active' && (
              <Pill {...TONE.amber}>{item.status === 'archived' ? 'Archived' : 'Hidden'}</Pill>
            )}
            <b style={{ fontSize: 14 }}>{money(item.price, item.currency)}</b>
            <div style={{ flex: 1 }} />
            <Btn kind="outline" onClick={() => onEdit(item)}>
              Edit
            </Btn>
            {item.status !== 'archived' && (
              <Btn kind="danger" onClick={archive}>
                Archive
              </Btn>
            )}
          </div>
          {item.description && <Muted style={{ marginTop: 8 }}>{item.description}</Muted>}
          {error && <Notice text={error} bad />}
          {t === 'quantity' && <StockPanel item={item} reload={reload} />}
          {(t === 'capacity' || t === 'schedule') && <SessionsPanel item={item} />}
          {t === 'manual' && <ManualPanel item={item} reload={reload} />}
          {t === 'made_to_order' && (
            <Section title="Production limit">
              <Muted>
                {item.availability_config.max_orders
                  ? `Up to ${String(item.availability_config.max_orders)} orders per ${String(item.availability_config.period ?? 'month')}.`
                  : 'No limit on orders.'}
              </Muted>
            </Section>
          )}
          <CheckPanel item={item} />
        </div>
      )}
    </Modal>
  );
}
