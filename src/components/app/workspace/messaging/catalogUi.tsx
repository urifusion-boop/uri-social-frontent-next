'use client';

import type { CSSProperties, ReactNode } from 'react';
import type { AvailabilityType, ItemType, ReservationStatus } from '@/src/api/CatalogService';
import { MSG_FONT, MSG_MUTED } from './MessagingHeader';
import { Label } from './ui';

export const TYPE_LABEL: Record<ItemType, string> = {
  physical: 'Physical product',
  digital: 'Digital product / plan',
  capacity: 'Tour, event or seats',
  service: 'Service / appointment',
  made_to_order: 'Made to order',
};

export const AVAILABILITY_LABEL: Record<AvailabilityType, string> = {
  quantity: 'Track a quantity',
  unlimited: 'Unlimited',
  capped: 'Capped sales',
  capacity: 'Capacity per date or session',
  schedule: 'Time slots (appointments)',
  manual: 'I confirm each request',
  made_to_order: 'Made to order (production limit)',
};

export const ALLOWED: Record<ItemType, AvailabilityType[]> = {
  physical: ['quantity', 'unlimited', 'manual'],
  digital: ['unlimited', 'capped', 'manual'],
  capacity: ['capacity', 'manual'],
  service: ['schedule', 'capacity', 'manual'],
  made_to_order: ['made_to_order', 'manual'],
};

export const DEFAULT_AVAILABILITY: Record<ItemType, AvailabilityType> = {
  physical: 'quantity',
  digital: 'unlimited',
  capacity: 'capacity',
  service: 'schedule',
  made_to_order: 'made_to_order',
};

export const TONE = {
  pink: { bg: '#FDEEF4', fg: '#D0145C' },
  amber: { bg: '#FFF4E5', fg: '#B26A00' },
  blue: { bg: '#EAF2FF', fg: '#2563EB' },
  green: { bg: '#E7F7EE', fg: '#15803D' },
  red: { bg: '#FDECEA', fg: '#C62828' },
  grey: { bg: '#F3F2EF', fg: '#5C5460' },
};

export const RESERVATION_TONE: Record<ReservationStatus, { label: string; tone: keyof typeof TONE }> = {
  pending: { label: 'Held, awaiting payment', tone: 'amber' },
  awaiting_confirmation: { label: 'Needs your approval', tone: 'pink' },
  confirmed: { label: 'Paid', tone: 'green' },
  fulfilled: { label: 'Fulfilled', tone: 'blue' },
  released: { label: 'Released', tone: 'grey' },
  expired: { label: 'Expired', tone: 'grey' },
  cancelled: { label: 'Cancelled', tone: 'grey' },
  declined: { label: 'Declined', tone: 'red' },
};

const SYMBOL: Record<string, string> = { NGN: '₦', USD: '$', GBP: '£', EUR: '€', GHS: 'GH₵', KES: 'KSh ' };

export function money(amount: number | null | undefined, currency: string): string {
  if (amount === null || amount === undefined) return 'Quote';
  const symbol = SYMBOL[currency] ?? `${currency} `;
  return `${symbol}${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function when(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function until(iso: string | null | undefined): string {
  if (!iso) return 'No expiry';
  const minutes = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
  if (minutes <= 0) return 'Expiring now';
  if (minutes < 60) return `${minutes} min left`;
  if (minutes < 60 * 48) return `${Math.round(minutes / 60)} h left`;
  return `${Math.round(minutes / 1440)} days left`;
}

export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** A value from a datetime-local input (the browser's own timezone) as a UTC ISO string. */
export function fromLocalInput(value: string): string | undefined {
  return value ? new Date(value).toISOString() : undefined;
}

export const inputStyle: CSSProperties = {
  width: '100%',
  height: 34,
  border: '1px solid #ECE6EA',
  borderRadius: 9,
  padding: '0 10px',
  fontSize: 12.5,
  fontFamily: MSG_FONT,
  color: '#2A2230',
  background: '#fff',
  boxSizing: 'border-box',
  outline: 'none',
};

export function Select<T extends string>({
  value,
  onChange,
  options,
  style,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  style?: CSSProperties;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as T)} style={{ ...inputStyle, ...style }}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function NumberInput({
  value,
  onChange,
  placeholder,
  min = 0,
  step = 1,
  style,
}: {
  value: string | number | null | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  min?: number;
  step?: number;
  style?: CSSProperties;
}) {
  return (
    <input
      type="number"
      min={min}
      step={step}
      value={value ?? ''}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...inputStyle, ...style }}
    />
  );
}

export function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
      <Label>{label}</Label>
      {children}
      {hint && <div style={{ fontSize: 11, color: MSG_MUTED, lineHeight: 1.45 }}>{hint}</div>}
    </div>
  );
}

export function Grid({ cols = 2, children }: { cols?: number; children: ReactNode }) {
  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 12, alignItems: 'end' }}
    >
      {children}
    </div>
  );
}

/** A button that sits in a Grid cell level with the inputs beside it. */
export function Action({ children }: { children: ReactNode }) {
  return <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', minWidth: 0 }}>{children}</div>;
}

export function Modal({
  title,
  onClose,
  children,
  width = 640,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(27,21,32,.45)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '4vh 12px',
        overflowY: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: width,
          background: '#fff',
          borderRadius: 14,
          padding: '18px 20px 20px',
          fontFamily: MSG_FONT,
          boxShadow: '0 20px 60px rgba(40,10,30,.25)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              border: 'none',
              background: 'none',
              fontSize: 22,
              cursor: 'pointer',
              color: MSG_MUTED,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, fontFamily: MSG_FONT }}>
        <thead>
          <tr>
            {head.map((h) => (
              <th
                key={h}
                style={{
                  textAlign: 'left',
                  fontWeight: 600,
                  fontSize: 11,
                  color: MSG_MUTED,
                  padding: '6px 10px',
                  borderBottom: '1px solid #F1EBEE',
                  whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export const cell: CSSProperties = { padding: '9px 10px', borderBottom: '1px solid #F7F2F5', verticalAlign: 'middle' };
