export function naira(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return `₦${Math.round(v).toLocaleString()}`;
}

export function pct(v: number | null | undefined, digits = 1): string {
  if (v === null || v === undefined) return '—';
  return `${(v * 100).toFixed(digits)}%`;
}

export const ACTION_LABELS: Record<string, string> = {
  pause_ad: 'Pause an ad',
  resume_ad: 'Turn an ad back on',
  pause_campaign: 'Pause the campaign',
  resume_campaign: 'Resume the campaign',
  set_daily_budget: 'Change the daily budget',
  observe: 'Keep watching',
  refresh_creative: 'Refresh the creative',
  review_offer: 'Review the offer',
  fix_tracking: 'Fix tracking',
  fix_landing_page: 'Fix the landing page',
  follow_up_leads: 'Follow up with leads',
  review_targeting: 'Review targeting',
};

export const CONFIDENCE_TONE: Record<string, 'green' | 'amber' | 'grey'> = {
  high: 'green',
  medium: 'amber',
  low: 'grey',
};

export function ago(at: string | null | undefined): string {
  if (!at) return 'never';
  const d = new Date(at.endsWith('Z') || at.includes('+') ? at : `${at}Z`);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}
