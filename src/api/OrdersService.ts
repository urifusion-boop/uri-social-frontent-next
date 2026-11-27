import { UriHttpClient } from '@/src/configs/http.config';

// Orders. Money is in minor units (kobo, cents); the server sets every price and total.

export type OrderStatus =
  | 'draft'
  | 'awaiting_customer'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'expired';
export type PaymentStatus = 'unpaid' | 'pending' | 'partially_paid' | 'paid' | 'failed';
export type FulfilmentStatus =
  | 'not_started'
  | 'queued'
  | 'processing'
  | 'partially_fulfilled'
  | 'fulfilled'
  | 'delivery_failed';
export type LineFulfilment = 'queued' | 'processing' | 'fulfilled' | 'delivery_failed';

export interface OrderLine {
  id: string;
  catalog_item_id: string;
  variant_id: string | null;
  quantity: number;
  currency: string;
  unit_amount: number | null;
  line_total: number;
  needs_quote: boolean;
  fulfilment_status: string;
  fulfilment_reference?: string;
  snapshot: { name: string; variant: string; sku: string };
}

export interface OrderPayment {
  id: string;
  reference: string;
  amount: number;
  status: string;
  source: string;
  method?: string;
  created_at: string;
  confirmed_at?: string;
}

export interface OrderRevision {
  number: number;
  reason: string;
  created_at: string;
  before: { total: number };
  after: { total: number };
}

export interface Order {
  id: string;
  order_number: string;
  public_token: string;
  source: string;
  source_ref: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  fulfilment_status: FulfilmentStatus;
  currency: string;
  subtotal: number;
  discount_total: number;
  fees_total: number;
  total: number;
  paid_amount: number;
  due_amount: number;
  customer: { name?: string; phone?: string; email?: string; handle?: string; channel?: string };
  delivery: { method?: string; address?: string; recipient?: string; phone?: string; instructions?: string };
  internal_notes: string;
  assignee: string;
  refund_due?: boolean;
  cancel_reason?: string;
  exception_flags?: { line_id: string; reason: string }[];
  created_at: string;
  confirmed_at?: string;
  payment_due_at?: string | null;
  line_count?: number;
  lines: OrderLine[];
  payments?: OrderPayment[];
  revisions?: OrderRevision[];
}

export interface OrderEvent {
  id: string;
  type: string;
  actor: string;
  created_at: string;
  payload: Record<string, unknown>;
}

export interface NewOrder {
  source: 'dashboard';
  customer: { name?: string; phone?: string; email?: string };
  items: { catalog_item_id: string; variant_id?: string; quantity: number }[];
  delivery?: { method?: string; address?: string; fee?: number };
  internal_notes?: string;
}

const http = () => UriHttpClient.getClient();

const list = async (p: {
  q?: string;
  status?: string;
  payment_status?: string;
  fulfilment_status?: string;
  limit?: number;
  skip?: number;
}): Promise<{ orders: Order[]; total: number }> => (await http().get('/orders', { params: p })).data;
const get = async (id: string): Promise<Order> => (await http().get(`/orders/${id}`)).data;
const create = async (body: NewOrder): Promise<Order> => (await http().post('/orders', body)).data;
const post = async (id: string, path: string, body: object = {}): Promise<Order> =>
  (await http().post(`/orders/${id}/${path}`, body)).data;
const events = async (id: string): Promise<OrderEvent[]> => (await http().get(`/orders/${id}/events`)).data.events;
const exportCsv = async (): Promise<string> => (await http().get('/orders/export', { responseType: 'text' })).data;

export const OrdersService = {
  list,
  get,
  create,
  events,
  exportCsv,
  send: (id: string) => post(id, 'quote'),
  quote: (id: string, lineId: string, unitPrice: number) =>
    post(id, 'quote', { line_id: lineId, unit_price: unitPrice }),
  confirm: (id: string) => post(id, 'confirm', { customer_accepted: true }),
  requestPayment: (id: string, amount?: number) => post(id, 'payment-requests', { amount }),
  recordPayment: (id: string, amount: number, method: string, note: string) =>
    post(id, 'payments', { amount, method, note }),
  fulfil: (id: string, lineId: string, status: LineFulfilment, reference = '') =>
    post(id, 'fulfilments', { line_id: lineId, status, reference }),
  adjust: (id: string, kind: 'discount' | 'fee', amount: number, reason: string) =>
    post(id, 'adjustments', { kind, amount, reason }),
  cancel: (id: string, reason: string) => post(id, 'cancel', { reason }),
  refund: async (id: string, amount: number, reason: string) =>
    (await http().post(`/orders/${id}/refund-requests`, { amount, reason })).data,
  assign: (id: string, assignee: string) =>
    http()
      .patch(`/orders/${id}`, { assignee })
      .then((r) => r.data as Order),
};
