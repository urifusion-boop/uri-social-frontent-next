'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CampaignService,
  CampaignRow,
  CtaChoice,
  DestinationOption,
  DraftSummary,
  LaunchFromMessageResult,
  PlanAskResult,
  PlanVariant,
  PlanVariantSet,
  WalletInfo,
  BillingSummary,
  CampaignSummary,
  ThreadSummary,
} from '@/src/api/CampaignService';
import { useIsMobile } from '@/src/hooks/useIsMobile';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';

const PINK = '#C2185B';

// A chosen (but not yet built) multi-plan audience selection — see pendingVariantsRef
// below. Threaded through the video hand-off below because it lives in a ref that
// gets wiped when this component unmounts for the hand-off and remounts on return.
type PendingVariants = { variants: PlanVariant[]; variantGroupId: string };

interface CampaignsPageProps {
  onJane?: () => void;
  // Video quality hand-off (redirect to Video Polish, come back with the result):
  // asks the parent to switch pages and start a polish job for this file, returning
  // to this exact thread when done. Optional — omitted entirely, this page just
  // skips the "improve quality?" prompt and behaves as it always has.
  onRequestVideoPolish?: (file: File, threadId: string, pendingVariants?: PendingVariants) => void;
  // Set by the parent once a polish job finishes and the user chose to use the
  // result — this page picks it back up as if the user had just uploaded it.
  pendingResumeVideo?: { threadId: string; url: string; pendingVariants?: PendingVariants } | null;
  onResumeVideoConsumed?: () => void;
}

type ChatMsg =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'jane'; kind: 'text'; text: string }
  | { id: string; role: 'jane'; kind: 'result'; result: LaunchFromMessageResult };

interface SelectedMedia {
  source: 'upload' | 'draft';
  url: string;
  isVideo: boolean;
  draftId?: string;
  label: string;
}

const naira = (n?: number | null) => (n == null ? 'N/A' : '₦' + Number(n).toLocaleString());
const uid = () => Math.random().toString(36).slice(2);

const GREETING_TEXT =
  "Hi! Tell me what you'd like to promote, and I'll plan and launch a campaign for you. " +
  "I'll write the copy, design the visual, and set it up for you, paused until you say go.";
const makeGreeting = (): ChatMsg => ({ id: uid(), role: 'jane', kind: 'text', text: GREETING_TEXT });

// Tappable quick replies (Tier 5b) — pure UI sugar to cut down on typing for the
// two spots where Jane's own conversation flow always lands: picking a starting
// goal, and answering the budget/customer-count question nl.py always asks when
// budget_ngn is missing (the only thing that ever triggers stage === 'need_more').
const GOAL_STARTER_CHIPS = [
  'Get me more WhatsApp messages',
  'Get me more bookings',
  'Get me more sales',
  'Get me more followers',
];

const BUDGET_REPLY_CHIPS = ['₦5,000 budget', '₦10,000 budget', '₦20,000 budget', '20 customers'];

// Objective-first flow: nl.py now asks WHAT's being promoted (offer_type) right after
// business identity and before budget — these chips answer that question.
const OBJECTIVE_REPLY_CHIPS = ['Product', 'Service', 'Discount/Promo', 'Event', 'New Launch', 'Just Awareness'];

// Surface the backend's real FastAPI HTTPException `detail` (e.g. "Budget is too
// low…", a rate-limit notice) instead of a generic fallback, so the user gets an
// actionable message. The value reaching here can be shaped two ways and we must
// handle both: a raw axios error (`e.response.data.detail`) OR — because
// UriHttpClient's interceptor rejects with `error.response` directly — the already
// unwrapped response (`e.data.detail`). The earlier code only checked the first
// shape, so every jane-ads error (which comes through the interceptor) silently
// fell back to the generic text.
function extractErrorMessage(e: unknown, fallback: string): string {
  const obj = e as { response?: { data?: { detail?: unknown } }; data?: { detail?: unknown } } | null;
  const detail = obj?.response?.data?.detail ?? obj?.data?.detail;
  if (typeof detail === 'string' && detail) return detail;
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

// Any failure that's actually about the WhatsApp number itself — not just the one
// specific phrase from the old native Click-to-WhatsApp integration ("not linked to
// your account"), which shouldn't even occur any more now that launches route through
// a wa.me link. Broadened on request so any number-shaped rejection (a malformed
// number Meta rejects, a future edge case, etc.) still gets the same guided fix
// instead of a dead error the client can only retry blindly.
function isWhatsappNumberError(msg: string): boolean {
  return /whatsapp|phone number/i.test(msg);
}

// The number saved here is now also a first-class field in Connected Accounts (not
// just a one-off chat fix) — this points there so the client knows there's a
// permanent place to manage it, not just this one retry.
function ConnectedAccountsWhatsappLink() {
  return (
    <a
      href="/workspace?tab=connections"
      style={{ fontSize: 12, color: PINK, textDecoration: 'underline', display: 'inline-block', marginTop: 4 }}
    >
      Manage this number anytime in Connected Accounts →
    </a>
  );
}

/**
 * Campaign section: chat with Jane to create a campaign in plain language, and manage
 * existing campaigns with their reach/conversation metrics. No platform jargon — the
 * user just describes what they want; Jane plans it, makes the creative, and launches
 * it (paused) on their behalf.
 */
// `onJane` in CampaignsPageProps is kept for prop-shape compatibility with the shared
// pattern every workspace page uses (WorkspaceDashboard passes it to all of them) —
// this page no longer shows a back link, so nothing here reads it.
export default function CampaignsPage({
  onRequestVideoPolish,
  pendingResumeVideo,
  onResumeVideoConsumed,
}: CampaignsPageProps) {
  const isMobile = useIsMobile();
  const [railOpen, setRailOpen] = useState(false);
  const [tab, setTab] = useState<'chat' | 'manage' | 'wallet' | 'billing'>('chat');
  const [isAdmin, setIsAdmin] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([makeGreeting()]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [media, setMedia] = useState<SelectedMedia | null>(null);
  const [briefSoFar, setBriefSoFar] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [draftsOpen, setDraftsOpen] = useState(false);
  const [drafts, setDrafts] = useState<DraftSummary[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(false);
  // Tier E — campaign threads (the left rail). activeThreadRef mirrors the state so the
  // async send/save handlers always read the current thread without a stale closure.
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const activeThreadRef = useRef<string | null>(null);
  // The last plan's image — reused on refinements ("target lagos", "make it 10k") so a
  // targeting/budget tweak keeps the same visual instead of regenerating (and burning a
  // credit). Cleared on launch / + New / opening another thread.
  const lastCreativeRef = useRef<string>('');
  // Which image source the user picked for THIS campaign (upload / draft / let Jane
  // generate). Null until they choose — the first plan attempt asks (creative_source
  // 'ask' → the choose card). Reset on launch / + New / thread switch.
  const creativeChoiceRef = useRef<'generate' | 'upload' | 'draft' | 'recomposite' | null>(null);
  // false = not from the choose card; 'upload'/'recomposite' = which choose-card button
  // triggered this file picker, so handleFileChosen knows which creative_source to send.
  const uploadForChoiceRef = useRef<false | 'upload' | 'recomposite'>(false);
  // A video was just uploaded (from either upload path) and is waiting on the
  // "improve quality first?" prompt before it continues into the plan. Holds the
  // raw File (needed to seed Video Polish, which takes a fresh upload, not a URL)
  // alongside the already-hosted url/forChoice so "use as-is" can proceed exactly
  // as a normal video upload would have.
  const [pendingVideoQualityCheck, setPendingVideoQualityCheck] = useState<{
    file: File;
    url: string;
    forChoice: false | 'upload';
  } | null>(null);
  // Multi-Plan Audience Variants — set while waiting for the user to pick an image
  // source for one or more selected variants (continueWithVariants asks first,
  // same as the normal flow, instead of silently auto-generating). Consumed and
  // cleared by continueWithSource once a source is chosen.
  const pendingVariantsRef = useRef<PendingVariants | null>(null);
  // The audience the client ALREADY chose, kept for the whole campaign — not consumed
  // like pendingVariantsRef above. Live-reported loop: after picking an audience, any
  // typed reply (e.g. answering Jane's own "which areas in Ikeja?" question) went
  // through send(), which carried no selected_plan_variant — so the backend, which
  // re-parses each call from scratch, had no idea a choice had been made and offered
  // the whole variant set again. Confirmed in a real thread: choose_plan_variant →
  // choose_creative_source → (typed "none") → choose_plan_variant AGAIN. Every
  // subsequent call now carries the choice, exactly like briefSoFar carries the brief,
  // and it's cleared in the same places briefSoFar is.
  const chosenVariantRef = useRef<{ variant: PlanVariant; variantGroupId: string } | null>(null);
  // The client's OWN audience ("none of these — describe your own"), kept for the whole
  // campaign for exactly the same reason chosenVariantRef is: it IS the choice, so every
  // later call has to carry it or the backend re-offers the picker it already answered.
  const ownAudienceRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  const loadCampaigns = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await CampaignService.listCampaigns();
      setCampaigns(res.campaigns || []);
    } catch {
      setCampaigns([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadWallet = useCallback(async () => {
    setLoadingWallet(true);
    try {
      setWallet(await CampaignService.getWallet());
    } catch {
      setWallet(null);
    } finally {
      setLoadingWallet(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'manage') loadCampaigns();
    if (tab === 'wallet') loadWallet();
  }, [tab, loadCampaigns, loadWallet]);

  // Only admins get the Billing tab — the backend decides, so there's no email list
  // duplicated here. Runs once on mount.
  useEffect(() => {
    CampaignService.billingAccess()
      .then(setIsAdmin)
      .catch(() => setIsAdmin(false));
  }, []);

  // On mount, load the brand's campaign threads (the rail) and reopen the most recent —
  // so a reload lands back in the last conversation rather than a blank greeting. If the
  // brand has no threads yet, we leave the greeting and create one lazily on first send.
  // Skipped when a video hand-off is resuming (below): that effect owns which thread
  // opens in that case, and racing both against each other let this one silently win
  // and clobber the resumed thread back to whatever was most recently touched.
  useEffect(() => {
    (async () => {
      try {
        const list = await CampaignService.listThreads();
        setThreads(list);
        if (list.length && !pendingResumeVideo) await openThread(list[0].thread_id);
      } catch {
        /* start fresh */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fire-and-forget save — the chat must keep working locally even if this fails. Every
  // message is tagged with the active thread (Tier E) so it lands in the right conversation.
  const saveMsg = (msg: ChatMsg) => {
    const thread_id = activeThreadRef.current || undefined;
    CampaignService.saveChatMessage(
      msg.role === 'user'
        ? { message_id: msg.id, role: 'user', kind: 'text', text: msg.text, thread_id }
        : msg.kind === 'result'
          ? { message_id: msg.id, role: 'jane', kind: 'result', result: msg.result, thread_id }
          : { message_id: msg.id, role: 'jane', kind: 'text', text: msg.text, thread_id }
    ).catch(() => {
      /* best-effort */
    });
  };

  // ── Threads (Tier E) ────────────────────────────────────────────────────────
  const selectThreadId = (id: string | null) => {
    activeThreadRef.current = id;
    setActiveThreadId(id);
  };

  const refreshThreads = useCallback(async () => {
    setThreads(await CampaignService.listThreads());
  }, []);

  // A thread must exist before the first message is saved against it — created lazily so
  // '+ New' and a plain first message both work without leaving empty threads lying around.
  const ensureThread = async (): Promise<string> => {
    if (activeThreadRef.current) return activeThreadRef.current;
    const t = await CampaignService.createThread();
    selectThreadId(t.thread_id);
    setThreads((prev) => [t, ...prev]);
    return t.thread_id;
  };

  // Open a thread: load its saved messages into the chat, oldest first, after the greeting.
  // Returns the rebuilt brief — callers that need to act on it immediately (the video
  // hand-off resume below) can't rely on reading `briefSoFar` right after awaiting this:
  // that state update from setBriefSoFar hasn't flushed yet, so continueWithSource would
  // still see whatever briefSoFar was BEFORE this call (empty, on a fresh mount) via its
  // stale closure — silently no-opping since it bails out on an empty brief.
  const openThread = useCallback(async (threadId: string): Promise<string> => {
    selectThreadId(threadId);
    setMedia(null);
    setBriefSoFar('');
    lastCreativeRef.current = '';
    creativeChoiceRef.current = null;
    chosenVariantRef.current = null;
    ownAudienceRef.current = null;
    setMessages([makeGreeting()]);
    let rebuiltBrief = '';
    try {
      const saved = await CampaignService.getThreadHistory(threadId);
      if (saved.length) {
        // Carry the last plan's image forward so a refinement after reopening reuses it.
        const lastWithImage = [...saved].reverse().find((s) => s.result?.creative?.image_url);
        if (lastWithImage?.result?.creative?.image_url)
          lastCreativeRef.current = lastWithImage.result.creative.image_url;
        setMessages([
          makeGreeting(),
          ...saved.map(
            (s): ChatMsg =>
              s.kind === 'result'
                ? { id: s.message_id, role: 'jane', kind: 'result', result: s.result as LaunchFromMessageResult }
                : s.role === 'user'
                  ? { id: s.message_id, role: 'user', text: s.text }
                  : { id: s.message_id, role: 'jane', kind: 'text', text: s.text }
          ),
        ]);
        // Rebuild the accumulated brief the same way send() does — user turns since the
        // last resolved plan/launch — so a follow-up carries the full picture.
        // Only a real launch ends a campaign's brief; a shown plan does not (refinements
        // can still follow), so accumulate user turns since the last LAUNCH, not the last plan.
        const lastResolved = saved.map((s) => s.kind === 'result' && s.result?.stage === 'launched').lastIndexOf(true);
        const sinceResolved = saved.slice(lastResolved + 1).filter((s) => s.role === 'user');
        if (sinceResolved.length) {
          rebuiltBrief = sinceResolved.map((s) => s.text).join('. ');
          setBriefSoFar(rebuiltBrief);
        }
      }
    } catch {
      /* couldn't load — just the greeting */
    }
    return rebuiltBrief;
  }, []);

  // '+ New' — start a fresh campaign thread and a clean chat.
  const startNewThread = async () => {
    setMedia(null);
    setBriefSoFar('');
    lastCreativeRef.current = '';
    creativeChoiceRef.current = null;
    chosenVariantRef.current = null;
    ownAudienceRef.current = null;
    setMessages([makeGreeting()]);
    try {
      const t = await CampaignService.createThread();
      selectThreadId(t.thread_id);
      setThreads((prev) => [t, ...prev]);
    } catch {
      selectThreadId(null);
    }
  };

  // Duplicate a launched campaign into a fresh draft thread, then auto-send its rebuilt
  // brief so Jane re-plans it — the user just tweaks and relaunches.
  const duplicateThread = async (threadId: string) => {
    try {
      const { thread, seed_message } = await CampaignService.duplicateThread(threadId);
      selectThreadId(thread.thread_id);
      setThreads((prev) => [thread, ...prev]);
      setMedia(null);
      setBriefSoFar('');
      chosenVariantRef.current = null;
      ownAudienceRef.current = null;
      setMessages([makeGreeting()]);
      await send(seed_message);
    } catch (e) {
      ToastService.showToast(extractErrorMessage(e, 'Could not duplicate that campaign.'), ToastTypeEnum.Error);
    }
  };

  // Remove a conversation from the rail. Never touches the actual launched campaign
  // (that stays in 'My Campaigns' regardless) — this only clears chat clutter.
  const deleteThread = async (threadId: string) => {
    try {
      await CampaignService.deleteThread(threadId);
      setThreads((prev) => prev.filter((t) => t.thread_id !== threadId));
      if (activeThreadRef.current === threadId) {
        selectThreadId(null);
        setMedia(null);
        setBriefSoFar('');
        lastCreativeRef.current = '';
        creativeChoiceRef.current = null;
        chosenVariantRef.current = null;
        ownAudienceRef.current = null;
        setMessages([makeGreeting()]);
      }
    } catch (e) {
      ToastService.showToast(extractErrorMessage(e, 'Could not delete that conversation.'), ToastTypeEnum.Error);
    }
  };

  // Returning from a Squad checkout: the callback lands here with ?reference=<ref>.
  // Verify it (credits the wallet idempotently), tell the user, and jump to the
  // wallet tab so they see the new balance. Runs once on mount.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get('reference');
    if (!reference) return;
    // Strip the ref from the URL so a refresh doesn't re-verify.
    window.history.replaceState({}, document.title, window.location.pathname + '?tab=campaigns');
    (async () => {
      try {
        const res = await CampaignService.verifyTopup(reference);
        if (res.status === 'completed') {
          ToastService.showToast('Wallet topped up successfully.', ToastTypeEnum.Success);
        } else {
          ToastService.showToast(
            "We couldn't confirm that payment. If you were charged, it'll reflect shortly.",
            ToastTypeEnum.Error
          );
        }
      } catch {
        ToastService.showToast(
          "We couldn't confirm that payment. If you were charged, it'll reflect shortly.",
          ToastTypeEnum.Error
        );
      } finally {
        setTab('wallet');
        loadWallet();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || busy) return;
    if (override == null) setInput('');
    const attachedMedia = media;
    // The backend parses each call fresh, with no memory of earlier turns — so a
    // follow-up like "use this draft" (no budget) would otherwise loop forever
    // asking for the same thing. Send the whole brief-so-far each time so Jane
    // has the full picture; it resets once a campaign actually launches.
    const combinedMessage = briefSoFar ? `${briefSoFar}. ${text}` : text;
    setBusy(true);
    const threadId = await ensureThread();
    const userMsg: ChatMsg = { id: uid(), role: 'user', text };
    setMessages((m) => [...m, userMsg]);
    saveMsg(userMsg);
    try {
      const result = await CampaignService.planFromMessage({
        message: combinedMessage,
        thread_id: threadId,
        // Keep the already-chosen audience attached to every follow-up, so typing a
        // reply refines THIS campaign instead of re-opening the audience question.
        ...(chosenVariantRef.current
          ? {
              selected_plan_variant: chosenVariantRef.current.variant,
              variant_group_id: chosenVariantRef.current.variantGroupId,
            }
          : {}),
        // Same reason as the variant above: the client's own audience IS their answer
        // to the picker, so it has to ride along or the backend re-asks.
        ...(ownAudienceRef.current ? { target_audience: ownAudienceRef.current } : {}),
        ...(attachedMedia?.source === 'upload'
          ? { creative_source: 'upload', reference_image_url: attachedMedia.url, is_video: attachedMedia.isVideo }
          : attachedMedia?.source === 'draft'
            ? { creative_source: 'draft', draft_id: attachedMedia.draftId }
            : // No media attached. If a plan already produced an image, this is a refinement →
              // reuse it (no regen/credit). Else honor an already-picked source. Else ASK (Jane
              // offers upload / past post / generate) instead of silently auto-generating.
              lastCreativeRef.current
              ? { reuse_image_url: lastCreativeRef.current }
              : { creative_source: creativeChoiceRef.current ?? ('ask' as const) }),
      });
      const resultMsg: ChatMsg = { id: uid(), role: 'jane', kind: 'result', result };
      setMessages((m) => [...m, resultMsg]);
      saveMsg(resultMsg);
      if (result.creative?.image_url) lastCreativeRef.current = result.creative.image_url;
      // Keep the accumulated brief through the WHOLE campaign — including after a plan is
      // shown — so a follow-up like "target lagos and abuja" refines THIS campaign instead
      // of being parsed with no context (which made Jane re-ask the objective and drop the
      // geo). Only a real launch (or "+ New") starts a fresh brief.
      setBriefSoFar(combinedMessage);
      refreshThreads(); // title/status/preview may have changed
    } catch (e) {
      // Show the backend's message as-is — it's already a full, user-friendly
      // sentence (e.g. the "we're experiencing some difficulties, try again later"
      // shown when the AI is unreachable). No "Sorry," prefix, which read awkwardly
      // in front of a complete sentence.
      const msg = extractErrorMessage(e, "We're experiencing some difficulties — please try again in a little while.");
      const errMsg: ChatMsg = { id: uid(), role: 'jane', kind: 'text', text: msg };
      setMessages((m) => [...m, errMsg]);
      saveMsg(errMsg);
    } finally {
      setBusy(false);
    }
  };

  // Answer the need_whatsapp step: send the brand's WhatsApp number (stored server-side
  // for reuse) and continue building the plan. Kept separate from send() because the
  // number is a distinct field, not another line of the campaign brief.
  const submitWhatsapp = async (number: string) => {
    const clean = number.trim();
    if (!clean || busy) return;
    setBusy(true);
    const threadId = await ensureThread();
    const userMsg: ChatMsg = { id: uid(), role: 'user', text: clean };
    setMessages((m) => [...m, userMsg]);
    saveMsg(userMsg);
    try {
      const attachedMedia = media;
      const result = await CampaignService.planFromMessage({
        message: briefSoFar || clean,
        whatsapp_number: clean,
        thread_id: threadId,
        ...(attachedMedia?.source === 'upload'
          ? { creative_source: 'upload', reference_image_url: attachedMedia.url, is_video: attachedMedia.isVideo }
          : attachedMedia?.source === 'draft'
            ? { creative_source: 'draft', draft_id: attachedMedia.draftId }
            : {}),
      });
      const resultMsg: ChatMsg = { id: uid(), role: 'jane', kind: 'result', result };
      setMessages((m) => [...m, resultMsg]);
      saveMsg(resultMsg);
      if (result.creative?.image_url) lastCreativeRef.current = result.creative.image_url;
      // Keep the brief (the campaign context) intact — a plan isn't the end of the
      // conversation, refinements can still follow. Only a launch/​+New resets it.
      refreshThreads();
    } catch (e) {
      const msg = extractErrorMessage(e, "We're experiencing some difficulties — please try again in a little while.");
      const errMsg: ChatMsg = { id: uid(), role: 'jane', kind: 'text', text: msg };
      setMessages((m) => [...m, errMsg]);
      saveMsg(errMsg);
    } finally {
      setBusy(false);
    }
  };

  // Answer a meta_connection_ads_no_whatsapp prompt: save the brand's WhatsApp number,
  // then re-run the SAME brief — no new user bubble, so this reads as "progress not
  // restart," rather than answering a fresh question.
  const submitMetaConnectionWhatsapp = async (number: string) => {
    const clean = number.trim();
    if (!clean || busy || !briefSoFar) return;
    setBusy(true);
    try {
      // Saves to the brand's own settings — the SAME place the launch path reads the
      // number from (resolve_ads_page_for_launch -> get_brand_whatsapp). This used to
      // call setMetaConnectionWhatsapp, which writes to the per-brand Meta *connection*
      // row; since every brand now launches from URI's shared Page, most brands have no
      // such row, so saving here just 409'd with meta_connection_none and the number
      // never reached the launch at all. Live-reported.
      await CampaignService.setWhatsapp(clean);
      const result = await CampaignService.planFromMessage({
        message: briefSoFar,
        thread_id: activeThreadRef.current ?? undefined,
      });
      const resultMsg: ChatMsg = { id: uid(), role: 'jane', kind: 'result', result };
      setMessages((m) => [...m, resultMsg]);
      saveMsg(resultMsg);
      refreshThreads();
    } catch (e) {
      const msg = extractErrorMessage(e, "That number didn't save — please try again.");
      const errMsg: ChatMsg = { id: uid(), role: 'jane', kind: 'text', text: msg };
      setMessages((m) => [...m, errMsg]);
      saveMsg(errMsg);
    } finally {
      setBusy(false);
    }
  };

  // Continue building the plan once the user picks how to source the image from the
  // choose-creative-source card. Reuses the accumulated brief (no new user bubble) and
  // re-runs the plan with a concrete source, so the image/caption step finally runs.
  //
  // Multi-Plan Audience Variants: if pendingVariantsRef is set — the user picked one
  // or more audience variants and this source choice is answering "how should Jane
  // make the image for them" — fan out to ONE independent build PER pending variant
  // using this same chosen source (spec §7 "one creative per plan"), instead of a
  // single call. Live-caught 2026-08-04: continueWithVariants used to skip this
  // ask entirely and silently auto-generate, dropping the upload/draft choice.
  const continueWithSource = async (
    choice:
      | { creative_source: 'generate' }
      | { creative_source: 'upload'; reference_image_url: string; is_video: boolean }
      | { creative_source: 'draft'; draft_id: string }
      // Recomposite (creative brief spec §7.2): the real product photo, background
      // regenerated around it via the same content-engine pipeline organic posts
      // use — image-only, no is_video (the backend has no video recomposite path).
      | { creative_source: 'recomposite'; reference_image_url: string },
    // Explicit override for callers that just rebuilt the brief via openThread's
    // return value and can't wait for that setBriefSoFar to flush into a re-render —
    // reading the briefSoFar closure here would still see its pre-openThread value.
    briefOverride?: string
  ) => {
    const brief = briefOverride ?? briefSoFar;
    if (busy || !brief) return;
    creativeChoiceRef.current = choice.creative_source;
    const pendingVariants = pendingVariantsRef.current;
    pendingVariantsRef.current = null;
    setBusy(true);
    try {
      const variants = pendingVariants ? pendingVariants.variants : [null];
      for (const variant of variants) {
        const result = await CampaignService.planFromMessage({
          message: brief,
          thread_id: activeThreadRef.current ?? undefined,
          ...(variant ? { selected_plan_variant: variant, variant_group_id: pendingVariants!.variantGroupId } : {}),
          ...choice,
        });
        const resultMsg: ChatMsg = { id: uid(), role: 'jane', kind: 'result', result };
        setMessages((m) => [...m, resultMsg]);
        saveMsg(resultMsg);
        // Remember the produced image so later typed refinements reuse it (no regen/credit).
        if (result.creative?.image_url) lastCreativeRef.current = result.creative.image_url;
      }
      refreshThreads();
    } catch (e) {
      const msg = extractErrorMessage(e, "We're experiencing some difficulties — please try again in a little while.");
      const errMsg: ChatMsg = { id: uid(), role: 'jane', kind: 'text', text: msg };
      setMessages((m) => [...m, errMsg]);
      saveMsg(errMsg);
    } finally {
      setBusy(false);
    }
  };

  // Answer a choose_destination prompt: tell the backend where this ad should send
  // people, then re-run the SAME brief — no new user bubble, so this reads as
  // "progress not restart". The backend saves the answer as the brand's destination,
  // so every later call in this build (and the next campaign) resolves it from storage
  // and the picker doesn't reappear.
  const continueWithDestination = async (answer: {
    destination_type: string;
    destination_value: string;
    destination_cta: string;
  }) => {
    if (busy || !briefSoFar) return;
    setBusy(true);
    try {
      const result = await CampaignService.planFromMessage({
        message: briefSoFar,
        thread_id: activeThreadRef.current ?? undefined,
        creative_source: 'ask',
        // Carry the audience choice, exactly as continueWithSource does — without it
        // the backend has no way to know one was made and regenerates the whole
        // variant set, dropping the user back to "pick an audience".
        ...(chosenVariantRef.current
          ? {
              selected_plan_variant: chosenVariantRef.current.variant,
              variant_group_id: chosenVariantRef.current.variantGroupId,
            }
          : {}),
        // Same reason as the variant above: the client's own audience IS their answer
        // to the picker, so it has to ride along or the backend re-asks.
        ...(ownAudienceRef.current ? { target_audience: ownAudienceRef.current } : {}),
        ...answer,
      } as Parameters<typeof CampaignService.planFromMessage>[0]);
      const resultMsg: ChatMsg = { id: uid(), role: 'jane', kind: 'result', result };
      setMessages((m) => [...m, resultMsg]);
      saveMsg(resultMsg);
      refreshThreads();
    } catch (e) {
      const msg = extractErrorMessage(e, "That didn't save — please try again.");
      const errMsg: ChatMsg = { id: uid(), role: 'jane', kind: 'text', text: msg };
      setMessages((m) => [...m, errMsg]);
      saveMsg(errMsg);
    } finally {
      setBusy(false);
    }
  };

  // Multi-Plan Audience Variants — the client picked one or more ranked audience
  // strategies from a choose_plan_variant card set. Ask how to source the image for
  // them, same as every other path gets (upload / past post / let Jane generate) —
  // continueWithSource fans this one choice out to every pending variant once the
  // user answers.
  const continueWithVariants = async (variants: PlanVariant[], variantGroupId: string) => {
    if (busy || !briefSoFar || variants.length === 0) return;
    pendingVariantsRef.current = { variants, variantGroupId };
    // Remember the choice for the REST of the campaign, so a typed reply after this
    // point never drops back to "pick an audience" (see chosenVariantRef above).
    chosenVariantRef.current = { variant: variants[0], variantGroupId };
    setBusy(true);
    try {
      // Live-reported bug: this call omitted selected_plan_variant entirely, so the
      // backend had no way to know a choice had already been made — it just
      // regenerated a fresh set of audience variants again instead of asking about
      // the image source, making "Build this ad" look like it did nothing but repeat
      // the original message. Only the FIRST selected variant is needed here (just
      // to signal "a choice was made" and skip regeneration) — continueWithSource
      // below still builds each pending variant with its own correct data.
      const result = await CampaignService.planFromMessage({
        message: briefSoFar,
        thread_id: activeThreadRef.current ?? undefined,
        creative_source: 'ask',
        selected_plan_variant: variants[0],
        variant_group_id: variantGroupId,
      });
      const resultMsg: ChatMsg = { id: uid(), role: 'jane', kind: 'result', result };
      setMessages((m) => [...m, resultMsg]);
      saveMsg(resultMsg);
    } catch (e) {
      pendingVariantsRef.current = null;
      const msg = extractErrorMessage(e, "We're experiencing some difficulties — please try again in a little while.");
      const errMsg: ChatMsg = { id: uid(), role: 'jane', kind: 'text', text: msg };
      setMessages((m) => [...m, errMsg]);
      saveMsg(errMsg);
    } finally {
      setBusy(false);
    }
  };

  // "None of these — describe your own audience": the client knows their customers
  // better than any generated variant does. Same shape as continueWithVariants, but the
  // choice is their sentence rather than a card — the backend treats it as having
  // chosen (so the picker isn't re-presented) and it outranks both the variants and the
  // brand profile for the Meta targeting AND the ad's own copy.
  const continueWithOwnAudience = async (text: string) => {
    const audience = text.trim();
    if (busy || !briefSoFar || !audience) return;
    ownAudienceRef.current = audience;
    // No variant was chosen, so nothing should keep claiming one was.
    chosenVariantRef.current = null;
    pendingVariantsRef.current = null;
    setBusy(true);
    try {
      const result = await CampaignService.planFromMessage({
        message: briefSoFar,
        thread_id: activeThreadRef.current ?? undefined,
        creative_source: 'ask',
        target_audience: audience,
      });
      const resultMsg: ChatMsg = { id: uid(), role: 'jane', kind: 'result', result };
      setMessages((m) => [...m, resultMsg]);
      saveMsg(resultMsg);
    } catch (e) {
      ownAudienceRef.current = null;
      const msg = extractErrorMessage(e, "We're experiencing some difficulties — please try again in a little while.");
      const errMsg: ChatMsg = { id: uid(), role: 'jane', kind: 'text', text: msg };
      setMessages((m) => [...m, errMsg]);
      saveMsg(errMsg);
    } finally {
      setBusy(false);
    }
  };

  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    const forChoice = uploadForChoiceRef.current;
    uploadForChoiceRef.current = false;
    if (!file) return;
    setUploadError('');
    setUploading(true);
    setDraftsOpen(false);
    try {
      const { url, is_video } = await CampaignService.uploadMedia(file);
      if (forChoice === 'recomposite') {
        // Recomposite is image-only — the content engine's product-preservation
        // pipeline has no video path.
        if (is_video) {
          setUploadError('Recompositing works with a photo, not a video — please choose an image.');
          return;
        }
        await continueWithSource({ creative_source: 'recomposite', reference_image_url: url });
      } else if (is_video && onRequestVideoPolish) {
        // Ask before committing to this video — Video Polish (upscale/stabilise/
        // captions) is one redirect away, and most raw phone footage benefits from
        // it. "Use as-is" below falls through to exactly what used to happen here.
        setPendingVideoQualityCheck({ file, url, forChoice: forChoice === 'upload' ? 'upload' : false });
      } else if (forChoice === 'upload') {
        // Came from the choose card — go straight on with the plan using this upload.
        await continueWithSource({ creative_source: 'upload', reference_image_url: url, is_video });
      } else {
        setMedia({ source: 'upload', url, isVideo: is_video, label: file.name });
      }
    } catch {
      setUploadError('Upload failed, please try again.');
    } finally {
      setUploading(false);
    }
  };

  // "Use as-is" on the improve-quality prompt — exactly what would have happened
  // before this feature existed.
  const dismissVideoQualityCheck = async () => {
    const pending = pendingVideoQualityCheck;
    if (!pending) return;
    setPendingVideoQualityCheck(null);
    if (pending.forChoice === 'upload') {
      await continueWithSource({ creative_source: 'upload', reference_image_url: pending.url, is_video: true });
    } else {
      setMedia({ source: 'upload', url: pending.url, isVideo: true, label: pending.file.name });
    }
  };

  // "Improve it" — hand the raw file off to the parent (Video Polish needs a fresh
  // upload, not a URL) and remember which thread to come back to. The parent
  // switches pages; this component just waits for pendingResumeVideo below.
  // Live-reported bug: this component unmounts for the hand-off (a fresh
  // CampaignsPage instance mounts on return, wiping pendingVariantsRef) — if the
  // client had already picked an audience plan before uploading the video, that
  // choice was silently lost and the resumed build came back with NO
  // selected_plan_variant, which the backend reads as "nothing chosen yet" and
  // answers by generating a fresh set of plans instead of building the ad with the
  // video — pass the pending variants through explicitly so they survive the
  // remount, same as the brief already does.
  const requestVideoPolishForPending = async () => {
    const pending = pendingVideoQualityCheck;
    if (!pending || !onRequestVideoPolish) return;
    setPendingVideoQualityCheck(null);
    const threadId = await ensureThread();
    onRequestVideoPolish(pending.file, threadId, pendingVariantsRef.current ?? undefined);
  };

  // Coming back from Video Polish with a finished clip — resume the exact thread
  // it was requested from and continue exactly as a normal video upload would,
  // now that the client has actually chosen to use this result.
  useEffect(() => {
    if (!pendingResumeVideo) return;
    (async () => {
      // openThread's setBriefSoFar hasn't flushed to a re-render yet at this point —
      // continueWithSource would still read the pre-openThread (empty, on a fresh
      // mount) briefSoFar via its stale closure and silently no-op. Use openThread's
      // returned brief explicitly instead.
      const brief = await openThread(pendingResumeVideo.threadId);
      // openThread just reset both refs above — restore the pre-hand-off audience
      // choice, if there was one, before continueWithSource reads pendingVariantsRef.
      if (pendingResumeVideo.pendingVariants) {
        pendingVariantsRef.current = pendingResumeVideo.pendingVariants;
        chosenVariantRef.current = {
          variant: pendingResumeVideo.pendingVariants.variants[0],
          variantGroupId: pendingResumeVideo.pendingVariants.variantGroupId,
        };
      }
      await continueWithSource(
        {
          creative_source: 'upload',
          reference_image_url: pendingResumeVideo.url,
          is_video: true,
        },
        brief
      );
      onResumeVideoConsumed?.();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingResumeVideo]);

  const openDrafts = async () => {
    setDraftsOpen((v) => !v);
    if (draftsOpen || drafts.length) return;
    setLoadingDrafts(true);
    try {
      const res = await CampaignService.listDrafts();
      setDrafts((res.drafts || []).filter((d) => d.image_url));
    } catch {
      setDrafts([]);
    } finally {
      setLoadingDrafts(false);
    }
  };

  const pickDraft = (d: DraftSummary) => {
    setMedia({ source: 'draft', url: d.image_url, isVideo: false, draftId: d.draft_id, label: d.content || 'Draft' });
    setDraftsOpen(false);
  };

  // Lets a plan-review card (still "planned") turn into a launch confirmation
  // ("launched") in place, once the user confirms and it actually goes live.
  const updateResultMessage = (id: string, result: LaunchFromMessageResult) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id && msg.role === 'jane' && msg.kind === 'result' ? { ...msg, result } : msg))
    );
    // Same message_id — the backend upserts, so this replaces the saved "planned"
    // row with "launched" in place rather than creating a second saved message.
    saveMsg({ id, role: 'jane', kind: 'result', result });
  };

  // The newest result card is the only live one. Everything above it is a question
  // Jane has already moved past, and a stale card's buttons must not fire — see the
  // `stale` prop below.
  let lastResultIndex = -1;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];
    if (msg.role === 'jane' && msg.kind === 'result') {
      lastResultIndex = i;
      break;
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        fontFamily: 'var(--wf, Urbanist, sans-serif)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: isMobile ? '12px 12px 0' : '16px 24px 0',
          display: 'flex',
          alignItems: isMobile ? 'stretch' : 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 10 : 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isMobile && tab === 'chat' && (
            <button
              onClick={() => setRailOpen(true)}
              aria-label="Open campaign threads"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                flexShrink: 0,
                border: '1px solid #e0dcd9',
                borderRadius: 9,
                background: '#fff',
                color: '#555',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 15, lineHeight: 1 }}>☰</span>
            </button>
          )}
          <h1 style={{ fontSize: isMobile ? 18 : 20, fontWeight: 800, color: '#1a0a12', margin: 0 }}>Campaigns</h1>
        </div>
        <div
          className={isMobile ? 'tab-scroll' : undefined}
          style={{
            marginLeft: isMobile ? undefined : 'auto',
            display: 'flex',
            gap: 4,
            background: '#f4f2f0',
            padding: 3,
            borderRadius: 10,
            ...(isMobile ? ({ overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' } as const) : {}),
          }}
        >
          {(
            [
              ['chat', 'Create with Jane'],
              ['manage', 'My Campaigns'],
              ['wallet', 'Wallet'],
              ...(isAdmin ? [['billing', 'Revenue'] as const] : []),
            ] as const
          ).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: isMobile ? '8px 14px' : '7px 16px',
                border: 'none',
                borderRadius: 8,
                flexShrink: 0,
                whiteSpace: 'nowrap',
                background: tab === t ? '#fff' : 'transparent',
                color: tab === t ? PINK : '#888',
                fontWeight: tab === t ? 700 : 500,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'chat' ? (
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <ThreadRail
            threads={threads}
            activeThreadId={activeThreadId}
            busy={busy}
            isMobile={isMobile}
            open={railOpen}
            onClose={() => setRailOpen(false)}
            onSelect={(id) => {
              openThread(id);
              setRailOpen(false);
            }}
            onNew={() => {
              startNewThread();
              setRailOpen(false);
            }}
            onDuplicate={duplicateThread}
            onDelete={deleteThread}
          />
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <div ref={scrollRef} className="camp-pane" style={{ flex: 1, overflowY: 'auto', padding: '18px 24px' }}>
              {messages.map((m, i) => (
                <div key={m.id} style={{ marginBottom: 16 }}>
                  {m.role === 'user' ? (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <div
                        style={{
                          maxWidth: 520,
                          padding: '11px 16px',
                          borderRadius: '14px 3px 14px 14px',
                          background: '#1a0a12',
                          color: '#f3d0df',
                          fontSize: 13,
                          lineHeight: 1.6,
                        }}
                      >
                        {m.text}
                      </div>
                    </div>
                  ) : m.kind === 'text' ? (
                    <JaneBubble>{m.text}</JaneBubble>
                  ) : (
                    <ResultCard
                      result={m.result}
                      // A question Jane already moved past is history: readable, but its
                      // buttons must not fire. Live-reported: a rejected link left TWO
                      // destination pickers on screen, the stale one still holding the bad
                      // value and still submittable. Only the newest result card is live.
                      stale={i !== lastResultIndex}
                      onResultChange={(r) => updateResultMessage(m.id, r)}
                      onLaunched={() => {
                        // Campaign is live — this brief is done. Clear it so the next message
                        // starts a fresh campaign instead of appending to the launched one.
                        setBriefSoFar('');
                        setMedia(null);
                        lastCreativeRef.current = '';
                        creativeChoiceRef.current = null;
                        chosenVariantRef.current = null;
                        ownAudienceRef.current = null;
                        loadCampaigns();
                        refreshThreads();
                      }}
                      onQuickReply={(text) => send(text)}
                      onTopUp={() => setTab('wallet')}
                      onSubmitWhatsapp={submitWhatsapp}
                      onSubmitMetaConnectionWhatsapp={submitMetaConnectionWhatsapp}
                      onChooseGenerate={() => continueWithSource({ creative_source: 'generate' })}
                      onChooseUpload={() => {
                        uploadForChoiceRef.current = 'upload';
                        fileInputRef.current?.click();
                      }}
                      onChooseRecomposite={() => {
                        uploadForChoiceRef.current = 'recomposite';
                        fileInputRef.current?.click();
                      }}
                      onChooseDraft={(draftId) => continueWithSource({ creative_source: 'draft', draft_id: draftId })}
                      onChooseVariants={(variants, groupId) => continueWithVariants(variants, groupId)}
                      onChooseOwnAudience={(audience) => continueWithOwnAudience(audience)}
                      onChooseDestination={continueWithDestination}
                    />
                  )}
                </div>
              ))}
              {/* Quick-start goal chips — only before the conversation gets going, so a
                new user doesn't have to think of a phrasing from scratch. */}
              {messages.length === 1 && !busy && (
                <QuickReplyChips
                  chips={GOAL_STARTER_CHIPS}
                  onPick={(text) => setInput((prev) => (prev ? prev : text))}
                />
              )}
              {busy && (
                <JaneBubble>
                  <TypingDots />
                </JaneBubble>
              )}
              {pendingVideoQualityCheck && (
                <div>
                  <JaneBubble>Want to improve this video&apos;s quality before using it?</JaneBubble>
                  <div
                    className="camp-indent"
                    style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, marginLeft: 40 }}
                  >
                    <button
                      onClick={requestVideoPolishForPending}
                      style={{
                        background: `linear-gradient(135deg,${PINK},#8E1545)`,
                        border: 'none',
                        color: '#fff',
                        borderRadius: 12,
                        padding: '10px 14px',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      ✨ Improve it
                    </button>
                    <button
                      onClick={dismissVideoQualityCheck}
                      style={{
                        background: '#fff',
                        border: `1.5px solid ${PINK}`,
                        color: PINK,
                        borderRadius: 12,
                        padding: '10px 14px',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Use as-is
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div
              style={{
                padding: isMobile ? '10px 12px 14px' : '12px 24px 20px',
                borderTop: '1px solid #eee',
                background: '#fff',
                position: 'relative',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,video/mp4,video/quicktime,video/webm"
                style={{ display: 'none' }}
                onChange={handleFileChosen}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={busy || uploading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#f6f5f3',
                    border: '1px solid #e0dcd9',
                    borderRadius: 20,
                    padding: '6px 12px',
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: '#555',
                    cursor: busy || uploading ? 'default' : 'pointer',
                  }}
                >
                  📎 {uploading ? 'Uploading…' : 'Upload photo/video'}
                </button>
                <button
                  onClick={openDrafts}
                  disabled={busy}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#f6f5f3',
                    border: '1px solid #e0dcd9',
                    borderRadius: 20,
                    padding: '6px 12px',
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: '#555',
                    cursor: busy ? 'default' : 'pointer',
                  }}
                >
                  🖼 Choose from drafts
                </button>
                {media && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#fce4ec',
                      border: '1px solid #f5c2d8',
                      borderRadius: 20,
                      padding: '4px 6px 4px 4px',
                    }}
                  >
                    {media.isVideo || !media.url ? (
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: '#eee',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                        }}
                      >
                        {media.isVideo ? '▶' : '🖼'}
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={media.url}
                        alt=""
                        style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
                      />
                    )}
                    <span
                      style={{
                        fontSize: 12,
                        color: PINK,
                        fontWeight: 600,
                        maxWidth: 140,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {media.source === 'draft' ? 'From drafts' : media.label}
                    </span>
                    <button
                      onClick={() => setMedia(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: PINK,
                        cursor: 'pointer',
                        fontSize: 13,
                        padding: '0 4px',
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
              {uploadError && <p style={{ margin: '0 0 8px', fontSize: 12, color: '#c62828' }}>{uploadError}</p>}
              {draftsOpen && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: isMobile ? 12 : 24,
                    marginBottom: 8,
                    width: isMobile ? 'calc(100vw - 40px)' : 320,
                    maxHeight: 320,
                    overflowY: 'auto',
                    background: '#fff',
                    border: '1px solid #e0dcd9',
                    borderRadius: 12,
                    boxShadow: '0 8px 24px rgba(0,0,0,.12)',
                    zIndex: 10,
                    padding: 8,
                  }}
                >
                  {loadingDrafts ? (
                    <p style={{ margin: 8, fontSize: 13, color: '#aaa' }}>Loading…</p>
                  ) : drafts.length === 0 ? (
                    <p style={{ margin: 8, fontSize: 13, color: '#aaa' }}>No drafts with an image yet.</p>
                  ) : (
                    drafts.map((d) => (
                      <button
                        key={d.draft_id}
                        onClick={() => pickDraft(d)}
                        style={{
                          display: 'flex',
                          gap: 10,
                          alignItems: 'center',
                          width: '100%',
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          borderRadius: 8,
                          padding: 8,
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f6f5f3')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                      >
                        {d.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={d.image_url}
                            alt=""
                            style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                          />
                        ) : (
                          <div
                            style={{ width: 44, height: 44, borderRadius: 8, background: '#f4f2f0', flexShrink: 0 }}
                          />
                        )}
                        <span
                          style={{
                            fontSize: 12.5,
                            color: '#333',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {d.content || d.platform}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Tell Jane what you want to promote…"
                  rows={1}
                  disabled={busy}
                  style={{
                    flex: 1,
                    resize: 'none',
                    border: '1.5px solid #e0dcd9',
                    borderRadius: 12,
                    padding: '11px 14px',
                    fontSize: 14,
                    fontFamily: 'inherit',
                    color: '#111',
                    maxHeight: 120,
                  }}
                />
                <button
                  onClick={() => send()}
                  disabled={busy || !input.trim()}
                  style={{
                    padding: '11px 20px',
                    border: 'none',
                    borderRadius: 12,
                    background: busy || !input.trim() ? '#ddd' : `linear-gradient(135deg,${PINK},#8E1545)`,
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: busy || !input.trim() ? 'default' : 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {busy ? 'Working…' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : tab === 'manage' ? (
        <div className="camp-pane" style={{ flex: 1, overflowY: 'auto', padding: '18px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
            <p style={{ margin: 0, color: '#888', fontSize: 13 }}>
              Campaigns Jane has set up for you. Each is paused until you activate it.
            </p>
            <button
              onClick={loadCampaigns}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: '1px solid #e0dcd9',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 12,
                cursor: 'pointer',
                color: '#555',
              }}
            >
              ↻ Refresh
            </button>
          </div>
          {loadingList ? (
            <p style={{ color: '#aaa', fontSize: 13 }}>Loading…</p>
          ) : campaigns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#aaa' }}>
              <p style={{ fontSize: 14, margin: 0 }}>No campaigns yet.</p>
              <button
                onClick={() => setTab('chat')}
                style={{
                  marginTop: 12,
                  background: PINK,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '9px 18px',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Create one with Jane
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {campaigns.map((c) => (
                <CampaignCard key={c.campaign_id} c={c} onChanged={loadCampaigns} />
              ))}
            </div>
          )}
        </div>
      ) : tab === 'wallet' ? (
        <WalletTab wallet={wallet} loading={loadingWallet} onFunded={loadWallet} />
      ) : (
        <BillingTab />
      )}
    </div>
  );
}

// Tier E — the left rail: a browsable list of the brand's campaign conversations. '+ New'
// starts a fresh one; clicking a thread reopens it; a launched one can be duplicated.
function ThreadRail({
  threads,
  activeThreadId,
  busy,
  isMobile,
  open,
  onClose,
  onSelect,
  onNew,
  onDuplicate,
  onDelete,
}: {
  threads: ThreadSummary[];
  activeThreadId: string | null;
  busy: boolean;
  isMobile: boolean;
  open: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const statusColor: Record<string, string> = { draft: '#999', planned: '#a15c00', launched: '#1a7f37' };

  // On phones the rail would eat most of the screen, so it becomes a slide-over
  // drawer opened from the header instead of a permanent column.
  if (isMobile && !open) return null;

  return (
    <>
      {isMobile && (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.38)', zIndex: 40 }} />
      )}
      <div
        style={{
          width: isMobile ? 'min(82vw, 300px)' : 220,
          flexShrink: 0,
          borderRight: '1px solid #eee',
          display: 'flex',
          flexDirection: 'column',
          background: '#fafafa',
          ...(isMobile
            ? ({
                position: 'fixed',
                top: 0,
                left: 0,
                bottom: 0,
                zIndex: 41,
                boxShadow: '0 0 28px rgba(0,0,0,.18)',
              } as const)
            : {}),
        }}
      >
        {isMobile && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 12px 0',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 800, color: '#1a0a12' }}>Campaign threads</span>
            <button
              onClick={onClose}
              aria-label="Close campaign threads"
              style={{
                border: 'none',
                background: 'none',
                fontSize: 20,
                lineHeight: 1,
                color: '#888',
                cursor: 'pointer',
                padding: 4,
              }}
            >
              ×
            </button>
          </div>
        )}
        <div style={{ padding: '12px 12px 8px' }}>
          <button
            onClick={onNew}
            disabled={busy}
            style={{
              width: '100%',
              background: PINK,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '9px 12px',
              fontSize: 13,
              fontWeight: 700,
              cursor: busy ? 'default' : 'pointer',
            }}
          >
            + New campaign
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 12px' }}>
          {threads.length === 0 ? (
            <p style={{ fontSize: 11.5, color: '#aaa', padding: '8px 6px', lineHeight: 1.5 }}>
              Your campaigns will show up here as you create them.
            </p>
          ) : (
            threads.map((t) => {
              const active = t.thread_id === activeThreadId;
              return (
                <div
                  key={t.thread_id}
                  onClick={() => onSelect(t.thread_id)}
                  style={{
                    padding: '9px 10px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    marginBottom: 4,
                    background: active ? '#fce4ec' : 'transparent',
                    border: active ? `1px solid ${PINK}` : '1px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 8, color: statusColor[t.status] || '#999' }}>●</span>
                    <span
                      style={{
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: '#1a0a12',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                      }}
                    >
                      {t.title || 'New campaign'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          window.confirm(
                            'Delete this conversation? Any launched campaign keeps running — this only removes the chat.'
                          )
                        ) {
                          onDelete(t.thread_id);
                        }
                      }}
                      disabled={busy}
                      aria-label="Delete conversation"
                      title="Delete conversation"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#bbb',
                        fontSize: 14,
                        lineHeight: 1,
                        cursor: busy ? 'default' : 'pointer',
                        padding: '0 2px',
                        flexShrink: 0,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  {t.preview && (
                    <p
                      style={{
                        margin: '2px 0 0 14px',
                        fontSize: 11,
                        color: '#999',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t.preview}
                    </p>
                  )}
                  {t.status === 'launched' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicate(t.thread_id);
                      }}
                      disabled={busy}
                      style={{
                        marginTop: 4,
                        marginLeft: 14,
                        background: 'none',
                        border: 'none',
                        color: PINK,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: busy ? 'default' : 'pointer',
                        padding: 0,
                      }}
                    >
                      ⧉ Duplicate
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

function JaneBubble({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          background: `linear-gradient(135deg,${PINK},#8E1545)`,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: 13,
          flexShrink: 0,
        }}
      >
        J
      </div>
      <div
        style={{
          maxWidth: 560,
          padding: '11px 16px',
          borderRadius: '3px 14px 14px 14px',
          background: '#f6f5f3',
          color: '#333',
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function QuickReplyChips({ chips, onPick }: { chips: string[]; onPick: (text: string) => void }) {
  return (
    <div className="camp-indent" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, marginLeft: 40 }}>
      {chips.map((chip) => (
        <button
          key={chip}
          onClick={() => onPick(chip)}
          style={{
            background: '#fff',
            border: `1.5px solid ${PINK}`,
            color: PINK,
            borderRadius: 20,
            padding: '6px 14px',
            fontSize: 12.5,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {chip}
        </button>
      ))}
    </div>
  );
}

// Where ad leads go: the brand's own WhatsApp number. Anyone who taps the ad opens a
// chat straight with this number, so it must be captured before a plan can be built.
// Tier C/D — Jane's reasoning laid out: every choice + its why, plus estimates. Turns
// the plan card from a black box into "here's what I'm doing and why," like a strategist.
function CampaignReview({ summary }: { summary: CampaignSummary }) {
  const rows: { label: string; rv: { value: string; reason: string } }[] = [
    { label: 'Objective', rv: summary.objective },
    { label: 'Audience', rv: summary.audience },
    { label: 'Platforms', rv: summary.platforms },
    { label: 'Budget', rv: summary.budget_allocation },
    { label: 'Duration', rv: summary.duration },
    { label: 'Optimization', rv: summary.optimization },
  ];
  const e = summary.estimates;
  const audience =
    e.audience_size_low != null && e.audience_size_high != null
      ? `${e.audience_size_low.toLocaleString()}–${e.audience_size_high.toLocaleString()}`
      : null;
  const estItems: { label: string; value: string }[] = [];
  if (audience) estItems.push({ label: 'Audience you could reach', value: audience });
  if (e.estimated_clicks != null)
    // The server names this after the ad's real destination — hard-coding "WhatsApp"
    // here mislabelled the figure on every website/Instagram/custom campaign.
    estItems.push({ label: e.clicks_label || 'Est. clicks', value: `~${e.estimated_clicks.toLocaleString()}` });
  if (e.estimated_leads != null)
    estItems.push({ label: 'Est. leads', value: `~${e.estimated_leads.toLocaleString()}` });
  if (e.cost_per_result_ngn != null)
    estItems.push({ label: 'Est. cost per result', value: naira(e.cost_per_result_ngn) });

  return (
    <div style={{ margin: '0 0 12px', border: '1px solid #eee', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ background: '#faf7f8', padding: '8px 12px', fontSize: 12, fontWeight: 800, color: PINK }}>
        Jane&rsquo;s plan — here&rsquo;s my thinking
      </div>
      <div style={{ padding: '4px 12px' }}>
        {rows.map((r) => (
          <div key={r.label} style={{ padding: '8px 0', borderBottom: '1px solid #f2f0f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <span
                style={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 0.3 }}
              >
                {r.label}
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1a0a12', textAlign: 'right' }}>
                {r.rv.value}
              </span>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: 11.5, color: '#888', lineHeight: 1.45 }}>{r.rv.reason}</p>
          </div>
        ))}
      </div>
      {estItems.length > 0 && (
        <div style={{ padding: '10px 12px', background: '#fbfbfb' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {estItems.map((it) => (
              <div key={it.label} style={{ minWidth: 90 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#1a0a12' }}>{it.value}</div>
                <div style={{ fontSize: 10.5, color: '#999' }}>{it.label}</div>
              </div>
            ))}
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 10.5, color: '#aaa', fontStyle: 'italic' }}>{e.note}</p>
        </div>
      )}
    </div>
  );
}

// The image-source choice Jane offers after budget: upload your own, reuse a past post,
// or let Jane generate one. Rendered inside a Jane bubble so it reads as her asking.
// Where a tap on this ad lands (the choose_destination stage). Asked just BEFORE the
// image step, because the answer changes the ad itself — the button, and the CTA baked
// into the generated image. Every option's copy, placeholder and validation come from
// the backend (destination.py), so this card never drifts from what the server accepts:
// one input box whatever they pick, plus a button picker for any option whose
// `takes_cta` is set (all of them, since WhatsApp stopped using Meta's native button).
function ChooseDestination({
  options,
  ctaChoices,
  selected,
  error,
  onSubmit,
}: {
  options: DestinationOption[];
  ctaChoices: CtaChoice[];
  selected?: { destination_type: string; destination_cta: string };
  error?: string;
  onSubmit: (answer: { destination_type: string; destination_value: string; destination_cta: string }) => void;
}) {
  const [type, setType] = useState(selected?.destination_type || options[0]?.value || 'whatsapp');
  const active = options.find((o) => o.value === type) || options[0];
  // Prefill with what the brand already has for THIS type, so switching options shows
  // their real saved value instead of an empty box they'd have to retype.
  const [value, setValue] = useState(active?.current || '');
  const [cta, setCta] = useState(selected?.destination_cta || 'learn_more');

  const pick = (next: string) => {
    setType(next);
    setValue(options.find((o) => o.value === next)?.current || '');
  };
  // A blank input is allowed only when the brand already has a value saved for this
  // type — that's "keep what I have, just change the button".
  const canSubmit = Boolean(value.trim() || active?.current);
  const submit = () => {
    if (canSubmit) onSubmit({ destination_type: type, destination_value: value.trim(), destination_cta: cta });
  };

  const optionBtn = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
    background: isActive ? PINK : '#fff',
    border: `1.5px solid ${PINK}`,
    color: isActive ? '#fff' : PINK,
    borderRadius: 12,
    padding: '10px 14px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    textAlign: 'left',
  });
  const sub = (isActive: boolean): React.CSSProperties => ({
    fontSize: 11,
    fontWeight: 500,
    color: isActive ? 'rgba(255,255,255,0.85)' : '#a06',
    opacity: isActive ? 1 : 0.85,
  });

  return (
    <div>
      <JaneBubble>Where should people who tap your ad end up?</JaneBubble>
      <div className="camp-indent" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, marginLeft: 40 }}>
        {options.map((opt) => (
          <button key={opt.value} onClick={() => pick(opt.value)} style={optionBtn(opt.value === type)}>
            {opt.label}
            <span style={sub(opt.value === type)}>{opt.hint}</span>
          </button>
        ))}
      </div>

      {active && (
        <div className="camp-indent" style={{ marginTop: 10, marginLeft: 40, maxWidth: 420 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#666', marginBottom: 4 }}>
            {active.input_label}
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder={active.placeholder}
              aria-label={active.input_label}
              inputMode={active.value === 'whatsapp' ? 'tel' : 'url'}
              style={{
                flex: 1,
                border: '1.5px solid #e0dcd9',
                borderRadius: 20,
                padding: '8px 14px',
                fontSize: 13,
                outline: 'none',
              }}
            />
            <button
              onClick={submit}
              disabled={!canSubmit}
              style={{
                background: PINK,
                border: 'none',
                color: '#fff',
                borderRadius: 20,
                padding: '8px 18px',
                fontSize: 13,
                fontWeight: 700,
                cursor: canSubmit ? 'pointer' : 'default',
                opacity: canSubmit ? 1 : 0.5,
              }}
            >
              Use this
            </button>
          </div>

          {active.takes_cta && ctaChoices.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#666', marginBottom: 4 }}>
                What should the button say?
              </label>
              <select
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                aria-label="What should the button say?"
                style={{
                  border: '1.5px solid #e0dcd9',
                  borderRadius: 20,
                  padding: '8px 14px',
                  fontSize: 13,
                  outline: 'none',
                  background: '#fff',
                }}
              >
                {ctaChoices.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && <div style={{ marginTop: 8, fontSize: 12, color: '#c0392b' }}>{error}</div>}
        </div>
      )}
    </div>
  );
}

function ChooseCreativeSource({
  drafts,
  onGenerate,
  onUpload,
  onRecomposite,
  onPickDraft,
}: {
  drafts: DraftSummary[];
  onGenerate: () => void;
  onUpload: () => void;
  onRecomposite: () => void;
  onPickDraft: (draftId: string) => void;
}) {
  const [showDrafts, setShowDrafts] = useState(false);
  const optionBtn: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
    background: '#fff',
    border: `1.5px solid ${PINK}`,
    color: PINK,
    borderRadius: 12,
    padding: '10px 14px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    textAlign: 'left',
  };
  const sub: React.CSSProperties = { fontSize: 11, fontWeight: 500, color: '#a06', opacity: 0.85 };
  return (
    <div>
      <JaneBubble>Great — how would you like to handle the image for this ad?</JaneBubble>
      <div className="camp-indent" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, marginLeft: 40 }}>
        <button onClick={onGenerate} style={optionBtn}>
          ✨ Let Jane create one<span style={sub}>I&apos;ll design a visual for you</span>
        </button>
        <button onClick={onUpload} style={optionBtn}>
          📎 Upload my own<span style={sub}>Use your own photo or video</span>
        </button>
        <button onClick={onRecomposite} style={optionBtn}>
          🎨 Use my product photo<span style={sub}>Keep the real product, new scene around it</span>
        </button>
        {drafts.length > 0 && (
          <button onClick={() => setShowDrafts((v) => !v)} style={optionBtn}>
            🖼 Use a past post<span style={sub}>{drafts.length} available</span>
          </button>
        )}
      </div>
      {showDrafts && drafts.length > 0 && (
        <div
          className="camp-indent"
          style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10, marginLeft: 40, maxWidth: 560 }}
        >
          {drafts.map((d) => (
            <button
              key={d.draft_id}
              onClick={() => onPickDraft(d.draft_id)}
              title={d.content}
              style={{
                padding: 0,
                border: '2px solid #eee',
                borderRadius: 10,
                overflow: 'hidden',
                cursor: 'pointer',
                background: '#fff',
                width: 84,
                height: 84,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={d.image_url}
                alt="past post"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Multi-Plan Audience Variants — up to five ranked, genuinely-distinct audience
// strategies (spec v1.0.0). Mobile-first: stacked vertically, the recommended card
// expanded by default, others collapsed to a one-line summary (spec §4.2). Budget
// gates how many can be selected (max_selectable, computed server-side — never
// guessed here) — single-select becomes a radio-like tap, multi-select toggles.
function PlanVariantCards({
  variantSet,
  onConfirm,
  onConfirmOwnAudience,
}: {
  variantSet: PlanVariantSet;
  onConfirm: (variants: PlanVariant[]) => void;
  onConfirmOwnAudience: (audience: string) => void;
}) {
  // Every variant's full reasoning (why it could work, its trade-off, creative fit,
  // budget) is shown from the start, not just the recommended one — the whole point
  // of presenting genuinely distinct options is comparing their trade-offs side by
  // side, which a collapsed-to-just-a-headline card actively hides. Collapsible
  // per-card afterward is still fine (progressive disclosure once already seen).
  const [expandedRanks, setExpandedRanks] = useState<Set<number>>(
    () => new Set(variantSet.variants.map((v) => v.rank))
  );
  const [selectedRanks, setSelectedRanks] = useState<number[]>([]);
  // Guards against a duplicate build from a second tap (see the Build button below).
  const [confirmed, setConfirmed] = useState(false);
  // "None of these" — the client's own audience, in their words. Picking a card and
  // typing an audience are mutually exclusive answers to the same question, so each
  // clears the other rather than leaving two conflicting choices on screen.
  const [ownAudience, setOwnAudience] = useState('');

  const toggleExpanded = (rank: number) => {
    setExpandedRanks((prev) => {
      const next = new Set(prev);
      if (next.has(rank)) next.delete(rank);
      else next.add(rank);
      return next;
    });
  };
  const maxSelectable = variantSet.max_selectable;

  const toggleSelect = (rank: number) => {
    setOwnAudience('');   // a card and a typed audience are competing answers
    setSelectedRanks((prev) => {
      if (prev.includes(rank)) return prev.filter((r) => r !== rank);
      if (maxSelectable === 1) return [rank];
      if (prev.length >= maxSelectable) return prev; // ignore taps past the budget-gated limit
      return [...prev, rank];
    });
  };

  const cardStyle = (v: PlanVariant): React.CSSProperties => ({
    border: `1.5px solid ${v.recommended ? PINK : '#eee'}`,
    borderRadius: 12,
    padding: '12px 14px',
    background: '#fff',
    cursor: 'pointer',
  });
  const label: React.CSSProperties = {
    fontSize: 10.5,
    fontWeight: 700,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  };

  return (
    <div>
      <JaneBubble>{variantSet.recommendation_reason}</JaneBubble>
      {variantSet.selection_rule_reason && (
        <p style={{ margin: '4px 0 8px 40px', fontSize: 11.5, color: '#888', fontStyle: 'italic', maxWidth: 520 }}>
          {variantSet.selection_rule_reason}
        </p>
      )}
      <div
        className="camp-indent"
        style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, marginLeft: 40, maxWidth: 560 }}
      >
        {variantSet.variants.map((v) => {
          const isExpanded = expandedRanks.has(v.rank);
          const isSelected = selectedRanks.includes(v.rank);
          return (
            <div key={v.rank} style={cardStyle(v)}>
              <div
                onClick={() => toggleExpanded(v.rank)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}
              >
                <div>
                  <span style={label}>Plan {v.rank}</span>
                  <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 800, color: '#1a0a12' }}>{v.who_its_for}</p>
                </div>
                {v.recommended && (
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: PINK, whiteSpace: 'nowrap' }}>
                    ★ RECOMMENDED
                  </span>
                )}
              </div>
              {isExpanded && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {v.geo_pockets.length > 0 && (
                    <div>
                      <span style={label}>Where</span>
                      <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#444' }}>
                        {v.geo_pockets.join(', ')} <em style={{ opacity: 0.6 }}>(confirm these match you)</em>
                      </p>
                    </div>
                  )}
                  <div>
                    <span style={label}>Why this could work</span>
                    <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#444', lineHeight: 1.5 }}>
                      {v.why_this_could_work}
                    </p>
                  </div>
                  <div>
                    <span style={label}>Trade-off</span>
                    <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#a15c00', lineHeight: 1.5 }}>
                      {v.trade_off}
                    </p>
                  </div>
                  <div>
                    <span style={label}>Creative</span>
                    <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#444' }}>
                      {v.needs_video ? 'Video of you talking' : 'Photos would work'}
                    </p>
                  </div>
                  <div>
                    <span style={label}>Budget</span>
                    <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#444' }}>
                      {naira(v.budget_alone_ngn)} if run alone
                      {v.budget_shared_ngn != null && `, or ${naira(v.budget_shared_ngn)} alongside another`}
                    </p>
                  </div>
                </div>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSelect(v.rank);
                }}
                style={{
                  marginTop: 10,
                  width: '100%',
                  border: `1.5px solid ${PINK}`,
                  borderRadius: 10,
                  padding: '8px 12px',
                  fontWeight: 700,
                  fontSize: 12.5,
                  cursor: 'pointer',
                  background: isSelected ? PINK : '#fff',
                  color: isSelected ? '#fff' : PINK,
                }}
              >
                {isSelected ? '✓ Selected' : maxSelectable > 1 ? 'Select this one' : 'Choose this one'}
              </button>
            </div>
          );
        })}
      </div>
      {maxSelectable > 1 && (
        <p style={{ margin: '10px 0 0 40px', fontSize: 11.5, color: '#888', maxWidth: 520 }}>
          ℹ️ Picking more than one means a separate ad for each — since they need different messages, one shared ad
          would end up vague. That's {Math.max(selectedRanks.length, 1)} creative credit
          {selectedRanks.length === 1 ? '' : 's'}.
        </p>
      )}
      {/* None of these — the business knows its own customers better than any generated
          variant does, so there has to be a way to say so without fighting the picker. */}
      <div
        style={{
          margin: '14px 0 0 40px',
          maxWidth: 520,
          borderTop: '1px solid #eee',
          paddingTop: 12,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.3, color: '#888', textTransform: 'uppercase' }}>
          None of these
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#333', margin: '4px 0 8px' }}>
          Describe your own audience
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            value={ownAudience}
            onChange={(e) => {
              setOwnAudience(e.target.value);
              if (e.target.value.trim()) setSelectedRanks([]);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && ownAudience.trim() && !confirmed) {
                setConfirmed(true);
                onConfirmOwnAudience(ownAudience.trim());
              }
            }}
            placeholder="e.g. gym owners in Lekki aged 25-40"
            aria-label="Describe your own audience"
            style={{
              flex: 1,
              minWidth: 240,
              border: '1.5px solid #e0dcd9',
              borderRadius: 20,
              padding: '8px 14px',
              fontSize: 13,
              outline: 'none',
            }}
          />
          <button
            onClick={() => {
              if (confirmed || !ownAudience.trim()) return;
              setConfirmed(true);
              onConfirmOwnAudience(ownAudience.trim());
            }}
            disabled={!ownAudience.trim() || confirmed}
            style={{
              border: 'none',
              borderRadius: 20,
              padding: '8px 18px',
              fontWeight: 700,
              fontSize: 13,
              cursor: ownAudience.trim() && !confirmed ? 'pointer' : 'default',
              background: ownAudience.trim() && !confirmed ? PINK : '#eee',
              color: ownAudience.trim() && !confirmed ? '#fff' : '#999',
            }}
          >
            Use this instead
          </button>
        </div>
      </div>
      <button
        onClick={() => {
          if (confirmed) return;
          setConfirmed(true);
          onConfirm(variantSet.variants.filter((v) => selectedRanks.includes(v.rank)));
        }}
        // Live-reported: this stayed clickable after use, so a second tap fired a
        // duplicate build — and because the consultant re-parses each call, the extra
        // one came back as a fresh question, which read as Jane looping.
        disabled={selectedRanks.length === 0 || confirmed}
        style={{
          marginTop: 10,
          marginLeft: 40,
          border: 'none',
          borderRadius: 10,
          padding: '10px 16px',
          fontWeight: 700,
          fontSize: 13,
          cursor: selectedRanks.length && !confirmed ? 'pointer' : 'default',
          background: selectedRanks.length && !confirmed ? `linear-gradient(135deg,${PINK},#8E1545)` : '#eee',
          color: selectedRanks.length && !confirmed ? '#fff' : '#999',
        }}
      >
        {confirmed ? 'Building…' : selectedRanks.length > 1 ? `Build ${selectedRanks.length} ads` : 'Build this ad'}
      </button>
    </div>
  );
}

// The one-tap CTA for every meta_connection_* state that needs the OAuth grant
// (NONE/CONTENT_ONLY/EXPIRED and the legacy need_facebook_page) — goes straight to the
// backend's redirect endpoint (same pattern as the working instagram_direct connect
// button in WorkspaceDashboard.tsx), which sends the browser to Facebook's own OAuth
// dialog. Facebook redirects back to /workspace?tab=connections&connected=facebook_ads,
// handled there to call finalizeFacebookAds().
function ConnectMetaAdsLink({ children }: { children: React.ReactNode }) {
  const apiBase = (process.env.NEXT_PUBLIC_URI_API_BASE_URL || '').replace(/\/$/, '');
  return (
    <a
      href={`${apiBase}/social-media/connect/facebook-ads/initiate?source=jane_ads`}
      style={{
        display: 'inline-block',
        background: PINK,
        color: '#fff',
        textDecoration: 'none',
        borderRadius: 20,
        padding: '8px 16px',
        fontSize: 12.5,
        fontWeight: 700,
      }}
    >
      {children}
    </a>
  );
}

// Plan Defence — a question box beneath the "planned" review card. Answers/what-ifs
// come straight from the backend's own persisted derivation (never fabricated here);
// a correction ("challenge") comes back as a preview that only replaces the shown
// plan once the user explicitly confirms it.
function PlanAskBox({
  planId,
  onPlanUpdated,
}: {
  planId: string;
  onPlanUpdated: (updates: Partial<LaunchFromMessageResult>) => void;
}) {
  const [question, setQuestion] = useState('');
  const [lastQuestion, setLastQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<PlanAskResult | null>(null);
  const [error, setError] = useState('');

  const ask = async () => {
    const q = question.trim();
    if (!q || asking) return;
    setAsking(true);
    setError('');
    try {
      const result = await CampaignService.askAboutPlan(planId, q);
      setAnswer(result);
      setLastQuestion(q);
      setQuestion('');
    } catch (e) {
      setError(extractErrorMessage(e, "I couldn't work that out just now — try again in a moment."));
    } finally {
      setAsking(false);
    }
  };

  const confirmCorrection = async () => {
    if (!lastQuestion || asking) return;
    setAsking(true);
    setError('');
    try {
      const confirmed = await CampaignService.askAboutPlan(planId, lastQuestion, true);
      onPlanUpdated({ plan: confirmed.plan, creative: confirmed.creative, summary: confirmed.summary });
      setAnswer(null);
    } catch (e) {
      setError(extractErrorMessage(e, "Couldn't apply that correction — try again."));
    } finally {
      setAsking(false);
    }
  };

  return (
    <div style={{ marginTop: 10, borderTop: '1px solid #f0e3d0', paddingTop: 10 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && ask()}
          placeholder="Ask Jane about this plan — e.g. why this budget?"
          disabled={asking}
          style={{ flex: 1, border: '1px solid #e5d9c8', borderRadius: 8, padding: '7px 10px', fontSize: 12.5 }}
        />
        <button
          onClick={ask}
          disabled={asking || !question.trim()}
          style={{
            border: 'none',
            borderRadius: 8,
            padding: '7px 12px',
            fontWeight: 700,
            fontSize: 12,
            cursor: asking ? 'default' : 'pointer',
            background: asking ? '#eee' : PINK,
            color: asking ? '#999' : '#fff',
          }}
        >
          {asking ? '…' : 'Ask'}
        </button>
      </div>
      {error && <p style={{ margin: '6px 0 0', fontSize: 11.5, color: '#c62828' }}>{error}</p>}
      {answer && (
        <div
          style={{
            marginTop: 8,
            background: '#fff',
            border: '1px solid #f0e3d0',
            borderRadius: 8,
            padding: '8px 10px',
          }}
        >
          <p style={{ margin: 0, fontSize: 12.5, color: '#1a0a12', lineHeight: 1.5 }}>{answer.answer || answer.note}</p>
          {answer.kind === 'challenge' && answer.stage === 'challenge_preview' && (
            <button
              onClick={confirmCorrection}
              disabled={asking}
              style={{
                marginTop: 8,
                border: `1.5px solid ${PINK}`,
                borderRadius: 8,
                padding: '6px 10px',
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer',
                background: '#fff',
                color: PINK,
              }}
            >
              Replace plan with this correction
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function NeedWhatsapp({
  question,
  onSubmit,
  showConnectedAccountsLink,
}: {
  question?: string;
  onSubmit: (number: string) => void;
  showConnectedAccountsLink?: boolean;
}) {
  const [value, setValue] = useState('');
  const submit = () => {
    if (value.trim()) onSubmit(value);
  };
  return (
    <div>
      <JaneBubble>
        {question ||
          'Which WhatsApp number should I send your leads to? Anyone who taps your ad will message this number directly.'}
      </JaneBubble>
      <div className="camp-indent" style={{ display: 'flex', gap: 8, marginTop: 8, marginLeft: 40, maxWidth: 360 }}>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="e.g. 0803 123 4567"
          inputMode="tel"
          style={{
            flex: 1,
            border: '1.5px solid #e0dcd9',
            borderRadius: 20,
            padding: '8px 14px',
            fontSize: 13,
            outline: 'none',
          }}
        />
        <button
          onClick={submit}
          disabled={!value.trim()}
          style={{
            background: PINK,
            border: 'none',
            color: '#fff',
            borderRadius: 20,
            padding: '8px 18px',
            fontSize: 13,
            fontWeight: 700,
            cursor: value.trim() ? 'pointer' : 'default',
            opacity: value.trim() ? 1 : 0.5,
          }}
        >
          Save
        </button>
      </div>
      {showConnectedAccountsLink && (
        <div className="camp-indent" style={{ marginLeft: 40, marginTop: 6 }}>
          <ConnectedAccountsWhatsappLink />
        </div>
      )}
    </div>
  );
}

// A thumbnail/preview image the user can tap to see full-size in a lightbox overlay.
// Self-contained (owns its own open state) so it drops into any card without lifting
// state up. Click the backdrop or the ✕ to close; a video renders <video controls>.
function ZoomableImage({
  src,
  alt,
  style,
  isVideo,
}: {
  src: string;
  alt: string;
  style?: React.CSSProperties;
  isVideo?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={`View full ${alt || 'image'}`}
        style={{ padding: 0, border: 'none', background: 'none', cursor: 'zoom-in', display: 'block', width: '100%' }}
      >
        {isVideo ? (
          <video src={src} style={style} muted />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} style={style} />
        )}
      </button>
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            cursor: 'zoom-out',
          }}
        >
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 20,
              right: 24,
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#fff',
              borderRadius: '50%',
              width: 36,
              height: 36,
              fontSize: 18,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
          {isVideo ? (
            <video
              src={src}
              controls
              autoPlay
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8 }}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={alt}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }}
            />
          )}
        </div>
      )}
    </>
  );
}

function TypingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', height: 13 }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#aaa',
            animation: 'jane-typing-bounce 1.1s infinite ease-in-out',
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes jane-typing-bounce {
          0%,
          60%,
          100% {
            transform: translateY(0);
            opacity: 0.5;
          }
          30% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }
      `}</style>
    </span>
  );
}

// A question card Jane asked. Once she's moved past it, it stays on screen (the thread
// reads as a real conversation, so nothing is rewritten or removed) but goes
// non-interactive — `inert` takes it out of the tab order and makes the browser swallow
// clicks, which plain pointer-events:none does not. Live-reported: a rejected link left
// two destination pickers on screen and tapping the older one resubmitted the bad value
// over the new answer. Only prompt stages go inert; a planned/launched card stays usable.
//
// The wrapper is ALWAYS rendered, never conditionally: adding a div around the card the
// moment it goes stale changes the element tree, so React remounts the card and it loses
// its own state — caught in e2e as a stale picker silently reverting from the link the
// user had typed back to the default WhatsApp option. History must not rewrite itself.
function PromptCard({ stale, children }: { stale?: boolean; children: React.ReactNode }) {
  return (
    <div inert={stale || undefined} style={{ opacity: stale ? 0.5 : 1 }}>
      {children}
    </div>
  );
}

function ResultCard({
  result,
  onResultChange,
  onLaunched,
  onQuickReply,
  onTopUp,
  onSubmitWhatsapp,
  onSubmitMetaConnectionWhatsapp,
  onChooseGenerate,
  onChooseUpload,
  onChooseRecomposite,
  onChooseDraft,
  onChooseVariants,
  onChooseOwnAudience,
  onChooseDestination,
  stale,
}: {
  result: LaunchFromMessageResult;
  onResultChange: (result: LaunchFromMessageResult) => void;
  onLaunched: () => void;
  onQuickReply: (text: string) => void;
  onTopUp: () => void;
  onSubmitWhatsapp: (number: string) => void;
  onSubmitMetaConnectionWhatsapp: (number: string) => void;
  onChooseGenerate: () => void;
  onChooseUpload: () => void;
  onChooseRecomposite: () => void;
  onChooseDraft: (draftId: string) => void;
  onChooseVariants: (variants: PlanVariant[], variantGroupId: string) => void;
  onChooseOwnAudience: (audience: string) => void;
  onChooseDestination: (answer: {
    destination_type: string;
    destination_value: string;
    destination_cta: string;
  }) => void;
  // True for every result card except the newest — see PromptCard above.
  stale?: boolean;
}) {
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState('');
  // Pre-existing rules-of-hooks bug: these two were declared after several early
  // returns below (meta_connection_ads_no_whatsapp, choose_creative_source, etc.),
  // meaning React skipped them whenever an earlier stage matched — moved up here
  // alongside the other hooks so every render calls the same hooks in the same order.
  const [fixingWhatsapp, setFixingWhatsapp] = useState(false);
  const [whatsappFix, setWhatsappFix] = useState('');

  // Every stage below is a QUESTION Jane asked, as opposed to the plan/launch card
  // further down. Gathered into one function so a superseded one can be rendered
  // inert in a single place (PromptCard) instead of each card growing its own
  // disabled state — and so a new prompt stage gets that behaviour for free.
  const renderPrompt = (): React.ReactNode => {
    if (result.stage === 'need_whatsapp') {
      return <NeedWhatsapp question={result.question} onSubmit={onSubmitWhatsapp} />;
    }
    if (result.stage === 'choose_destination' && result.destination_options) {
      return (
        <div>
          {/* Same reason choose_creative_source shows it: Jane's geography/audience call is
              confirmed back to the client before they commit, never silently decided. */}
          {result.explanation && <JaneBubble>{result.explanation}</JaneBubble>}
          <ChooseDestination
            options={result.destination_options}
            ctaChoices={result.cta_choices || []}
            selected={result.selected}
            error={result.error}
            onSubmit={onChooseDestination}
          />
        </div>
      );
    }

    if (result.stage === 'choose_creative_source') {
      return (
        <div>
          {/* Jane's geography/audience call (jane-strategy-extraction §7.6) is required to be
              confirmed back to the client, never silently decided — this is the point she'd
              otherwise reach "ready" and skip straight to image selection with the client never
              seeing (or able to correct) where she's decided to target. */}
          {result.explanation && <JaneBubble>{result.explanation}</JaneBubble>}
          <ChooseCreativeSource
            drafts={result.creative_options?.drafts || []}
            onGenerate={onChooseGenerate}
            onUpload={onChooseUpload}
            onRecomposite={onChooseRecomposite}
            onPickDraft={onChooseDraft}
          />
        </div>
      );
    }

    if (result.stage === 'choose_plan_variant' && result.plan_variants) {
      const groupId = result.variant_group_id || '';
      return (
        <PlanVariantCards
          variantSet={result.plan_variants}
          onConfirm={(variants) => onChooseVariants(variants, groupId)}
          onConfirmOwnAudience={onChooseOwnAudience}
        />
      );
    }

    if (result.stage === 'need_more') {
      // need_more now covers three distinct questions (nl.py asks business identity, THEN
      // the objective/offer_type, THEN budget — in that order) — chips only make sense for
      // the objective and budget questions, so gate on what's actually missing instead of
      // assuming. Nothing to suggest for "what would you like to promote?" — that needs
      // free text, not a quick reply.
      const asksForObjective = result.understood?.missing?.includes('offer_type');
      const asksForBudget = result.understood?.missing?.includes('budget_ngn');
      return (
        <div>
          <JaneBubble>{result.question || 'Could you tell me a bit more, especially your budget?'}</JaneBubble>
          {asksForObjective && <QuickReplyChips chips={OBJECTIVE_REPLY_CHIPS} onPick={onQuickReply} />}
          {asksForBudget && <QuickReplyChips chips={BUDGET_REPLY_CHIPS} onPick={onQuickReply} />}
        </div>
      );
    }
    if (result.stage === 'advise') {
      return (
        <JaneBubble>{result.advice?.reason || "That budget's a little low to run well, want to bump it up?"}</JaneBubble>
      );
    }
    if (result.stage === 'need_facebook_page') {
      // Legacy stage — only ever rendered from an OLD saved thread message; the
      // backend no longer emits it (superseded by the meta_connection_* states below).
      return (
        <div>
          <JaneBubble>
            {result.question ||
              "Connect your Facebook Page (with WhatsApp linked to it) so leads reach you, then come back and I'll launch."}
          </JaneBubble>
          <div className="camp-indent" style={{ marginLeft: 40, marginTop: 8 }}>
            <ConnectMetaAdsLink>Connect Facebook Page →</ConnectMetaAdsLink>
          </div>
        </div>
      );
    }

    // Per-Brand Page Connection plan — six explicit states (never inferred from one
    // boolean), checked before Jane even builds a plan. Each state below is framed
    // as "progress not restart": what's already true stays true, one reason, one tap.
    if (result.stage === 'meta_connection_none') {
      return (
        <div>
          <JaneBubble>
            To run real ads, I need your Facebook Page connected with ads permission — this makes sure the ad runs from
            YOUR Page, not a shared one, so followers and replies come to you.
          </JaneBubble>
          <div className="camp-indent" style={{ marginLeft: 40, marginTop: 8 }}>
            <ConnectMetaAdsLink>Connect Facebook Page →</ConnectMetaAdsLink>
          </div>
        </div>
      );
    }
    if (result.stage === 'meta_connection_content_only') {
      return (
        <div>
          <JaneBubble>
            You&rsquo;re already connected for posting — running ads just needs one more permission from Facebook
            (advertising access), on top of what you&rsquo;ve already granted.
          </JaneBubble>
          <div className="camp-indent" style={{ marginLeft: 40, marginTop: 8 }}>
            <ConnectMetaAdsLink>Add ads permission →</ConnectMetaAdsLink>
          </div>
        </div>
      );
    }
    if (result.stage === 'meta_connection_expired') {
      return (
        <div>
          <JaneBubble>
            {result.page_name ? `Your connection to ${result.page_name} needs` : 'Your Facebook connection needs'}{' '}
            refreshing — a permission may have been changed or revoked. Reconnect and I&rsquo;ll pick up right where we
            left off.
          </JaneBubble>
          <div className="camp-indent" style={{ marginLeft: 40, marginTop: 8 }}>
            <ConnectMetaAdsLink>Reconnect Facebook Page →</ConnectMetaAdsLink>
          </div>
        </div>
      );
    }
    if (result.stage === 'meta_connection_no_page') {
      return (
        <JaneBubble>
          Ads need a Facebook Page behind them, and your account doesn&rsquo;t have one yet. Create a Page in Facebook
          first, then come back and reconnect.
        </JaneBubble>
      );
    }
    if (result.stage === 'meta_connection_ads_no_whatsapp') {
      return (
        <NeedWhatsapp
          question={
            `${result.page_name ? `${result.page_name} is` : 'Your ads permission is'} connected — ` +
            "just need the WhatsApp number leads should message. That's it — ads route through a plain " +
            'WhatsApp link, so there is no separate Facebook Page linking step to do afterward.'
          }
          onSubmit={onSubmitMetaConnectionWhatsapp}
          showConnectedAccountsLink
        />
      );
    }
    return null;
  };

  const prompt = renderPrompt();
  if (prompt) return <PromptCard stale={stale}>{prompt}</PromptCard>;

  const confirmLaunch = async () => {
    if (launching || !result.plan_id) return;
    setLaunchError('');
    setLaunching(true);
    try {
      const launched = await CampaignService.launchPlan(result.plan_id);
      onResultChange(launched);
      onLaunched();
    } catch (e) {
      const msg = extractErrorMessage(e, 'Could not launch this campaign, please try again.');
      setLaunchError(msg);
      // Meta's own pre-flight rejection when the number Jane has on file isn't actually
      // linked to the Page yet (a real, live-validated error, not guessed) — offer the
      // fix right here instead of a dead error the client can only retry blindly.
      setFixingWhatsapp(isWhatsappNumberError(msg));
    } finally {
      setLaunching(false);
    }
  };

  const submitWhatsappFixAndRetry = async () => {
    const clean = whatsappFix.trim();
    if (!clean || launching) return;
    setLaunching(true);
    setLaunchError('');
    try {
      // Saves to the brand's own settings — the SAME place the launch path reads the
      // number from (resolve_ads_page_for_launch -> get_brand_whatsapp). This used to
      // call setMetaConnectionWhatsapp, which writes to the per-brand Meta *connection*
      // row; since every brand now launches from URI's shared Page, most brands have no
      // such row, so saving here just 409'd with meta_connection_none and the number
      // never reached the launch at all. Live-reported.
      await CampaignService.setWhatsapp(clean);
      setFixingWhatsapp(false);
      setWhatsappFix('');
      const launched = await CampaignService.launchPlan(result.plan_id!);
      onResultChange(launched);
      onLaunched();
    } catch (e) {
      const msg = extractErrorMessage(e, "That didn't work — please try again.");
      setLaunchError(msg);
      setFixingWhatsapp(isWhatsappNumberError(msg));
    } finally {
      setLaunching(false);
    }
  };

  const { plan, creative, launch, wallet } = result;
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          flexShrink: 0,
          background: `linear-gradient(135deg,${PINK},#8E1545)`,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: 13,
        }}
      >
        J
      </div>
      <div
        style={{
          maxWidth: 560,
          flex: 1,
          border: '1px solid #eee',
          borderRadius: 14,
          overflow: 'hidden',
          background: '#fff',
        }}
      >
        {creative?.image_url && (
          <ZoomableImage
            src={creative.image_url}
            alt="campaign visual"
            isVideo={creative.is_video}
            style={{ width: '100%', display: 'block', maxHeight: 320, objectFit: 'cover' }}
          />
        )}
        <div style={{ padding: 16 }}>
          <p style={{ margin: '0 0 4px', fontWeight: 800, fontSize: 15, color: '#1a0a12' }}>{creative?.headline}</p>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: '#555', lineHeight: 1.5 }}>{creative?.primary_text}</p>
          {plan?.explanation && (
            <p style={{ margin: '0 0 12px', fontSize: 12.5, color: '#888', fontStyle: 'italic', lineHeight: 1.5 }}>
              &ldquo;{plan.explanation}&rdquo;
            </p>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {plan?.platforms?.map((p, i) => (
              <span
                key={i}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '3px 9px',
                  borderRadius: 20,
                  background: '#fce4ec',
                  color: PINK,
                }}
              >
                {naira(p.budget_ngn)} · {p.days} days
              </span>
            ))}
            {plan?.geo?.pins?.length ? (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '3px 9px',
                  borderRadius: 20,
                  background: '#f0eded',
                  color: '#666',
                }}
              >
                📍 {plan.geo.pins.map((x) => x.name).join(', ')}
              </span>
            ) : null}
          </div>
          {result.whatsapp_number && (
            <p style={{ margin: '0 0 12px', fontSize: 12, color: '#666' }}>
              💬 Leads message <strong>+{result.whatsapp_number}</strong> on WhatsApp
            </p>
          )}
          {result.summary && <CampaignReview summary={result.summary} />}
          {result.stage === 'planned' ? (
            <div style={{ background: '#fdf8f3', border: '1px solid #f0e3d0', borderRadius: 10, padding: '10px 12px' }}>
              {wallet && (wallet.service_fee_ngn ?? 0) > 0 && (
                <p style={{ margin: '0 0 8px', fontSize: 12, color: '#777' }}>
                  {naira(wallet.budget_ngn)} ad spend + {naira(wallet.service_fee_ngn)} service fee ={' '}
                  <strong>{naira(wallet.total_due_ngn ?? wallet.budget_ngn)}</strong> from your wallet
                </p>
              )}
              {wallet && !wallet.sufficient && (
                <>
                  <p style={{ margin: '0 0 8px', fontSize: 12.5, color: '#a15c00' }}>
                    You&rsquo;ll need {naira(wallet.total_due_ngn ?? wallet.budget_ngn)} in your wallet to run this —
                    you have {naira(wallet.balance_ngn)} now.
                  </p>
                  <button
                    onClick={onTopUp}
                    style={{
                      width: '100%',
                      marginBottom: 8,
                      border: `1.5px solid ${PINK}`,
                      borderRadius: 10,
                      padding: '9px 14px',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                      background: '#fff',
                      color: PINK,
                    }}
                  >
                    Top up wallet
                  </button>
                </>
              )}
              <button
                onClick={confirmLaunch}
                disabled={launching}
                style={{
                  width: '100%',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: launching ? 'default' : 'pointer',
                  background: launching ? '#eee' : `linear-gradient(135deg,${PINK},#8E1545)`,
                  color: launching ? '#999' : '#fff',
                }}
              >
                {launching ? 'Launching…' : '✓ Looks good — launch it'}
              </button>
              {launchError && <p style={{ margin: '8px 0 0', fontSize: 12, color: '#c62828' }}>{launchError}</p>}
              {fixingWhatsapp && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={whatsappFix}
                      onChange={(e) => setWhatsappFix(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && submitWhatsappFixAndRetry()}
                      placeholder="e.g. 0803 123 4567"
                      inputMode="tel"
                      style={{
                        flex: 1,
                        border: '1.5px solid #e0dcd9',
                        borderRadius: 20,
                        padding: '8px 14px',
                        fontSize: 13,
                        outline: 'none',
                      }}
                    />
                    <button
                      onClick={submitWhatsappFixAndRetry}
                      disabled={!whatsappFix.trim() || launching}
                      style={{
                        background: PINK,
                        border: 'none',
                        color: '#fff',
                        borderRadius: 20,
                        padding: '8px 18px',
                        fontSize: 13,
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        cursor: whatsappFix.trim() && !launching ? 'pointer' : 'default',
                        opacity: whatsappFix.trim() && !launching ? 1 : 0.5,
                      }}
                    >
                      Save &amp; retry
                    </button>
                  </div>
                  <ConnectedAccountsWhatsappLink />
                </div>
              )}
            </div>
          ) : null}
          {result.stage === 'planned' && result.plan_id && (
            <PlanAskBox
              planId={result.plan_id}
              onPlanUpdated={(updates) => onResultChange({ ...result, ...updates })}
            />
          )}
          {result.stage !== 'planned' && (
            <div style={{ background: '#f6fbf6', border: '1px solid #cde9cd', borderRadius: 10, padding: '10px 12px' }}>
              <p style={{ margin: 0, fontSize: 12.5, color: '#2e7d32', fontWeight: 700 }}>
                ✓ Campaign created, paused, no spend yet
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#666' }}>{launch?.note}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function walletTxnLabel(t: { type: string; campaign_id: string }): string {
  switch (t.type) {
    case 'topup':
      return 'Wallet top-up';
    case 'ad_spend':
      return 'Ad spend';
    case 'conversation_charge':
      return 'WhatsApp conversation';
    case 'refund':
      return 'Refund';
    default:
      return 'Adjustment';
  }
}

function fmtTxnDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function WalletTab({
  wallet,
  loading,
  onFunded,
}: {
  wallet: WalletInfo | null;
  loading: boolean;
  onFunded: () => void;
}) {
  const min = wallet?.min_topup_ngn ?? 5000;
  const [amount, setAmount] = useState<number>(min);
  const [funding, setFunding] = useState(false);
  const [error, setError] = useState('');

  const presets = [5000, 10000, 20000, 50000];

  const topUp = async () => {
    if (funding) return;
    if (!amount || amount < min) {
      setError(`Minimum top-up is ${naira(min)}.`);
      return;
    }
    setError('');
    setFunding(true);
    try {
      const { checkout_url } = await CampaignService.fundWallet(amount);
      if (checkout_url) {
        // Hand off to Squad's hosted checkout; on payment it returns to
        // ?tab=campaigns&reference=… which the page verifies on mount.
        window.location.href = checkout_url;
      } else {
        setError('Could not start the payment. Please try again.');
        setFunding(false);
      }
    } catch (e) {
      setError(extractErrorMessage(e, 'Could not start the payment. Please try again.'));
      setFunding(false);
    }
  };

  return (
    <div className="camp-pane" style={{ flex: 1, overflowY: 'auto', padding: '18px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
        <p style={{ margin: 0, color: '#888', fontSize: 13 }}>
          Your prepaid wallet. Campaigns spend from this balance — top up before you launch.
        </p>
        <button
          onClick={onFunded}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: '1px solid #e0dcd9',
            borderRadius: 8,
            padding: '6px 12px',
            fontSize: 12,
            cursor: 'pointer',
            color: '#555',
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Balance */}
      <div
        style={{
          background: `linear-gradient(135deg,${PINK},#8E1545)`,
          borderRadius: 16,
          padding: '22px 24px',
          color: '#fff',
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 12.5, opacity: 0.85, fontWeight: 600, letterSpacing: 0.3 }}>CURRENT BALANCE</div>
        <div style={{ fontSize: 34, fontWeight: 800, marginTop: 4 }}>
          {loading && !wallet ? '…' : naira(wallet?.balance_ngn ?? 0)}
        </div>
      </div>

      {/* Top up */}
      <div style={{ border: '1px solid #eee', borderRadius: 14, padding: 18, marginBottom: 20, background: '#fff' }}>
        <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 14, color: '#1a0a12' }}>Add money</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => {
                setAmount(p);
                setError('');
              }}
              style={{
                background: amount === p ? PINK : '#fff',
                color: amount === p ? '#fff' : PINK,
                border: `1.5px solid ${PINK}`,
                borderRadius: 20,
                padding: '6px 14px',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {naira(p)}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flex: 1,
              border: '1.5px solid #e0dcd9',
              borderRadius: 12,
              padding: '0 12px',
            }}
          >
            <span style={{ color: '#888', fontSize: 15, fontWeight: 700 }}>₦</span>
            <input
              type="number"
              min={min}
              value={amount || ''}
              onChange={(e) => {
                setAmount(Number(e.target.value));
                setError('');
              }}
              style={{
                border: 'none',
                outline: 'none',
                padding: '11px 8px',
                fontSize: 15,
                width: '100%',
                color: '#111',
                fontFamily: 'inherit',
              }}
            />
          </div>
          <button
            onClick={topUp}
            disabled={funding}
            style={{
              padding: '11px 22px',
              border: 'none',
              borderRadius: 12,
              whiteSpace: 'nowrap',
              background: funding ? '#ddd' : `linear-gradient(135deg,${PINK},#8E1545)`,
              color: '#fff',
              fontWeight: 800,
              fontSize: 14,
              cursor: funding ? 'default' : 'pointer',
            }}
          >
            {funding ? 'Starting…' : 'Top up'}
          </button>
        </div>
        <p style={{ margin: '8px 0 0', fontSize: 11.5, color: error ? '#c62828' : '#aaa' }}>
          {error || `Minimum ${naira(min)}. Secured by Squad — you'll be taken to a payment page.`}
        </p>
      </div>

      {/* Ledger */}
      <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: 13, color: '#1a0a12' }}>Recent activity</p>
      {loading && !wallet ? (
        <p style={{ color: '#aaa', fontSize: 13 }}>Loading…</p>
      ) : !wallet?.transactions?.length ? (
        <p style={{ color: '#aaa', fontSize: 13 }}>No activity yet. Top up to get started.</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gap: 1,
            background: '#eee',
            border: '1px solid #eee',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          {wallet.transactions.map((t) => {
            const credit = t.amount_ngn >= 0;
            return (
              <div
                key={t.transaction_id}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: '#fff' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{walletTxnLabel(t)}</div>
                  <div style={{ fontSize: 11.5, color: '#aaa' }}>{fmtTxnDate(t.created_at)}</div>
                </div>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: credit ? '#1e7e34' : '#c62828',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {credit ? '+' : '−'}
                  {naira(Math.abs(t.amount_ngn))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BillingTab() {
  const [data, setData] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await CampaignService.billingSummary(from || undefined, to || undefined));
    } catch (e) {
      setError(extractErrorMessage(e, 'Could not load the billing report.'));
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
    // load once on mount; re-runs are driven by the Apply button
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const download = async () => {
    setDownloading(true);
    try {
      await CampaignService.downloadBillingCsv(from || undefined, to || undefined);
    } catch (e) {
      setError(extractErrorMessage(e, 'Could not download the CSV.'));
    } finally {
      setDownloading(false);
    }
  };

  const t = data?.totals;
  const dateInput: React.CSSProperties = {
    border: '1.5px solid #e0dcd9',
    borderRadius: 10,
    padding: '8px 10px',
    fontSize: 13,
    fontFamily: 'inherit',
    color: '#111',
  };

  return (
    <div className="camp-pane" style={{ flex: 1, overflowY: 'auto', padding: '18px 24px' }}>
      <p style={{ margin: '0 0 14px', color: '#888', fontSize: 13 }}>
        What each customer has spent on ads, what we billed them, and our margin. Numbers fill in as campaigns deliver.
      </p>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end', marginBottom: 18 }}>
        <label style={{ fontSize: 11.5, color: '#888' }}>
          From
          <br />
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={dateInput} />
        </label>
        <label style={{ fontSize: 11.5, color: '#888' }}>
          To
          <br />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={dateInput} />
        </label>
        <button
          onClick={load}
          disabled={loading}
          style={{
            border: 'none',
            borderRadius: 10,
            padding: '9px 18px',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            background: `linear-gradient(135deg,${PINK},#8E1545)`,
            color: '#fff',
          }}
        >
          {loading ? 'Loading…' : 'Apply'}
        </button>
        <button
          onClick={download}
          disabled={downloading || !data}
          style={{
            border: `1.5px solid ${PINK}`,
            borderRadius: 10,
            padding: '9px 16px',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            background: '#fff',
            color: PINK,
            marginLeft: 'auto',
          }}
        >
          {downloading ? 'Preparing…' : '⤓ Download CSV'}
        </button>
      </div>

      {/* Totals */}
      {t && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
          <TotalCard label="Customers" value={String(t.users)} />
          <TotalCard label="Real ad spend" value={naira(t.real_spend_ngn)} />
          <TotalCard label="Billed" value={naira(t.billed_ngn)} />
          <TotalCard label="Margin" value={naira(t.margin_ngn)} accent />
        </div>
      )}

      {error && <p style={{ fontSize: 12.5, color: '#c62828' }}>{error}</p>}

      {/* Table */}
      {loading && !data ? (
        <p style={{ color: '#aaa', fontSize: 13 }}>Loading…</p>
      ) : !data?.per_user?.length ? (
        <p style={{ color: '#aaa', fontSize: 13 }}>No ad spend recorded yet for this period.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 640, fontSize: 12.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#888', borderBottom: '1px solid #eee' }}>
                <th style={{ padding: '8px 10px' }}>Customer</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Campaigns</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Real ad spend</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Billed</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Margin</th>
              </tr>
            </thead>
            <tbody>
              {data.per_user.map((r) => (
                <tr key={r.business_id} style={{ borderBottom: '1px solid #f4f2f0' }}>
                  <td style={{ padding: '9px 10px', color: '#333' }}>{r.label || r.business_id}</td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', color: '#666' }}>{r.campaigns}</td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', color: '#333' }}>{naira(r.real_spend_ngn)}</td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', color: '#333' }}>{naira(r.billed_ngn)}</td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700, color: '#1e7e34' }}>
                    {naira(r.margin_ngn)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TotalCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      style={{
        border: '1px solid #eee',
        borderRadius: 12,
        padding: '12px 16px',
        minWidth: 130,
        background: accent ? '#f6fbf6' : '#fff',
      }}
    >
      <div style={{ fontSize: 10.5, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: accent ? '#1e7e34' : '#1a0a12', marginTop: 2 }}>{value}</div>
    </div>
  );
}

const _STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  active: { bg: '#e6f7ec', color: '#1e7e34' },
  paused: { bg: '#fff3e0', color: '#e65100' },
  'in review': { bg: '#e8f0fe', color: '#1a56db' },
  processing: { bg: '#e8f0fe', color: '#1a56db' },
  scheduled: { bg: '#e8f0fe', color: '#1a56db' },
  'needs changes': { bg: '#fdecea', color: '#c62828' },
  'needs attention': { bg: '#fdecea', color: '#c62828' },
  'needs billing info': { bg: '#fdecea', color: '#c62828' },
  archived: { bg: '#f0eded', color: '#666' },
  deleted: { bg: '#f0eded', color: '#666' },
};

function statusStyle(status: string) {
  return _STATUS_STYLES[status.toLowerCase()] || { bg: '#fff3e0', color: '#e65100' };
}

function formatEnds(endsAt: string | null | undefined) {
  if (!endsAt) return 'Ongoing';
  const d = new Date(endsAt);
  return Number.isNaN(d.getTime())
    ? 'Ongoing'
    : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const _TOGGLABLE_STATUSES = new Set(['active', 'paused']);

function CampaignCard({ c, onChanged }: { c: CampaignRow; onChanged: () => void }) {
  const [working, setWorking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const displayStatus = c.metrics?.delivery || c.status;
  const { bg, color } = statusStyle(displayStatus);
  const isActive = displayStatus.toLowerCase() === 'active';
  const canToggle = _TOGGLABLE_STATUSES.has(displayStatus.toLowerCase()) && !!c.campaign_id;
  const canDelete = displayStatus.toLowerCase() !== 'deleted' && !!c.campaign_id;
  const busy = working || deleting;

  const toggle = async () => {
    if (busy) return;
    if (!isActive) {
      const ok = window.confirm(
        `Start running "${c.name}"? It will begin spending its ₦${(c.budget_ngn ?? 0).toLocaleString()} budget.`
      );
      if (!ok) return;
    }
    setError('');
    setWorking(true);
    try {
      await CampaignService.setCampaignStatus(c.campaign_id, !isActive);
      onChanged();
    } catch (e) {
      setError(extractErrorMessage(e, 'Could not update the campaign, please try again.'));
    } finally {
      setWorking(false);
    }
  };

  const remove = async () => {
    if (busy) return;
    const ok = window.confirm(`Delete "${c.name}"? This can't be undone.`);
    if (!ok) return;
    setError('');
    setDeleting(true);
    try {
      await CampaignService.deleteCampaign(c.campaign_id);
      onChanged();
    } catch (e) {
      setError(extractErrorMessage(e, 'Could not delete the campaign, please try again.'));
      setDeleting(false);
    }
  };

  return (
    <div
      style={{ display: 'flex', gap: 14, border: '1px solid #eee', borderRadius: 12, padding: 12, background: '#fff' }}
    >
      {c.image_url ? (
        <div style={{ width: 84, height: 84, flexShrink: 0 }}>
          <ZoomableImage
            src={c.image_url}
            alt={c.name}
            style={{ width: 84, height: 84, borderRadius: 8, objectFit: 'cover' }}
          />
        </div>
      ) : (
        <div style={{ width: 84, height: 84, borderRadius: 8, background: '#f4f2f0', flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#1a0a12' }}>{c.name}</p>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 20,
              background: bg,
              color,
              textTransform: 'uppercase',
            }}
          >
            {displayStatus}
          </span>
        </div>
        <p
          style={{
            margin: '3px 0 0',
            fontSize: 12.5,
            color: '#666',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {c.headline}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 8, fontSize: 12 }}>
          <Metric label="Budget" value={naira(c.budget_ngn)} />
          <Metric label="Amount spent" value={naira(c.metrics?.spend_ngn)} />
          <Metric
            label="Views"
            value={c.metrics?.impressions != null ? c.metrics.impressions.toLocaleString() : 'N/A'}
          />
          <Metric label="People reached" value={c.metrics?.reach != null ? c.metrics.reach.toLocaleString() : 'N/A'} />
          <Metric
            label="WhatsApp conversations"
            value={c.metrics?.conversations != null ? String(c.metrics.conversations) : 'N/A'}
          />
          <Metric
            label="Cost per conversation"
            value={c.metrics?.cost_per_conversation_ngn != null ? naira(c.metrics.cost_per_conversation_ngn) : 'N/A'}
          />
          <Metric label="Ends" value={formatEnds(c.metrics?.ends_at)} />
          {c.city && <Metric label="Area" value={c.city} />}
        </div>
        {/* Where this campaign's leads land — so there's never "no way to tell where the
            conversations went." Legacy campaigns (no number) routed to a shared inbox. */}
        {c.whatsapp_number ? (
          <p style={{ margin: '8px 0 0', fontSize: 12, color: '#1a7f37' }}>
            💬 Leads message <strong>+{c.whatsapp_number}</strong> on WhatsApp — open that chat to see them
          </p>
        ) : (
          <p style={{ margin: '8px 0 0', fontSize: 12, color: '#a15c00' }}>
            ⚠ Older campaign — leads went to a shared WhatsApp inbox, not your own number. Duplicate it from a chat
            thread to relaunch with your number.
          </p>
        )}
        {error && <p style={{ margin: '8px 0 0', fontSize: 11.5, color: '#c62828' }}>{error}</p>}
      </div>
      {(canToggle || canDelete) && (
        <div style={{ display: 'flex', gap: 8, alignSelf: 'center', flexShrink: 0 }}>
          {canToggle && (
            <button
              onClick={toggle}
              disabled={busy}
              title={isActive ? 'Pause' : 'Activate'}
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                border: 'none',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                cursor: busy ? 'default' : 'pointer',
                background: working ? '#eee' : isActive ? '#fdecea' : `linear-gradient(135deg,${PINK},#8E1545)`,
                color: working ? '#999' : isActive ? '#c62828' : '#fff',
              }}
            >
              {isActive ? '⏸' : '▶'}
            </button>
          )}
          {canDelete && (
            <button
              onClick={remove}
              disabled={busy}
              title="Delete"
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                border: '1px solid #f0d8dc',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                cursor: busy ? 'default' : 'pointer',
                background: deleting ? '#eee' : '#fff',
                color: deleting ? '#999' : '#c62828',
              }}
            >
              🗑
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ color: '#aaa', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</div>
      <div style={{ color: '#333', fontWeight: 700 }}>{value}</div>
    </div>
  );
}
