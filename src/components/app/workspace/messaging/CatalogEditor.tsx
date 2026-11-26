'use client';

import { useRef, useState } from 'react';
import {
  CatalogService,
  type AvailabilityType,
  type CatalogItem,
  type CatalogItemInput,
  type ItemType,
} from '@/src/api/CatalogService';
import { MSG_MUTED } from './MessagingHeader';
import { Btn, Field, Label, Muted, Toggle, apiError } from './ui';
import {
  ALLOWED,
  AVAILABILITY_LABEL,
  DEFAULT_AVAILABILITY,
  Grid,
  Modal,
  NumberInput,
  Row,
  Select,
  TYPE_LABEL,
} from './catalogUi';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOLD_OPTIONS = [
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '60', label: '1 hour' },
  { value: '240', label: '4 hours' },
  { value: '1440', label: '24 hours' },
  { value: '0', label: 'Until I release it' },
];
const PERIODS = [
  { value: 'total', label: 'Overall' },
  { value: 'day', label: 'Per day' },
  { value: 'week', label: 'Per week' },
  { value: 'month', label: 'Per month' },
];
const BILLING = [
  { value: 'one_time', label: 'One-time' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

interface Form {
  name: string;
  description: string;
  item_type: ItemType;
  category: string;
  sku: string;
  pricing_model: 'fixed' | 'quote';
  price: string;
  currency: string;
  availability_type: AvailabilityType;
  status: 'active' | 'inactive';
  requires_confirmation: boolean;
  reservation_minutes: string;
  sales_notes: string;
  cost_price: string;
  cancellation_policy: string;
  images: string[];
  low_stock_threshold: string;
  initial_quantity: string;
  billing_interval: string;
  plan_features: string;
  trial_eligible: boolean;
  cap: string;
  capPeriod: string;
  m2oMax: string;
  m2oPeriod: string;
  m2oLead: string;
  m2oDeposit: string;
  days: boolean[];
  start: string;
  end: string;
  slotMinutes: string;
  perSlot: string;
  buffer: string;
  advanceDays: string;
  minNotice: string;
  blackout: string;
  timezone: string;
  lowCapacity: string;
  staleHours: string;
  staleFallback: string;
  manualAvailable: boolean;
  manualNote: string;
}

const cfg = (item: CatalogItem | null | undefined, key: string): unknown => item?.availability_config?.[key];
const str = (v: unknown, fallback = ''): string => (v === null || v === undefined ? fallback : String(v));

function initial(item: CatalogItem | null | undefined): Form {
  const days = (cfg(item, 'days') as number[] | undefined) ?? [0, 1, 2, 3, 4];
  return {
    name: item?.name ?? '',
    description: item?.description ?? '',
    item_type: item?.item_type ?? 'physical',
    category: item?.category ?? '',
    sku: item?.sku ?? '',
    pricing_model: item?.pricing_model ?? 'fixed',
    price: str(item?.price),
    currency: item?.currency ?? 'NGN',
    availability_type: item?.availability_type ?? 'quantity',
    status: item?.status === 'inactive' ? 'inactive' : 'active',
    requires_confirmation: item?.requires_confirmation ?? false,
    reservation_minutes: str(item?.reservation_minutes, '30'),
    sales_notes: item?.sales_notes ?? '',
    cost_price: str(item?.cost_price),
    cancellation_policy: item?.cancellation_policy ?? '',
    images: item?.images ?? [],
    low_stock_threshold: str(item?.low_stock_threshold),
    initial_quantity: '',
    billing_interval: item?.billing_interval || 'one_time',
    plan_features: (item?.plan_features ?? []).join('\n'),
    trial_eligible: item?.trial_eligible ?? false,
    cap: str(cfg(item, 'cap')),
    capPeriod: str(cfg(item, 'period'), 'month'),
    m2oMax: str(cfg(item, 'max_orders')),
    m2oPeriod: str(cfg(item, 'period'), 'month'),
    m2oLead: str(cfg(item, 'lead_time_days')),
    m2oDeposit: str(cfg(item, 'deposit_percent')),
    days: DAY_LABELS.map((_, i) => days.includes(i)),
    start: str(cfg(item, 'start'), '09:00'),
    end: str(cfg(item, 'end'), '17:00'),
    slotMinutes: str(cfg(item, 'slot_minutes'), '60'),
    perSlot: str(cfg(item, 'capacity_per_slot'), '1'),
    buffer: str(cfg(item, 'buffer_minutes'), '0'),
    advanceDays: str(cfg(item, 'advance_booking_days'), '60'),
    minNotice: str(cfg(item, 'min_notice_hours'), '0'),
    blackout: ((cfg(item, 'blackout_dates') as string[] | undefined) ?? []).join('\n'),
    timezone: str(cfg(item, 'timezone'), 'Africa/Lagos'),
    lowCapacity: str(cfg(item, 'low_capacity_threshold')),
    staleHours: str(cfg(item, 'stale_after_hours'), '24'),
    staleFallback: str(cfg(item, 'stale_fallback'), 'require_confirmation'),
    manualAvailable: cfg(item, 'available') !== false,
    manualNote: str(cfg(item, 'note')),
  };
}

const num = (v: string): number | null => (v.trim() === '' ? null : Number(v));
const lines = (v: string): string[] =>
  v
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

function configOf(f: Form): Record<string, unknown> {
  switch (f.availability_type) {
    case 'capped':
      return { cap: num(f.cap), period: f.capPeriod };
    case 'made_to_order':
      return {
        max_orders: num(f.m2oMax),
        period: f.m2oPeriod,
        lead_time_days: num(f.m2oLead),
        deposit_percent: num(f.m2oDeposit),
      };
    case 'schedule':
      return {
        days: f.days.flatMap((on, i) => (on ? [i] : [])),
        start: f.start,
        end: f.end,
        slot_minutes: num(f.slotMinutes),
        capacity_per_slot: num(f.perSlot),
        buffer_minutes: num(f.buffer),
        advance_booking_days: num(f.advanceDays),
        min_notice_hours: num(f.minNotice),
        blackout_dates: lines(f.blackout),
        timezone: f.timezone,
      };
    case 'capacity':
      return { low_capacity_threshold: num(f.lowCapacity) };
    case 'manual':
      return {
        available: f.manualAvailable,
        stale_after_hours: num(f.staleHours),
        stale_fallback: f.staleFallback,
        note: f.manualNote,
      };
    default:
      return {};
  }
}

function inputOf(f: Form, isNew: boolean, showCost: boolean): CatalogItemInput {
  const body: CatalogItemInput = {
    name: f.name,
    description: f.description,
    item_type: f.item_type,
    category: f.category,
    sku: f.sku,
    pricing_model: f.pricing_model,
    price: f.pricing_model === 'quote' ? null : num(f.price),
    currency: f.currency,
    availability_type: f.availability_type,
    availability_config: configOf(f),
    status: f.status,
    requires_confirmation: f.requires_confirmation,
    reservation_minutes: Number(f.reservation_minutes),
    sales_notes: f.sales_notes,
    cancellation_policy: f.cancellation_policy,
    images: f.images,
    low_stock_threshold: num(f.low_stock_threshold),
  };
  if (showCost) body.cost_price = num(f.cost_price);
  if (f.item_type === 'digital') {
    body.billing_interval = f.billing_interval;
    body.plan_features = lines(f.plan_features);
    body.trial_eligible = f.trial_eligible;
  }
  if (isNew && f.availability_type === 'quantity') body.initial_quantity = num(f.initial_quantity) ?? 0;
  return body;
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('read'));
    reader.readAsDataURL(file);
  });

function ImagePicker({ images, onChange }: { images: string[]; onChange: (v: string[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setError('');
    const added: string[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_IMAGE_BYTES) {
        setError(`${file.name} is over 10MB.`);
        continue;
      }
      try {
        added.push(await CatalogService.uploadImage(await readAsDataUrl(file)));
      } catch (e) {
        setError(apiError(e, `Could not upload ${file.name}.`));
      }
    }
    if (added.length) onChange([...images, ...added]);
    setBusy(false);
    if (input.current) input.current.value = '';
  };

  const addLink = () => {
    const url = link.trim();
    if (!/^https?:\/\//i.test(url)) return setError('Paste a link that starts with https://');
    setError('');
    onChange([...images, url]);
    setLink('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {images.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {images.map((url, i) => (
            <div key={url} style={{ position: 'relative', width: 72, height: 72 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                style={{
                  width: 72,
                  height: 72,
                  objectFit: 'cover',
                  borderRadius: 9,
                  border: i === 0 ? '2px solid #E0156B' : '1px solid #ECE6EA',
                }}
              />
              <button
                type="button"
                aria-label="Remove photo"
                onClick={() => onChange(images.filter((_, j) => j !== i))}
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  border: 'none',
                  background: '#1B1520',
                  color: '#fff',
                  fontSize: 13,
                  lineHeight: '20px',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          hidden
          onChange={(e) => upload(e.target.files)}
        />
        <Btn kind="outline" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? 'Uploading…' : 'Upload photos'}
        </Btn>
        <div style={{ flex: 1, minWidth: 180 }}>
          <Field value={link} onChange={setLink} placeholder="or paste an image link" onEnter={addLink} />
        </div>
        <Btn kind="outline" disabled={!link.trim()} onClick={addLink}>
          Add link
        </Btn>
      </div>
      {error && <div style={{ color: '#C62828', fontSize: 12 }}>{error}</div>}
    </div>
  );
}

export function CatalogEditor({
  item,
  canSeeCost,
  onSaved,
  onClose,
}: {
  item: CatalogItem | null;
  canSeeCost: boolean;
  onSaved: (item: CatalogItem) => void;
  onClose: () => void;
}) {
  const isNew = !item;
  const [f, setF] = useState<Form>(() => initial(item));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setF((prev) => ({ ...prev, [key]: value }));

  const changeType = (t: ItemType) =>
    setF((prev) => ({
      ...prev,
      item_type: t,
      availability_type: ALLOWED[t].includes(prev.availability_type) ? prev.availability_type : DEFAULT_AVAILABILITY[t],
    }));

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const body = inputOf(f, isNew, canSeeCost);
      const saved = isNew ? await CatalogService.createItem(body) : await CatalogService.updateItem(item.id, body);
      onSaved(saved);
    } catch (e) {
      setError(apiError(e, 'Could not save this item.'));
    } finally {
      setBusy(false);
    }
  };

  const kind = f.availability_type;
  return (
    <Modal title={isNew ? 'Add a product or service' : `Edit ${item.name}`} onClose={onClose} width={720}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Grid>
          <Row label="What is it?">
            <Select
              value={f.item_type}
              onChange={changeType}
              options={(Object.keys(TYPE_LABEL) as ItemType[]).map((t) => ({ value: t, label: TYPE_LABEL[t] }))}
            />
          </Row>
          <Row label="Name">
            <Field value={f.name} onChange={(v) => set('name', v)} placeholder="e.g. Air Max 90" />
          </Row>
        </Grid>
        <Row label="Description" hint="What customers (and your AI assistant) will be told about it.">
          <Field multiline value={f.description} onChange={(v) => set('description', v)} />
        </Row>
        <Grid>
          <Row label="Category">
            <Field
              value={f.category}
              onChange={(v) => set('category', v)}
              placeholder="e.g. Footwear, Travel, Software"
            />
          </Row>
          <Row label="SKU or reference (optional)">
            <Field value={f.sku} onChange={(v) => set('sku', v)} placeholder="e.g. AM90" />
          </Row>
        </Grid>

        <Grid cols={3}>
          <Row label="Pricing">
            <Select
              value={f.pricing_model}
              onChange={(v) => set('pricing_model', v)}
              options={[
                { value: 'fixed', label: 'Fixed price' },
                { value: 'quote', label: 'Quote on request' },
              ]}
            />
          </Row>
          <Row label="Price">
            <NumberInput
              value={f.price}
              onChange={(v) => set('price', v)}
              step={0.01}
              placeholder={f.pricing_model === 'quote' ? 'Quoted per customer' : '0'}
            />
          </Row>
          <Row label="Currency">
            <Field value={f.currency} onChange={(v) => set('currency', v.toUpperCase().slice(0, 3))} />
          </Row>
        </Grid>

        <div
          style={{ borderTop: '1px solid #F1EBEE', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <Row label="How does availability work?">
            <Select
              value={f.availability_type}
              onChange={(v) => set('availability_type', v)}
              options={ALLOWED[f.item_type].map((a) => ({ value: a, label: AVAILABILITY_LABEL[a] }))}
            />
          </Row>

          {kind === 'quantity' && (
            <Grid cols={3}>
              {isNew && (
                <Row label="Units in stock now" hint="Add sizes or colours after saving.">
                  <NumberInput value={f.initial_quantity} onChange={(v) => set('initial_quantity', v)} />
                </Row>
              )}
              <Row label="Alert me at" hint="Tell me when this many or fewer are left.">
                <NumberInput
                  value={f.low_stock_threshold}
                  onChange={(v) => set('low_stock_threshold', v)}
                  placeholder="Off"
                />
              </Row>
            </Grid>
          )}

          {kind === 'capped' && (
            <Grid>
              <Row label="Sell up to" hint="New sales stop when this number is reached.">
                <NumberInput value={f.cap} onChange={(v) => set('cap', v)} min={1} />
              </Row>
              <Row label="Counted">
                <Select value={f.capPeriod} onChange={(v) => set('capPeriod', v)} options={PERIODS} />
              </Row>
            </Grid>
          )}

          {kind === 'made_to_order' && (
            <Grid>
              <Row label="Orders accepted" hint="Leave empty for no limit.">
                <NumberInput value={f.m2oMax} onChange={(v) => set('m2oMax', v)} />
              </Row>
              <Row label="Counted">
                <Select value={f.m2oPeriod} onChange={(v) => set('m2oPeriod', v)} options={PERIODS} />
              </Row>
              <Row label="Lead time (days)" hint="Your assistant only quotes a finish time if you set one.">
                <NumberInput value={f.m2oLead} onChange={(v) => set('m2oLead', v)} />
              </Row>
              <Row label="Deposit (%)">
                <NumberInput value={f.m2oDeposit} onChange={(v) => set('m2oDeposit', v)} />
              </Row>
            </Grid>
          )}

          {kind === 'capacity' && (
            <Row label="Alert me when places left" hint="Add dates or departures on the item's page after saving.">
              <NumberInput value={f.lowCapacity} onChange={(v) => set('lowCapacity', v)} placeholder="Off" />
            </Row>
          )}

          {kind === 'schedule' && (
            <>
              <Row label="Open on">
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {DAY_LABELS.map((d, i) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() =>
                        set(
                          'days',
                          f.days.map((on, j) => (j === i ? !on : on))
                        )
                      }
                      style={{
                        padding: '6px 11px',
                        borderRadius: 8,
                        fontSize: 12,
                        cursor: 'pointer',
                        border: `1px solid ${f.days[i] ? '#F2B8CF' : '#ECE6EA'}`,
                        background: f.days[i] ? '#FDEEF4' : '#fff',
                        color: f.days[i] ? '#D0145C' : '#2A2230',
                        fontWeight: 600,
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </Row>
              <Grid cols={4}>
                <Row label="From">
                  <Field value={f.start} onChange={(v) => set('start', v)} placeholder="09:00" />
                </Row>
                <Row label="Until">
                  <Field value={f.end} onChange={(v) => set('end', v)} placeholder="17:00" />
                </Row>
                <Row label="Slot (minutes)">
                  <NumberInput value={f.slotMinutes} onChange={(v) => set('slotMinutes', v)} min={5} />
                </Row>
                <Row label="People per slot">
                  <NumberInput value={f.perSlot} onChange={(v) => set('perSlot', v)} min={1} />
                </Row>
                <Row label="Gap between (min)">
                  <NumberInput value={f.buffer} onChange={(v) => set('buffer', v)} />
                </Row>
                <Row label="Book up to (days ahead)">
                  <NumberInput value={f.advanceDays} onChange={(v) => set('advanceDays', v)} />
                </Row>
                <Row label="Minimum notice (hours)">
                  <NumberInput value={f.minNotice} onChange={(v) => set('minNotice', v)} />
                </Row>
                <Row label="Timezone">
                  <Field value={f.timezone} onChange={(v) => set('timezone', v)} />
                </Row>
              </Grid>
              <Row label="Days off (one per line, YYYY-MM-DD)">
                <Field multiline value={f.blackout} onChange={(v) => set('blackout', v)} style={{ minHeight: 56 }} />
              </Row>
            </>
          )}

          {kind === 'manual' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Toggle
                  on={f.manualAvailable}
                  onChange={(v) => set('manualAvailable', v)}
                  label="Currently available"
                />
                <Label>Currently available</Label>
              </div>
              <Grid>
                <Row
                  label="Treat as out of date after (hours)"
                  hint="Old availability is never promised to a customer."
                >
                  <NumberInput value={f.staleHours} onChange={(v) => set('staleHours', v)} min={1} />
                </Row>
                <Row label="If it is out of date">
                  <Select
                    value={f.staleFallback}
                    onChange={(v) => set('staleFallback', v)}
                    options={[
                      { value: 'require_confirmation', label: 'Ask me to confirm' },
                      { value: 'assume_unavailable', label: 'Treat as unavailable' },
                      { value: 'allow', label: 'Still offer it' },
                    ]}
                  />
                </Row>
              </Grid>
              <Row label="Note for customers (optional)">
                <Field value={f.manualNote} onChange={(v) => set('manualNote', v)} />
              </Row>
            </>
          )}

          {f.item_type === 'digital' && (
            <>
              <Grid>
                <Row label="Billing">
                  <Select value={f.billing_interval} onChange={(v) => set('billing_interval', v)} options={BILLING} />
                </Row>
                <Row label="Free trial">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 34 }}>
                    <Toggle on={f.trial_eligible} onChange={(v) => set('trial_eligible', v)} label="Trial available" />
                    <Muted>{f.trial_eligible ? 'Trial available' : 'No trial'}</Muted>
                  </div>
                </Row>
              </Grid>
              <Row label="What's included (one per line)">
                <Field multiline value={f.plan_features} onChange={(v) => set('plan_features', v)} />
              </Row>
            </>
          )}

          {kind !== 'unlimited' && (
            <Grid>
              <Row label="Hold a customer's order for" hint="How long unpaid orders keep the stock or place.">
                <Select
                  value={f.reservation_minutes}
                  onChange={(v) => set('reservation_minutes', v)}
                  options={HOLD_OPTIONS}
                />
              </Row>
              {kind !== 'manual' && (
                <Row label="You confirm each order first">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 34 }}>
                    <Toggle
                      on={f.requires_confirmation}
                      onChange={(v) => set('requires_confirmation', v)}
                      label="Needs confirmation"
                    />
                    <Muted>
                      {f.requires_confirmation
                        ? 'Your assistant never calls it booked'
                        : 'Customers can reserve right away'}
                    </Muted>
                  </div>
                </Row>
              )}
            </Grid>
          )}
        </div>

        <div
          style={{ borderTop: '1px solid #F1EBEE', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <Row
            label="Notes for your team and AI assistant"
            hint="Internal. The assistant uses it as guidance and never quotes it."
          >
            <Field multiline value={f.sales_notes} onChange={(v) => set('sales_notes', v)} style={{ minHeight: 56 }} />
          </Row>
          <Grid>
            <Row label="Cancellation policy (optional)">
              <Field value={f.cancellation_policy} onChange={(v) => set('cancellation_policy', v)} />
            </Row>
            {canSeeCost && (
              <Row label="Cost price (private)" hint="Never shown to customers or your assistant.">
                <NumberInput value={f.cost_price} onChange={(v) => set('cost_price', v)} step={0.01} />
              </Row>
            )}
          </Grid>
          <Row label="Photos" hint="PNG, JPG or WEBP, up to 10MB each. The first one is the main photo.">
            <ImagePicker images={f.images} onChange={(v) => set('images', v)} />
          </Row>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Toggle
              on={f.status === 'active'}
              onChange={(v) => set('status', v ? 'active' : 'inactive')}
              label="For sale"
            />
            <Label>{f.status === 'active' ? 'For sale' : 'Hidden, not for sale'}</Label>
          </div>
        </div>

        {error && <div style={{ color: '#C62828', fontSize: 12.5 }}>{error}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Btn kind="outline" onClick={onClose}>
            Cancel
          </Btn>
          <Btn onClick={save} disabled={busy}>
            {busy ? 'Saving…' : isNew ? 'Add item' : 'Save changes'}
          </Btn>
        </div>
        <div style={{ fontSize: 11, color: MSG_MUTED }}>
          Changing how availability works is blocked while customers have open or paid orders.
        </div>
      </div>
    </Modal>
  );
}
