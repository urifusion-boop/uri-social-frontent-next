import { UriHttpClient } from '@/src/configs/http.config';

// Products & Services. These endpoints return plain JSON; auth and X-Brand-Id are attached by the client.

export type ItemType = 'physical' | 'digital' | 'capacity' | 'service' | 'made_to_order';
export type AvailabilityType =
  | 'quantity'
  | 'unlimited'
  | 'capped'
  | 'capacity'
  | 'schedule'
  | 'manual'
  | 'made_to_order';
export type StockVisibility = 'exact' | 'low_only' | 'never';
export type ItemStatus = 'active' | 'inactive' | 'archived';

export interface StockInfo {
  on_hand: number;
  reserved: number;
  available: number;
  low_stock_threshold: number | null;
}

export interface CatalogVariant {
  id: string;
  item_id: string;
  name: string;
  sku: string;
  attributes: Record<string, string>;
  price: number | null;
  currency: string;
  status: ItemStatus;
  stock?: StockInfo;
}

export interface CatalogItem {
  id: string;
  name: string;
  description: string;
  item_type: ItemType;
  category: string;
  images: string[];
  sku: string;
  pricing_model: 'fixed' | 'quote';
  price: number | null;
  currency: string;
  availability_type: AvailabilityType;
  availability_config: Record<string, unknown>;
  availability_source: 'uri' | 'manual' | 'external';
  external_provider: string;
  last_synced_at?: string | null;
  availability_updated_at?: string | null;
  status: ItemStatus;
  sales_notes: string;
  cost_price?: number | null;
  requires_confirmation: boolean;
  reservation_minutes: number;
  confirmation_hours: number;
  billing_interval: string;
  plan_features: string[];
  usage_limits: Record<string, string>;
  trial_eligible: boolean;
  cancellation_policy: string;
  low_stock_threshold: number | null;
  stock_visibility?: StockVisibility;
  updated_at?: string;
  // list view
  variant_count?: number;
  available_quantity?: number;
  on_hand?: number;
  low_stock?: boolean;
  // detail view
  variants?: CatalogVariant[];
  stock?: StockInfo;
}

export type CatalogItemInput = Partial<
  Omit<CatalogItem, 'id' | 'variants' | 'stock' | 'variant_count' | 'available_quantity' | 'on_hand' | 'low_stock'>
> & { initial_quantity?: number | null };

export interface AvailabilityResult {
  item_id: string;
  available: boolean;
  available_quantity: number | null;
  availability_type: AvailabilityType;
  requires_confirmation: boolean;
  source: string;
  last_updated: string | null;
  stale: boolean;
  reason: string;
  message: string;
  checked_at: string;
  variants?: { variant_id: string; name: string; available_quantity: number; available: boolean }[];
  slots?: { slot_id: string; start_at: string; end_at: string; remaining: number; total: number; label: string }[];
  lead_time_days?: number;
  deposit_percent?: number | null;
}

export interface CatalogSlot {
  id: string;
  item_id: string;
  start_at: string;
  end_at: string;
  label: string;
  total: number;
  reserved: number;
  confirmed: number;
  remaining: number;
  status: 'open' | 'closed';
  bookable?: boolean;
}

export type ReservationStatus =
  | 'pending'
  | 'awaiting_confirmation'
  | 'confirmed'
  | 'fulfilled'
  | 'released'
  | 'expired'
  | 'cancelled'
  | 'declined';

export interface Reservation {
  id: string;
  item_id: string;
  item_name: string;
  variant_id: string | null;
  quantity: number;
  order_id: string;
  status: ReservationStatus;
  expires_at: string | null;
  start_at: string | null;
  created_at: string;
  source: string;
  payment_status: string;
  customer?: Record<string, string>;
}

export interface StockMovement {
  id: string;
  item_id: string;
  item_name: string;
  variant_id: string | null;
  movement_type: string;
  quantity_change: number;
  reserved_change: number;
  reason: string;
  created_by: string;
  created_at: string;
  on_hand_after: number | null;
}

export interface CatalogAlert {
  key: string;
  type: string;
  severity: 'high' | 'medium' | 'low';
  item_id: string;
  item_name: string;
  title: string;
  message: string;
}

export interface CatalogReport {
  days: number;
  items: { total: number; active: number };
  sold: { item_id: string; name: string; units: number; remaining: number | null }[];
  low_stock: { item_id: string; name: string; available: number }[];
  most_requested: { item_id: string; name: string; requests: number }[];
  reservations: {
    converted: number;
    expired: number;
    released: number;
    open: number;
    total: number;
    conversion_rate: number | null;
  };
  utilisation: { capacity: number; booked: number; rate: number | null };
  demand_without_availability: { item_id: string; name: string; enquiries: number; last_at: string }[];
  note: string;
}

export interface ImportResult {
  dry_run: boolean;
  created: number;
  updated: number;
  rows: number;
  errors: { row: number; name: string; error: string }[];
}

const http = () => UriHttpClient.getClient();

const listItems = async (p: {
  q?: string;
  status?: string;
  item_type?: string;
  category?: string;
  limit?: number;
  skip?: number;
}): Promise<{ items: CatalogItem[]; total: number; categories: string[] }> =>
  (await http().get('/catalog/items', { params: p })).data;

const getItem = async (id: string): Promise<CatalogItem> => (await http().get(`/catalog/items/${id}`)).data;
const createItem = async (body: CatalogItemInput): Promise<CatalogItem> =>
  (await http().post('/catalog/items', body)).data;
const updateItem = async (id: string, body: CatalogItemInput): Promise<CatalogItem> =>
  (await http().patch(`/catalog/items/${id}`, body)).data;
const archiveItem = async (id: string): Promise<void> => {
  await http().delete(`/catalog/items/${id}`);
};

const createVariant = async (
  itemId: string,
  body: Partial<CatalogVariant> & { initial_quantity?: number | null; low_stock_threshold?: number | null }
): Promise<CatalogVariant> => (await http().post(`/catalog/items/${itemId}/variants`, body)).data;
const updateVariant = async (
  itemId: string,
  variantId: string,
  body: Partial<CatalogVariant>
): Promise<CatalogVariant> => (await http().patch(`/catalog/items/${itemId}/variants/${variantId}`, body)).data;

const setManualAvailability = async (itemId: string, available: boolean, note: string): Promise<CatalogItem> =>
  (await http().post(`/catalog/items/${itemId}/manual-availability`, { available, note })).data;

const checkAvailability = async (p: {
  item_id: string;
  variant_id?: string;
  quantity?: number;
  start_at?: string;
}): Promise<AvailabilityResult> => (await http().get('/catalog/availability/check', { params: p })).data;

const calendar = async (itemId: string, start?: string, end?: string): Promise<CatalogSlot[]> =>
  (await http().get('/catalog/availability/calendar', { params: { item_id: itemId, start, end } })).data.slots;

const createSlot = async (
  itemId: string,
  body: { start_at: string; end_at: string; total: number; label?: string }
): Promise<CatalogSlot> => (await http().post(`/catalog/items/${itemId}/slots`, body)).data;
const updateSlot = async (
  slotId: string,
  body: { total?: number; status?: 'open' | 'closed'; label?: string }
): Promise<CatalogSlot> => (await http().patch(`/catalog/slots/${slotId}`, body)).data;

const adjustStock = async (body: {
  item_id: string;
  variant_id?: string | null;
  movement_type?: string;
  quantity?: number;
  quantity_change?: number;
  set_to?: number;
  reason?: string;
  low_stock_threshold?: number | null;
}): Promise<StockInfo & { change: number }> => (await http().post('/catalog/inventory/adjustments', body)).data;

const movements = async (p: {
  item_id?: string;
  limit?: number;
  skip?: number;
}): Promise<{ movements: StockMovement[]; total: number }> =>
  (await http().get('/catalog/inventory/movements', { params: p })).data;

const listReservations = async (p: {
  status?: string;
  item_id?: string;
  limit?: number;
  skip?: number;
}): Promise<{ reservations: Reservation[]; total: number }> =>
  (await http().get('/catalog/reservations', { params: p })).data;

const reserve = async (body: {
  item_id: string;
  variant_id?: string | null;
  quantity: number;
  start_at?: string;
  order_id?: string;
  idempotency_key?: string;
  customer?: Record<string, string>;
}): Promise<Reservation> => (await http().post('/catalog/reservations', body)).data;

const reservationAction = async (
  id: string,
  action: 'extend' | 'release' | 'confirm' | 'approve' | 'decline' | 'fulfil',
  body: Record<string, unknown> = {}
): Promise<Reservation> => (await http().post(`/catalog/reservations/${id}/${action}`, body)).data;

const uploadImage = async (dataUrl: string): Promise<string> =>
  (await http().post('/catalog/images', { data_url: dataUrl })).data.url;

const alerts = async (): Promise<CatalogAlert[]> => (await http().get('/catalog/alerts')).data.alerts;
const report = async (days = 30): Promise<CatalogReport> =>
  (await http().get('/catalog/reports/summary', { params: { days } })).data;

const importCsv = async (csv: string, dryRun: boolean): Promise<ImportResult> =>
  (await http().post('/catalog/import', { csv, dry_run: dryRun })).data;
const exportCsv = async (): Promise<Blob> =>
  (await http().get('/catalog/export', { responseType: 'blob' })).data as Blob;

export const CatalogService = {
  listItems,
  getItem,
  createItem,
  updateItem,
  archiveItem,
  createVariant,
  updateVariant,
  setManualAvailability,
  checkAvailability,
  calendar,
  createSlot,
  updateSlot,
  adjustStock,
  movements,
  listReservations,
  reserve,
  reservationAction,
  uploadImage,
  alerts,
  report,
  importCsv,
  exportCsv,
};
