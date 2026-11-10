/**
 * Autosave for an in-progress wizard run — the one piece of old-page parity that
 * genuinely needed new infrastructure rather than wiring together what already
 * existed (see CampaignWizard.tsx's own history: everything else in this file was
 * portable from the chat flow's components/handlers directly). The chat flow's
 * equivalent (resuming an unfinished thread) is backend-backed; this is deliberately
 * NOT that — no new endpoint, no round trip, nothing to clean up server-side. A
 * wizard run is five small, already-JSON-safe objects, so the browser's own
 * localStorage is the efficient answer: synchronous, free, and exactly as durable
 * as this needs to be (surviving a closed tab, not surviving a wiped browser).
 *
 * One slot per brand, not a list — the ask was "don't lose my unfinished work if I
 * navigate away," not a drafts inbox. Starting a new run overwrites it the moment
 * the new run reaches the same "worth saving" bar (an objective picked); the old
 * one was already offered for resume on the list page before that could happen.
 */
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
// a synchronous localStorage write per keystroke is wasted work for a value nobody
// has asked to read until the tab closes or the list page is revisited.
let saveTimer: ReturnType<typeof setTimeout> | null = null;

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

export function clearWizardDraft(): void {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  try {
    localStorage.removeItem(storageKey());
  } catch {
    // Nothing to clean up if storage was never reachable in the first place.
  }
}
