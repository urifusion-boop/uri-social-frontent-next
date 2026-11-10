/**
 * Autosave for an in-progress wizard run. localStorage is the fast path — one
 * slot per brand, synchronous, free, written on every change — and covers the
 * common case (closed tab, "All campaigns" mid-build, back tomorrow on the same
 * browser). It does not survive a cleared browser, a different device, or a
 * different browser; CampaignService.saveWizardDraft/getWizardDraft/
 * clearWizardDraftRemote (jane-ads/wizard-draft on the backend) is the backstop
 * for that, debounced separately and failing silently since it's still a
 * convenience layered on top of the wizard, never something it depends on.
 *
 * One slot per brand, not a list — the ask was "don't lose my unfinished work,"
 * not a drafts inbox. Starting a new run overwrites it the moment the new run
 * reaches the same "worth saving" bar (an objective picked); the old one was
 * already offered for resume on the list page before that could happen.
 */
import { CampaignService } from '@/src/api/CampaignService';
import { UriHttpClient } from '@/src/configs/http.config';
import type { GooglePlacement } from '../GooglePlacementPreview';
import type { WizardAudienceValue } from './WizardAudienceStep';
import type { WizardBudgetValue } from './WizardBudgetStep';
import type { WizardCreativeChoice } from './WizardCreativeStep';
import type { WizardObjectiveValue } from './WizardObjectiveStep';
import type { WizardPlatformValue } from './WizardPlatformStep';

export interface WizardDraft {
  objective: WizardObjectiveValue;
  platform: WizardPlatformValue;
  googlePlacement: GooglePlacement;
  audience: WizardAudienceValue;
  budget: WizardBudgetValue;
  creative: WizardCreativeChoice | null;
  savedAt: number;
}

const KEY_PREFIX = '@URI@WIZARD_DRAFT@';
// Stale enough that it's almost certainly irrelevant (prices, offers, the brand's
// own plans have likely moved on) — drop it rather than resurface it forever.
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function storageKey(): string {
  let brandId = 'default';
  try {
    brandId = localStorage.getItem(UriHttpClient.ACTIVE_BRAND_KEY) || 'default';
  } catch {
    // Private-mode/storage-disabled — fall through to the shared default key for
    // this tab's lifetime; saveWizardDraft's own try/catch handles the rest.
  }
  return `${KEY_PREFIX}${brandId}`;
}

// Debounced, not instant — the audience textarea fires onChange per keystroke, and
// a write per keystroke is wasted work for a value nobody has asked to read until
// the tab closes or the list page is revisited. The remote save gets its own,
// longer debounce: it's a network call, so it's worth coalescing harder than the
// free local write.
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let remoteSaveTimer: ReturnType<typeof setTimeout> | null = null;

export function saveWizardDraft(draft: Omit<WizardDraft, 'savedAt'>): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(storageKey(), JSON.stringify({ ...draft, savedAt: Date.now() }));
    } catch {
      // Quota exceeded or storage unavailable — resuming is a convenience on top
      // of the wizard, never a requirement for it, so this fails silently.
    }
  }, 400);

  if (remoteSaveTimer) clearTimeout(remoteSaveTimer);
  remoteSaveTimer = setTimeout(() => {
    CampaignService.saveWizardDraft(draft as unknown as Record<string, unknown>).catch(() => {
      // Offline, or the request failed outright — the next edit schedules another
      // attempt, and the local copy already has this version regardless.
    });
  }, 1500);
}

export function loadWizardDraft(): WizardDraft | null {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return null;
    const draft = JSON.parse(raw) as WizardDraft;
    if (!draft.savedAt || Date.now() - draft.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(storageKey());
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

/** The backend's copy, if any — checked in the background after the instant
 *  local read above, and used only when it's actually newer (a different
 *  device, or this browser's own local copy having been cleared). Never
 *  blocks the list page on a network round trip for the common case. */
export async function fetchRemoteWizardDraft(): Promise<WizardDraft | null> {
  try {
    const { payload, updated_at } = await CampaignService.getWizardDraft();
    if (!payload || !updated_at) return null;
    const savedAt = new Date(updated_at).getTime();
    if (!savedAt || Date.now() - savedAt > MAX_AGE_MS) return null;
    return { ...(payload as unknown as Omit<WizardDraft, 'savedAt'>), savedAt };
  } catch {
    return null;
  }
}

export function clearWizardDraft(): void {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (remoteSaveTimer) {
    clearTimeout(remoteSaveTimer);
    remoteSaveTimer = null;
  }
  try {
    localStorage.removeItem(storageKey());
  } catch {
    // Nothing to clean up if storage was never reachable in the first place.
  }
  CampaignService.clearWizardDraftRemote().catch(() => {
    // Same reasoning as the save path — a convenience layer, not a dependency.
  });
}
