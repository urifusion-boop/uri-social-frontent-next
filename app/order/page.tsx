'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface PublicOrder {
  order_number: string;
  status: string;
  payment_status: string;
  fulfilment_status: string;
  currency: string;
  total: number;
  paid_amount: number;
  due_amount: number;
  fees_total: number;
  customer_name: string;
  lines: { name: string; variant: string; quantity: number; line_total: number; fulfilment_status: string }[];
}

const LABEL: Record<string, string> = {
  draft: 'Being prepared',
  awaiting_customer: 'Waiting for your confirmation',
  confirmed: 'Confirmed',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  expired: 'Expired',
  unpaid: 'Awaiting payment',
  pending: 'Payment pending',
  partially_paid: 'Partly paid',
  paid: 'Paid',
  queued: 'Queued',
  processing: 'Being prepared',
  fulfilled: 'Delivered / done',
  not_started: 'Not started',
};

const money = (minor: number, currency: string) =>
  `${currency === 'NGN' ? '₦' : `${currency} `}${(minor / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

function Tracker() {
  const token = useSearchParams()?.get('t') ?? '';
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return setError('This link is not valid.');
    const base = process.env.NEXT_PUBLIC_URI_API_BASE_URL ?? '';
    fetch(`${base}/orders/public/${encodeURIComponent(token)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('missing'))))
      .then(setOrder)
      .catch(() => setError('We could not find this order.'));
  }, [token]);

  return (
    <main
      style={{ maxWidth: 520, margin: '40px auto', padding: 16, fontFamily: 'system-ui, sans-serif', color: '#2A2230' }}
    >
      {error && <p>{error}</p>}
      {!error && !order && <p>Loading…</p>}
      {order && (
        <>
          <h1 style={{ fontSize: 22, margin: 0 }}>Order {order.order_number}</h1>
          <p style={{ color: '#6D6572' }}>
            {LABEL[order.status] ?? order.status} · {LABEL[order.payment_status] ?? order.payment_status} ·{' '}
            {LABEL[order.fulfilment_status] ?? order.fulfilment_status}
          </p>
          {order.lines.map((l, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid #F1EBEE',
              }}
            >
              <span>
                {l.quantity} × {l.name}
                {l.variant ? ` (${l.variant})` : ''}
              </span>
              <span>{money(l.line_total, order.currency)}</span>
            </div>
          ))}
          {order.fees_total > 0 && <p>Delivery and fees: {money(order.fees_total, order.currency)}</p>}
          <p>
            <b>Total {money(order.total, order.currency)}</b> · Paid {money(order.paid_amount, order.currency)} · Due{' '}
            {money(order.due_amount, order.currency)}
          </p>
        </>
      )}
    </main>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={null}>
      <Tracker />
    </Suspense>
  );
}
