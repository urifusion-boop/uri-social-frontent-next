'use client';

import { useCallback, useEffect, useState } from 'react';
import { CatalogService, type CatalogItem } from '@/src/api/CatalogService';
import {
  OrdersService,
  type LineFulfilment,
  type Order,
  type OrderEvent,
  type OrderNotification,
  type OrderReturn,
  type OrderStatus,
  type PaymentStatus,
} from '@/src/api/OrdersService';
import { Btn, Field, Muted, Pane, Pill, Title, apiError } from './ui';
import { Modal, NumberInput, Select, TONE, Table, cell, money, when } from './catalogUi';

type Tone = keyof typeof TONE;

const ORDER_TONE: Record<OrderStatus, { label: string; tone: Tone }> = {
  draft: { label: 'Draft', tone: 'grey' },
  awaiting_customer: { label: 'Awaiting customer', tone: 'amber' },
  confirmed: { label: 'Confirmed', tone: 'blue' },
  in_progress: { label: 'In progress', tone: 'blue' },
  completed: { label: 'Completed', tone: 'green' },
  cancelled: { label: 'Cancelled', tone: 'red' },
  expired: { label: 'Expired', tone: 'grey' },
};

const PAYMENT_TONE: Record<PaymentStatus, { label: string; tone: Tone }> = {
  unpaid: { label: 'Unpaid', tone: 'amber' },
  pending: { label: 'Payment pending', tone: 'amber' },
  partially_paid: { label: 'Part paid', tone: 'blue' },
  paid: { label: 'Paid', tone: 'green' },
  failed: { label: 'Payment failed', tone: 'red' },
  refunded: { label: 'Refunded', tone: 'grey' },
  partially_refunded: { label: 'Part refunded', tone: 'grey' },
};

const FULFILMENT_LABEL: Record<string, string> = {
  not_started: 'Not started',
  queued: 'Queued',
  processing: 'Processing',
  partially_fulfilled: 'Part fulfilled',
  fulfilled: 'Fulfilled',
  delivery_failed: 'Delivery failed',
};

const FILTERS = [
  { id: '', label: 'All' },
  { id: 'draft,awaiting_customer', label: 'Not confirmed' },
  { id: 'confirmed,in_progress', label: 'Open' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled,expired', label: 'Cancelled' },
];

const major = (minor: number, currency: string) => money(minor / 100, currency);
const toMinor = (value: string) => Math.round(Number(value) * 100);

function Tag({ tone }: { tone: { label: string; tone: Tone } }) {
  const t = TONE[tone.tone];
  return (
    <Pill fg={t.fg} bg={t.bg}>
      {tone.label}
    </Pill>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '4px 0', fontSize: 12.5 }}>
      <span style={{ color: '#6D6572' }}>{label}</span>
      <span style={{ textAlign: 'right' }}>{children}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid #F1EBEE', borderRadius: 12, padding: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 12.5, marginBottom: 6 }}>{title}</div>
      {children}
    </div>
  );
}

// ── new order ────────────────────────────────────────────────────────────────

interface Draft {
  itemId: string;
  variantId: string;
  quantity: string;
}

function NewOrderModal({ onClose, onCreated }: { onClose: () => void; onCreated: (o: Order) => void }) {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [details, setDetails] = useState<Record<string, CatalogItem>>({});
  const [lines, setLines] = useState<Draft[]>([{ itemId: '', variantId: '', quantity: '1' }]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [fee, setFee] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    CatalogService.listItems({ status: 'active', limit: 200 })
      .then((r) => setCatalog(r.items))
      .catch((e) => setError(apiError(e, 'Could not load your items.')));
  }, []);

  const pick = async (index: number, itemId: string) => {
    setLines((ls) => ls.map((l, i) => (i === index ? { ...l, itemId, variantId: '' } : l)));
    if (itemId && !details[itemId]) {
      const full = await CatalogService.getItem(itemId);
      setDetails((d) => ({ ...d, [itemId]: full }));
    }
  };

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const items = lines
        .filter((l) => l.itemId)
        .map((l) => ({
          catalog_item_id: l.itemId,
          variant_id: l.variantId || undefined,
          quantity: Math.max(1, parseInt(l.quantity, 10) || 1),
        }));
      if (!items.length) throw new Error('Add at least one item.');
      onCreated(
        await OrdersService.create({
          source: 'dashboard',
          customer: { name, phone },
          items,
          delivery: address || fee ? { method: 'delivery', address, fee: fee ? Number(fee) : undefined } : undefined,
        })
      );
    } catch (e) {
      setError(apiError(e, 'Could not create the order.'));
      setBusy(false);
    }
  };

  return (
    <Modal title="New order" onClose={onClose} width={620}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Muted>Prices and totals come from your catalog, so you only choose what and how many.</Muted>
        {lines.map((l, i) => {
          const variants = details[l.itemId]?.variants?.filter((v) => v.status === 'active') ?? [];
          return (
            <div
              key={i}
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 30px', gap: 6, alignItems: 'end' }}
            >
              <Select
                value={l.itemId}
                onChange={(v) => pick(i, v)}
                options={[
                  { value: '', label: 'Choose an item…' },
                  ...catalog.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
              {variants.length ? (
                <Select
                  value={l.variantId}
                  onChange={(v) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, variantId: v } : x)))}
                  options={[
                    { value: '', label: 'Choose an option…' },
                    ...variants.map((v) => ({ value: v.id, label: v.name })),
                  ]}
                />
              ) : (
                <span />
              )}
              <NumberInput
                value={l.quantity}
                min={1}
                onChange={(v) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, quantity: v } : x)))}
              />
              <Btn
                kind="ghost"
                onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}
                disabled={lines.length === 1}
              >
                ×
              </Btn>
            </div>
          );
        })}
        <div>
          <Btn kind="outline" onClick={() => setLines((ls) => [...ls, { itemId: '', variantId: '', quantity: '1' }])}>
            Add another item
          </Btn>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Field value={name} onChange={setName} placeholder="Customer name" />
          <Field value={phone} onChange={setPhone} placeholder="Phone" />
          <Field value={address} onChange={setAddress} placeholder="Delivery address (optional)" />
          <NumberInput value={fee} onChange={setFee} placeholder="Delivery fee (optional)" />
        </div>
        {error && <div style={{ color: '#C62828', fontSize: 12.5 }}>{error}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Btn kind="outline" onClick={onClose}>
            Cancel
          </Btn>
          <Btn onClick={save} disabled={busy}>
            Create draft
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// ── order detail ─────────────────────────────────────────────────────────────

type Panel = '' | 'payment' | 'discount' | 'cancel' | 'refund' | 'quote' | 'return';

function OrderDetail({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [returns, setReturns] = useState<OrderReturn[]>([]);
  const [notes, setNotes] = useState<OrderNotification[]>([]);
  const [assignee, setAssignee] = useState('');
  const [panel, setPanel] = useState<Panel>('');
  const [amount, setAmount] = useState('');
  const [text, setText] = useState('');
  const [lineId, setLineId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    OrdersService.get(id)
      .then(setOrder)
      .catch((e) => setError(apiError(e, 'Could not load this order.')));
    OrdersService.events(id)
      .then(setEvents)
      .catch(() => undefined);
    OrdersService.returnsOf(id)
      .then(setReturns)
      .catch(() => undefined);
    OrdersService.notificationsOf(id)
      .then(setNotes)
      .catch(() => undefined);
  }, [id]);
  useEffect(load, [load]);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      setPanel('');
      setAmount('');
      setText('');
      load();
      onChanged();
    } catch (e) {
      setError(apiError(e, 'That did not work.'));
    } finally {
      setBusy(false);
    }
  };

  if (!order)
    return (
      <Modal title="Order" onClose={onClose}>
        {error ? <div style={{ color: '#C62828' }}>{error}</div> : <Muted>Loading…</Muted>}
      </Modal>
    );

  const cur = order.currency;
  const editable = order.status === 'draft' || order.status === 'awaiting_customer';
  const open = order.status === 'confirmed' || order.status === 'in_progress';
  const quoteLine = order.lines.find((l) => l.needs_quote);
  const publicLink = typeof window !== 'undefined' ? `${window.location.origin}/order/?t=${order.public_token}` : '';

  return (
    <Modal title={order.order_number} onClose={onClose} width={760}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <Tag tone={ORDER_TONE[order.status]} />
          <Tag tone={PAYMENT_TONE[order.payment_status]} />
          <Pill fg="#5C5460" bg="#F3F2EF">
            {FULFILMENT_LABEL[order.fulfilment_status] ?? order.fulfilment_status}
          </Pill>
          <Muted>
            {order.source === 'onebox' ? 'Started by Jane' : order.source} · {when(order.created_at)}
          </Muted>
        </div>

        {order.exception_flags?.length ? (
          <div style={{ background: '#FFF4E5', color: '#B26A00', borderRadius: 10, padding: 10, fontSize: 12.5 }}>
            Needs your attention: a line is paid but still needs your approval before it can be released.
          </div>
        ) : null}
        {order.refund_due && (
          <div style={{ background: '#FDECEA', color: '#C62828', borderRadius: 10, padding: 10, fontSize: 12.5 }}>
            Cancelled after {major(order.paid_amount, cur)} was paid. Request the refund below; it completes when the
            payment provider confirms it.
          </div>
        )}

        <Section title="Items">
          <Table head={['Item', 'Qty', 'Price', 'Total', 'Fulfilment']}>
            {order.lines.map((l) => (
              <tr key={l.id}>
                <td style={cell}>
                  {l.snapshot.name}
                  {l.snapshot.variant && <Muted>{l.snapshot.variant}</Muted>}
                </td>
                <td style={cell}>{l.quantity}</td>
                <td style={cell}>{l.unit_amount === null ? 'Quote needed' : major(l.unit_amount, cur)}</td>
                <td style={cell}>{major(l.line_total, cur)}</td>
                <td style={cell}>
                  {open && order.payment_status === 'paid' && l.fulfilment_status !== 'fulfilled' ? (
                    <Select
                      value={l.fulfilment_status as LineFulfilment}
                      onChange={(v) => run(() => OrdersService.fulfil(order.id, l.id, v))}
                      options={[
                        { value: 'queued', label: 'Queued' },
                        { value: 'processing', label: 'Processing' },
                        { value: 'fulfilled', label: 'Fulfilled' },
                        { value: 'delivery_failed', label: 'Delivery failed' },
                      ]}
                    />
                  ) : (
                    (FULFILMENT_LABEL[l.fulfilment_status] ?? l.fulfilment_status)
                  )}
                </td>
              </tr>
            ))}
          </Table>
          <div style={{ marginTop: 8 }}>
            <Row label="Subtotal">{major(order.subtotal, cur)}</Row>
            {order.discount_total > 0 && <Row label="Discount">−{major(order.discount_total, cur)}</Row>}
            {order.fees_total > 0 && <Row label="Fees and delivery">{major(order.fees_total, cur)}</Row>}
            <Row label="Total">
              <b>{major(order.total, cur)}</b>
            </Row>
            <Row label="Paid">{major(order.paid_amount, cur)}</Row>
            <Row label="Still due">
              <b>{major(order.due_amount, cur)}</b>
            </Row>
          </div>
        </Section>

        <Section title="Customer">
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
            <Field
              value={assignee || order.assignee}
              onChange={setAssignee}
              placeholder="Assigned to"
              style={{ maxWidth: 200 }}
            />
            <Btn
              kind="outline"
              style={{ height: 30 }}
              onClick={() => run(() => OrdersService.assign(order.id, assignee))}
            >
              Assign
            </Btn>
          </div>
          <Row label="Name">{order.customer.name || '—'}</Row>
          <Row label="Phone">{order.customer.phone || '—'}</Row>
          {order.customer.channel && <Row label="Channel">{order.customer.channel}</Row>}
          {order.delivery.address && <Row label="Delivery">{order.delivery.address}</Row>}
        </Section>

        {!!order.payments?.length && (
          <Section title="Payments">
            {order.payments.map((p) => (
              <Row key={p.id} label={`${p.reference} · ${p.status}`}>
                {major(p.amount, cur)}
                {p.source === 'merchant_recorded' && <Muted>Recorded by you, not verified by the provider</Muted>}
              </Row>
            ))}
          </Section>
        )}

        {!!order.revisions?.length && (
          <Section title="Changes after confirmation">
            {order.revisions.map((r) => (
              <Row key={r.number} label={`#${r.number} ${r.reason}`}>
                {major(r.before.total, cur)} → {major(r.after.total, cur)}
              </Row>
            ))}
          </Section>
        )}

        {panel && (
          <Section
            title={
              {
                payment: 'Record a payment you received',
                discount: 'Add a discount',
                cancel: 'Cancel this order',
                refund: 'Request a refund',
                return: 'Request a return',
                quote: 'Set the quoted price',
                '': '',
              }[panel]
            }
          >
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {panel !== 'cancel' && (
                <NumberInput
                  value={amount}
                  onChange={setAmount}
                  placeholder={panel === 'return' ? 'How many?' : `Amount (${cur})`}
                  step={0.01}
                  style={{ width: 150 }}
                />
              )}
              <Field
                value={text}
                onChange={setText}
                style={{ flex: 1, minWidth: 180 }}
                placeholder={
                  panel === 'payment'
                    ? 'How was it paid? (cash, transfer…)'
                    : panel === 'quote'
                      ? 'Note (optional)'
                      : 'Reason'
                }
              />
              <Btn
                disabled={busy}
                onClick={() =>
                  run(() => {
                    if (panel === 'payment') return OrdersService.recordPayment(order.id, toMinor(amount), text, '');
                    if (panel === 'discount') return OrdersService.adjust(order.id, 'discount', toMinor(amount), text);
                    if (panel === 'refund') return OrdersService.refund(order.id, toMinor(amount), text);
                    if (panel === 'return')
                      return OrdersService.requestReturn(order.id, lineId, Math.max(1, Number(amount) || 1), text);
                    if (panel === 'quote')
                      return OrdersService.quote(order.id, lineId || quoteLine!.id, Number(amount));
                    return OrdersService.cancel(order.id, text);
                  })
                }
              >
                Confirm
              </Btn>
              <Btn kind="outline" onClick={() => setPanel('')}>
                Never mind
              </Btn>
            </div>
          </Section>
        )}
        {error && <div style={{ color: '#C62828', fontSize: 12.5 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {editable && quoteLine && (
            <Btn
              onClick={() => {
                setLineId(quoteLine.id);
                setPanel('quote');
              }}
            >
              Set quoted price
            </Btn>
          )}
          {order.status === 'draft' && !quoteLine && (
            <Btn kind="outline" disabled={busy} onClick={() => run(() => OrdersService.send(order.id))}>
              Mark as sent to customer
            </Btn>
          )}
          {editable && !quoteLine && (
            <Btn disabled={busy} onClick={() => run(() => OrdersService.confirm(order.id))}>
              Customer accepted: confirm
            </Btn>
          )}
          {open && order.due_amount > 0 && (
            <Btn kind="outline" disabled={busy} onClick={() => run(() => OrdersService.requestPayment(order.id))}>
              Create payment reference
            </Btn>
          )}
          {open && order.due_amount > 0 && (
            <Btn kind="outline" onClick={() => setPanel('payment')}>
              Record a payment
            </Btn>
          )}
          {(editable || open) && (
            <Btn kind="outline" onClick={() => setPanel('discount')}>
              Add discount
            </Btn>
          )}
          {order.refund_due && (
            <Btn kind="outline" onClick={() => setPanel('refund')}>
              Request refund
            </Btn>
          )}
          {order.status !== 'cancelled' && order.status !== 'expired' && order.status !== 'completed' && (
            <Btn kind="danger" onClick={() => setPanel('cancel')}>
              Cancel order
            </Btn>
          )}
          {order.lines.some((l) => l.fulfilment_status === 'fulfilled') && (
            <Btn
              kind="outline"
              onClick={() => {
                setLineId(order.lines.find((l) => l.fulfilment_status === 'fulfilled')!.id);
                setPanel('return');
              }}
            >
              Request a return
            </Btn>
          )}
          <Btn
            kind="ghost"
            onClick={() => {
              if (publicLink) navigator.clipboard?.writeText(publicLink);
            }}
          >
            Copy customer link
          </Btn>
        </div>

        {!!order.refunds?.length && (
          <Section title="Refunds">
            {order.refunds.map((r) => (
              <Row
                key={r.id}
                label={`${r.status === 'completed' ? 'Completed' : 'Requested'} · ${r.reason || 'no reason'}`}
              >
                {major(r.amount, cur)}
                {r.status === 'requested' && (
                  <Btn
                    kind="outline"
                    style={{ marginLeft: 8, height: 26 }}
                    onClick={() => run(() => OrdersService.completeRefund(order.id, r.id, 'paid out by business'))}
                  >
                    I paid this out
                  </Btn>
                )}
              </Row>
            ))}
          </Section>
        )}

        {!!returns.length && (
          <Section title="Returns">
            {returns.map((r) => {
              const line = order.lines.find((l) => l.id === r.line_id);
              return (
                <div key={r.id} style={{ padding: '6px 0', borderBottom: '1px solid #F7F2F5' }}>
                  <Row label={`${r.quantity} × ${line?.snapshot.name ?? 'item'} · ${r.status}`}>{r.reason}</Row>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {r.status === 'requested' && (
                      <>
                        <Btn
                          style={{ height: 28 }}
                          onClick={() => run(() => OrdersService.returnAction(r.id, 'approve'))}
                        >
                          Approve
                        </Btn>
                        <Btn
                          kind="danger"
                          style={{ height: 28 }}
                          onClick={() => run(() => OrdersService.returnAction(r.id, 'reject'))}
                        >
                          Reject
                        </Btn>
                      </>
                    )}
                    {r.status === 'approved' && (
                      <Btn
                        style={{ height: 28 }}
                        onClick={() => run(() => OrdersService.returnAction(r.id, 'receive'))}
                      >
                        Mark received
                      </Btn>
                    )}
                    {r.status === 'received' &&
                      (['restock', 'damaged', 'write_off'] as const).map((d) => (
                        <Btn
                          key={d}
                          kind="outline"
                          style={{ height: 28 }}
                          onClick={() => run(() => OrdersService.returnAction(r.id, 'resolve', { disposition: d }))}
                        >
                          {{ restock: 'Resellable: back in stock', damaged: 'Damaged', write_off: 'Write off' }[d]}
                        </Btn>
                      ))}
                    {r.status === 'resolved' && <Muted>Outcome: {r.disposition?.replace('_', ' ')}</Muted>}
                  </div>
                </div>
              );
            })}
          </Section>
        )}

        {!!notes.length && (
          <Section title="Messages to the customer">
            {notes.map((n) => (
              <Row key={n.id} label={n.text}>
                {n.result === 'sent'
                  ? `Sent on ${n.channel}`
                  : n.result === 'no_channel'
                    ? 'No chat on file'
                    : "Couldn't send"}
              </Row>
            ))}
          </Section>
        )}

        <Section title="Timeline">
          {events.map((e) => (
            <Row key={e.id} label={e.type.replace(/_/g, ' ')}>
              {when(e.created_at)}
            </Row>
          ))}
        </Section>
      </div>
    </Modal>
  );
}

// ── list ─────────────────────────────────────────────────────────────────────

export default function OrdersPage({ isMobile }: { isMobile?: boolean }) {
  const [rows, setRows] = useState<Order[] | null>(null);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    OrdersService.list({ status: status || undefined, q: q || undefined, limit: 100 })
      .then((r) => {
        setRows(r.orders);
        setTotal(r.total);
      })
      .catch((e) => setError(apiError(e, 'Could not load orders.')));
  }, [status, q]);
  useEffect(load, [load]);

  const download = async () => {
    const csv = await OrdersService.exportCsv();
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'orders.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Pane style={{ padding: isMobile ? 12 : 20, gap: 14, flexDirection: 'column', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <Title sub="Every order from Jane and from you, with payment and fulfilment tracked separately.">Orders</Title>
        <div style={{ display: 'flex', gap: 6 }}>
          <Btn kind="outline" onClick={download}>
            Export CSV
          </Btn>
          <Btn onClick={() => setCreating(true)}>New order</Btn>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
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
        <Field value={q} onChange={setQ} placeholder="Search number, name, phone or item" style={{ maxWidth: 280 }} />
      </div>
      {error && <div style={{ color: '#C62828', fontSize: 12.5 }}>{error}</div>}
      {!rows ? (
        <Muted>Loading…</Muted>
      ) : rows.length === 0 ? (
        <Muted>No orders yet. When a customer tells Jane they want something, the order appears here.</Muted>
      ) : (
        <>
          <Table head={['Order', 'Customer', 'Total', 'Status', 'Payment', 'Fulfilment', 'Created']}>
            {rows.map((o) => (
              <tr key={o.id} onClick={() => setOpenId(o.id)} style={{ cursor: 'pointer' }}>
                <td style={{ ...cell, whiteSpace: 'nowrap' }}>
                  <b>{o.order_number}</b>
                  {o.source === 'onebox' && <Muted>Jane</Muted>}
                </td>
                <td style={cell}>
                  {o.customer.name || '—'}
                  <Muted>{o.customer.phone}</Muted>
                </td>
                <td style={cell}>{major(o.total, o.currency)}</td>
                <td style={cell}>
                  <Tag tone={ORDER_TONE[o.status]} />
                </td>
                <td style={cell}>
                  <Tag tone={PAYMENT_TONE[o.payment_status]} />
                </td>
                <td style={cell}>{FULFILMENT_LABEL[o.fulfilment_status] ?? o.fulfilment_status}</td>
                <td style={cell}>{when(o.created_at)}</td>
              </tr>
            ))}
          </Table>
          <Muted>{total} orders</Muted>
        </>
      )}
      {creating && (
        <NewOrderModal
          onClose={() => setCreating(false)}
          onCreated={(o) => {
            setCreating(false);
            setOpenId(o.id);
            load();
          }}
        />
      )}
      {openId && <OrderDetail id={openId} onClose={() => setOpenId('')} onChanged={load} />}
    </Pane>
  );
}
