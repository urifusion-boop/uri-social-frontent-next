/**
 * Autosave for every in-progress wizard run. localStorage is the fast path —
 * synchronous, free, written on every change — and covers the common case
 * (closed tab, "All campaigns" mid-build, back tomorrow on the same browser).
 * It does not survive a cleared browser, a different device, or a different
 * browser; CampaignService.saveWizardDraft/listWizardDrafts/
 * deleteWizardDraftRemote (jane-ads/wizard-draft(s) on the backend) is the
 * backstop for that, debounced separately and failing silently since it's
 * still a convenience layered on top of the wizard, never something it
 * depends on.
 *
 * Live-reported: an earlier version kept one slot per brand — starting a
 * second unfinished run silently discarded the first ("I left more than one,
 * why am I only seeing one"). Every run now keeps its own slot by draft_id,
 * and `results` additionally remembers the actual plan/creative Jane already
 * built (by platform) so resuming shows what was really there instead of
 * regenerating a possibly-different ad from the same inputs.
 */
import { CampaignService, LaunchFromMessageResult, PlanVariant } from '@/src/api/CampaignService';
import { UriHttpClient } from '@/src/configs/http.config';
import type { GooglePlacement } from '../GooglePlacementPreview';
import type { WizardAudienceValue } from './WizardAudienceStep';
import type { WizardBudgetValue } from './WizardBudgetStep';
import type { WizardCreativeChoice } from './WizardCreativeStep';
import type { WizardObjectiveValue } from './WizardObjectiveStep';
import type { MultiWizardPlatform, WizardPlatformValue } from './WizardPlatformStep';

/** Whichever audience answer Jane's stateless /plan-from-message call needs
 *  resent on every later turn — a chosen plan variant, or the client's own
 *  typed-in audience. Neither is part of the result itself (it's an input TO
 *  the next call, not an output of the last one), so without carrying it
 *  forward, resuming past the question that first set it forgets it existed:
 *  the next answer goes back with no audience chosen, and Jane can reopen
 *  earlier-resolved questions (including creative) trying to resolve it. */
export interface WizardReviewChoice {
  variant?: PlanVariant;
  variantGroupId?: string;
  ownAudience?: string;
}

/** The last plan/creative Jane actually built for this run, per platform (or
 *  just 'single') — not re-interpreted here, only carried so WizardReviewStep
 *  can show it again on resume instead of starting a fresh conversation. */
export interface WizardReviewSnapshot {
  single?: LaunchFromMessageResult | null;
  multi?: Partial<Record<MultiWizardPlatform, LaunchFromMessageResult>>;
  singleChoice?: WizardReviewChoice;
  multiChoice?: Partial<Record<MultiWizardPlatform, WizardReviewChoice>>;
}

export interface WizardDraft {
  id: string;
  objective: WizardObjectiveValue;
  platform: WizardPlatformValue;
  googlePlacement: GooglePlacement;
  audience: WizardAudienceValue;
  budget: WizardBudgetValue;
  creative: WizardCreativeChoice | null;
  results?: WizardReviewSnapshot;
  savedAt: number;
}

const KEY_PREFIX = '@URI@WIZARD_DRAFTS@';
// Stale enough that it's almost certainly irrelevant (prices, offers, the brand's
// own plans have likely moved on) — drop it rather than resurface it forever.
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
// A bound, not a product decision — just here so a habit of starting and
// abandoning runs can't grow this list forever. Oldest drops first.
const MAX_DRAFTS = 12;

function storageKey(): string {
  let brandId = 'default';
  try {
    brandId = localStorage.getItem(UriHttpClient.ACTIVE_BRAND_KEY) || 'default';
  } catch {
    // Private-mode/storage-disabled — fall through to the shared default key for
    // this tab's lifetime; every call below has its own try/catch regardless.
  }
  return `${KEY_PREFIX}${brandId}`;
}

function readAll(): WizardDraft[] {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return [];
    const list = JSON.parse(raw) as WizardDraft[];
    return Array.isArray(list) ? list.filter((d) => d.savedAt && Date.now() - d.savedAt <= MAX_AGE_MS) : [];
  } catch {
    return [];
  }
}

function writeAll(drafts: WizardDraft[]): void {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(drafts.slice(0, MAX_DRAFTS)));
  } catch {
    // Quota exceeded or storage unavailable — resuming is a convenience on top
    // of the wizard, never a requirement for it, so this fails silently.
  }
}

// Debounced per draft id, not instant — the audience textarea fires onChange
// per keystroke, and a write per keystroke is wasted work for a value nobody
// has asked to read until the tab closes or the list page is revisited. The
// remote save gets its own, longer debounce per id: it's a network call, so
// it's worth coalescing harder than the free local write.
const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();
const remoteSaveTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function saveWizardDraft(id: string, draft: Omit<WizardDraft, 'id' | 'savedAt'>): void {
  const existing = saveTimers.get(id);
  if (existing) clearTimeout(existing);
  saveTimers.set(
    id,
    setTimeout(() => {
      const rest = readAll().filter((d) => d.id !== id);
      writeAll([{ ...draft, id, savedAt: Date.now() }, ...rest].sort((a, b) => b.savedAt - a.savedAt));
    }, 400)
  );

  const existingRemote = remoteSaveTimers.get(id);
  if (existingRemote) clearTimeout(existingRemote);
  remoteSaveTimers.set(
    id,
    setTimeout(() => {
      CampaignService.saveWizardDraft(id, draft as unknown as Record<string, unknown>).catch(() => {
        // Offline, or the request failed outright — the next edit schedules another
        // attempt, and the local copy already has this version regardless.
      });
    }, 1500)
  );
}

export function loadWizardDrafts(): WizardDraft[] {
  return readAll().sort((a, b) => b.savedAt - a.savedAt);
}

/** The backend's copies, if any — checked in the background after the instant
 *  local read above, merged in rather than replacing it (a different device's
 *  drafts should show up alongside this browser's own, not instead of them). */
export async function fetchRemoteWizardDrafts(): Promise<WizardDraft[]> {
  try {
    const { drafts } = await CampaignService.listWizardDrafts();
    return drafts
      .filter((d) => d.payload && d.updated_at)
      .map((d) => {
        const savedAt = new Date(d.updated_at as string).getTime();
        return { ...(d.payload as unknown as Omit<WizardDraft, 'id' | 'savedAt'>), id: d.draft_id, savedAt };
      })
      .filter((d) => d.savedAt && Date.now() - d.savedAt <= MAX_AGE_MS);
  } catch {
    return [];
  }
}

/** Local + remote, one entry per id (whichever copy is newer wins) — the list
 *  page's actual source of truth once the background remote check lands. */
export function mergeWizardDrafts(local: WizardDraft[], remote: WizardDraft[]): WizardDraft[] {
  const byId = new Map<string, WizardDraft>();
  for (const d of [...local, ...remote]) {
    const prior = byId.get(d.id);
    if (!prior || d.savedAt > prior.savedAt) byId.set(d.id, d);
  }
  return Array.from(byId.values()).sort((a, b) => b.savedAt - a.savedAt);
}

export function deleteWizardDraft(id: string): void {
  const existing = saveTimers.get(id);
  if (existing) clearTimeout(existing);
  saveTimers.delete(id);
  const existingRemote = remoteSaveTimers.get(id);
  if (existingRemote) clearTimeout(existingRemote);
  remoteSaveTimers.delete(id);

  writeAll(readAll().filter((d) => d.id !== id));
  CampaignService.deleteWizardDraftRemote(id).catch(() => {
    // Same reasoning as the save path — a convenience layer, not a dependency.
  });
}
