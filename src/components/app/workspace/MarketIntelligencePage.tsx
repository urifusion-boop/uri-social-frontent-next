'use client';

import React, { useEffect, useState } from 'react';
import {
  BrandBudget,
  ComponentScore,
  Development,
  DevelopmentStatus,
  Evidence,
  InsightVersion,
  MarketIntelligenceService,
  MINotificationPreferences,
  ScoreBreakdown,
  Topic,
} from '@/src/api/MarketIntelligenceService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';

const PINK = '#C2185B';

const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1.5px solid #eee',
  borderRadius: 12,
  padding: 16,
};

const buttonStyle: React.CSSProperties = {
  background: PINK,
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '9px 16px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: '#fff',
  color: PINK,
  border: `1.5px solid ${PINK}`,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 11px',
  borderRadius: 8,
  border: '1.5px solid #e5e3df',
  fontSize: 13,
  outline: 'none',
  background: '#fafaf8',
  color: '#111',
  boxSizing: 'border-box',
};

const bandColor = (band: string) => (band === 'high' ? '#1a9c4a' : band === 'medium' ? '#c98a1f' : '#a33');

/** Small "8/10 (high)" pill with a hover-revealed component breakdown — shows
 * WHY the score is what it is (PRD §15: "Explain 'why we are confident' in
 * the detail view"), not just the number. */
function ScorePill({ label, score }: { label: string; score: ScoreBreakdown }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: 'none',
          border: `1px solid ${bandColor(score.band)}`,
          color: bandColor(score.band),
          borderRadius: 20,
          padding: '3px 10px',
          fontSize: 11.5,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {label}: {score.total}/10 ({score.band})
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '110%',
            left: 0,
            zIndex: 5,
            background: '#fff',
            border: '1px solid #eee',
            borderRadius: 8,
            padding: 10,
            width: 260,
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          }}
        >
          {score.components.map((c: ComponentScore) => (
            <div key={c.name} style={{ fontSize: 11.5, marginBottom: 4 }}>
              <strong>
                {c.name}: {c.points}/2
              </strong>
              <div style={{ color: '#888' }}>{c.reason}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EvidenceDrawer({ insightId, onInsightRetracted }: { insightId: string; onInsightRetracted: () => void }) {
  const [evidence, setEvidence] = useState<Evidence[] | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    setEvidence(null);
    MarketIntelligenceService.getInsightEvidence(insightId).then((res) => {
      if (res.status) setEvidence(res.responseData ?? []);
    });
  }, [insightId]);

  const handleRemove = async (evidenceId: string) => {
    if (!window.confirm('Remove this record? This cannot be undone.')) return;
    setRemovingId(evidenceId);
    try {
      const res = await MarketIntelligenceService.deleteEvidence(evidenceId);
      if (!res.status) {
        ToastService.showToast(res.responseMessage || 'Could not remove this record', ToastTypeEnum.Error);
        return;
      }
      setEvidence((prev) => (prev ?? []).filter((e) => e.id !== evidenceId));
      const retracted = (res.responseData?.insights_retracted as string[] | undefined) ?? [];
      if (retracted.includes(insightId)) {
        // PRD §13: an insight with no evidence left is retracted, not shown
        // with an empty list — the parent reloads so this insight vanishes
        // from the list rather than lingering in a now-unsupported state.
        ToastService.showToast(
          'All evidence for this insight was removed — it has been retracted.',
          ToastTypeEnum.Warning
        );
        onInsightRetracted();
      } else {
        ToastService.showToast('Record removed.', ToastTypeEnum.Success);
      }
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div style={{ ...cardStyle, marginTop: 14, background: '#fafaf8' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: 8 }}>
        Evidence
      </div>
      {evidence === null ? (
        <div style={{ fontSize: 12, color: '#999' }}>Loading…</div>
      ) : evidence.length === 0 ? (
        <div style={{ fontSize: 12, color: '#999' }}>No evidence found for this insight.</div>
      ) : (
        evidence.map((e) => (
          <div
            key={e.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 8,
              borderBottom: '1px solid #eee',
              padding: '8px 0',
              fontSize: 12.5,
            }}
          >
            <div>
              <div style={{ color: '#111', marginBottom: 3 }}>{e.text}</div>
              <div style={{ color: '#999', fontSize: 11 }}>
                {e.author_handle ?? 'unknown author'} · {e.platform}
                {e.published_at ? ` · ${new Date(e.published_at).toLocaleDateString()}` : ' · undated'}
                {e.url && (
                  <>
                    {' · '}
                    <a href={e.url} target="_blank" rel="noreferrer" style={{ color: PINK }}>
                      View original
                    </a>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() => handleRemove(e.id)}
              disabled={removingId === e.id}
              style={{
                background: 'none',
                border: 'none',
                color: '#999',
                fontSize: 11,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                textDecoration: 'underline',
              }}
            >
              {removingId === e.id ? 'Removing…' : 'Remove'}
            </button>
          </div>
        ))
      )}
    </div>
  );
}

/** Compact row for the insight list (master pane) — headline + type + date
 * only, enough to scan and pick one. Full content lives in the detail pane. */
function InsightListRow({
  insight,
  active,
  onClick,
}: {
  insight: InsightVersion;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: active ? '#FDF2F8' : '#fff',
        border: 'none',
        borderLeft: `3px solid ${active ? PINK : 'transparent'}`,
        borderBottom: '1px solid #f0f0f0',
        padding: '12px 14px',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <span
          style={{ fontSize: 10.5, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 0.4 }}
        >
          {insight.type.replace(/_/g, ' ')}
        </span>
        <span style={{ fontSize: 10.5, color: '#bbb', whiteSpace: 'nowrap' }}>
          {new Date(insight.last_updated).toLocaleDateString()}
        </span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#111', marginTop: 3, lineHeight: 1.35 }}>
        {insight.headline}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        <span style={{ fontSize: 10.5, fontWeight: 600, color: bandColor(insight.confidence.band) }}>
          {insight.confidence.total}/10 confidence
        </span>
        {insight.urgency.is_urgent && <span style={{ fontSize: 10.5, fontWeight: 700, color: '#a33' }}>· urgent</span>}
      </div>
    </button>
  );
}

/** Detail pane — the full picture for one insight (PRD §15 "Insight detail"
 * as its own surface, separate from the list and the evidence drawer). */
function InsightDetail({
  insight,
  onFeedback,
  onInsightRetracted,
}: {
  insight: InsightVersion;
  onFeedback: (id: string, verdict: 'useful' | 'not_relevant') => void;
  onInsightRetracted: () => void;
}) {
  const [snoozing, setSnoozing] = useState(false);
  const [snoozed, setSnoozed] = useState(false);

  useEffect(() => {
    setSnoozed(false);
  }, [insight.id]);

  const handleSnooze = async () => {
    setSnoozing(true);
    try {
      const res = await MarketIntelligenceService.snoozeInsight(insight.id);
      if (res.status) {
        setSnoozed(true);
        // PRD §16: "Snoozing suppresses delivery, not evidence updates" —
        // the insight itself stays exactly where it is; only future
        // notifications for it stop.
        ToastService.showToast('Notifications for this insight are snoozed.', ToastTypeEnum.Success);
      } else {
        ToastService.showToast(res.responseMessage || 'Could not snooze this insight', ToastTypeEnum.Error);
      }
    } finally {
      setSnoozing(false);
    }
  };

  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {insight.type.replace(/_/g, ' ')}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#111', marginTop: 4 }}>{insight.headline}</div>

      <p style={{ fontSize: 13.5, color: '#444', marginTop: 12, lineHeight: 1.55 }}>{insight.observed_change}</p>
      <p style={{ fontSize: 13.5, color: '#666', marginTop: 6, lineHeight: 1.55, fontStyle: 'italic' }}>
        {insight.business_implication}
      </p>

      {insight.coverage_note && (
        <div style={{ fontSize: 12, color: '#c98a1f', marginTop: 8 }}>⚠ {insight.coverage_note}</div>
      )}

      {insight.assumptions.length > 0 && (
        <div style={{ fontSize: 11.5, color: '#999', marginTop: 8 }}>Assumptions: {insight.assumptions.join('; ')}</div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        <ScorePill label="Confidence" score={insight.confidence} />
        <ScorePill label="Relevance" score={insight.relevance} />
        {insight.urgency.is_urgent && (
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: '#a33',
              border: '1px solid #a33',
              borderRadius: 20,
              padding: '3px 10px',
            }}
          >
            Urgent{insight.urgency.deadline ? ` · by ${new Date(insight.urgency.deadline).toLocaleDateString()}` : ''}
          </span>
        )}
      </div>

      <div
        style={{
          marginTop: 14,
          padding: '10px 12px',
          background: '#FDF2F8',
          borderRadius: 8,
          fontSize: 13,
          color: '#7a1a4a',
        }}
      >
        <strong>Suggested next step:</strong> {insight.suggested_next_step}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        <button
          style={{ ...secondaryButtonStyle, padding: '9px 12px' }}
          onClick={() => onFeedback(insight.id, 'useful')}
        >
          👍 Useful
        </button>
        <button
          style={{ ...secondaryButtonStyle, padding: '9px 12px' }}
          onClick={() => onFeedback(insight.id, 'not_relevant')}
        >
          Not relevant
        </button>
        <button
          style={{ ...secondaryButtonStyle, padding: '9px 12px' }}
          onClick={handleSnooze}
          disabled={snoozing || snoozed}
        >
          {snoozed ? '🔕 Snoozed' : snoozing ? 'Snoozing…' : '🔕 Snooze notifications'}
        </button>
      </div>

      <EvidenceDrawer key={insight.id} insightId={insight.id} onInsightRetracted={onInsightRetracted} />
    </div>
  );
}

const DEV_STATUS_LABEL: Record<DevelopmentStatus, string> = {
  date_to_confirm: 'Date to confirm',
  scheduled: 'Scheduled',
  postponed: 'Postponed',
  cancelled: 'Cancelled',
  occurred: 'Occurred',
};

const DEV_STATUS_COLOR: Record<DevelopmentStatus, string> = {
  date_to_confirm: '#999',
  scheduled: '#1a9c4a',
  postponed: '#c98a1f',
  cancelled: '#a33',
  occurred: '#888',
};

/** PRD §15 "Upcoming items" surface — deadline, verification and preparation
 * steps for developments extracted from evidence classified as
 * upcoming_development. "Track development" here means marking postponed,
 * cancelled or occurred; §13: this revises the same item, never creates a
 * new one. */
function DevelopmentsSection({ developments, onUpdated }: { developments: Development[]; onUpdated: () => void }) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  if (developments.length === 0) return null;

  const handleUpdate = async (id: string, status: DevelopmentStatus) => {
    setUpdatingId(id);
    try {
      const res = await MarketIntelligenceService.updateDevelopment(id, status);
      if (res.status) {
        ToastService.showToast(`Marked ${DEV_STATUS_LABEL[status].toLowerCase()}.`, ToastTypeEnum.Success);
        onUpdated();
      } else {
        ToastService.showToast(res.responseMessage || 'Could not update this item', ToastTypeEnum.Error);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#999', textTransform: 'uppercase', marginBottom: 8 }}>
        Upcoming items
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {developments.map((d) => (
          <div key={d.id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{d.headline}</div>
                <div style={{ fontSize: 11.5, color: '#888', marginTop: 3 }}>
                  {d.issuer ?? 'Unverified issuer'}
                  {d.location ? ` · ${d.location}` : ''}
                  {' · '}
                  {d.event_date ? new Date(d.event_date).toLocaleDateString() : 'Date to confirm'}
                </div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: DEV_STATUS_COLOR[d.status], whiteSpace: 'nowrap' }}>
                {DEV_STATUS_LABEL[d.status]}
              </span>
            </div>

            {d.preparation_action && (
              <div style={{ fontSize: 12.5, color: '#444', marginTop: 8 }}>
                <strong>Prepare:</strong> {d.preparation_action}
              </div>
            )}
            {d.registration_deadline && (
              <div style={{ fontSize: 11.5, color: '#c98a1f', marginTop: 4 }}>
                Registration deadline: {new Date(d.registration_deadline).toLocaleDateString()}
              </div>
            )}
            {d.source_url && (
              <div style={{ marginTop: 4 }}>
                <a href={d.source_url} target="_blank" rel="noreferrer" style={{ fontSize: 11.5, color: PINK }}>
                  View source
                </a>
              </div>
            )}

            {(d.status === 'scheduled' || d.status === 'postponed') && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button
                  style={{ ...secondaryButtonStyle, padding: '6px 12px', fontSize: 12 }}
                  disabled={updatingId === d.id}
                  onClick={() => handleUpdate(d.id, 'postponed')}
                >
                  Mark postponed
                </button>
                <button
                  style={{ ...secondaryButtonStyle, padding: '6px 12px', fontSize: 12 }}
                  disabled={updatingId === d.id}
                  onClick={() => handleUpdate(d.id, 'cancelled')}
                >
                  Mark cancelled
                </button>
                <button
                  style={{ ...secondaryButtonStyle, padding: '6px 12px', fontSize: 12 }}
                  disabled={updatingId === d.id}
                  onClick={() => handleUpdate(d.id, 'occurred')}
                >
                  Mark occurred
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Uri Market Intelligence — first pass (PRD "Uri Market Intelligence" v1.0).
 * Master-detail layout: a scannable insight list (PRD §15 "Intelligence home")
 * next to a full detail pane (§15 "Insight detail") with its evidence drawer
 * nested inside — three distinct surfaces per the PRD, laid out side by side
 * instead of stacked-and-expanding so switching between insights doesn't
 * require re-scrolling past the ones already read. Scans run against the mock
 * adapter only until a real provider adapter lands in uri-social-backend's
 * scan_runner.ADAPTER_REGISTRY — see that file's own module docstring for the
 * current state of the pipeline.
 */
export default function MarketIntelligencePage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [insights, setInsights] = useState<InsightVersion[]>([]);
  const [developments, setDevelopments] = useState<Development[]>([]);
  const [budget, setBudget] = useState<BrandBudget | null>(null);
  const [preferences, setPreferences] = useState<MINotificationPreferences | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [question, setQuestion] = useState('');
  const [creating, setCreating] = useState(false);
  const [scanningTopicId, setScanningTopicId] = useState<string | null>(null);

  const loadDevelopments = async () => {
    const res = await MarketIntelligenceService.listDevelopments();
    if (res.status) setDevelopments(res.responseData ?? []);
  };

  const loadBudget = async () => {
    const res = await MarketIntelligenceService.getBudget();
    if (res.status) setBudget(res.responseData ?? null);
  };

  const loadPreferences = async () => {
    const res = await MarketIntelligenceService.getPreferences();
    if (res.status) setPreferences(res.responseData ?? null);
  };

  const handleToggleEmail = async () => {
    if (!preferences) return;
    const res = await MarketIntelligenceService.updatePreferences({ email_enabled: !preferences.email_enabled });
    if (res.status) {
      setPreferences(res.responseData ?? null);
      ToastService.showToast(
        res.responseData?.email_enabled ? 'Email alerts turned on.' : 'Email alerts turned off.',
        ToastTypeEnum.Success
      );
    }
  };

  const loadAll = async (preserveSelection = true) => {
    const [topicsRes, insightsRes] = await Promise.all([
      MarketIntelligenceService.listTopics(),
      MarketIntelligenceService.listInsights(),
    ]);
    loadDevelopments();
    loadBudget();
    if (topicsRes.status) setTopics(topicsRes.responseData ?? []);
    if (insightsRes.status) {
      const list = insightsRes.responseData ?? [];
      setInsights(list);
      setSelectedId((prev) => {
        if (preserveSelection && prev && list.some((i) => i.id === prev)) return prev;
        return list[0]?.id ?? null;
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAll(false);
    loadPreferences();
  }, []);

  const handleCreateTopic = async () => {
    if (!question.trim()) return;
    setCreating(true);
    try {
      const res = await MarketIntelligenceService.createTopic({ question: question.trim(), sources: ['mock'] });
      if (res.status && res.responseData) {
        setTopics((prev) => [res.responseData as Topic, ...prev]);
        setQuestion('');
        setShowNewTopic(false);
        ToastService.showToast('Topic created — click "Run scan" to collect evidence.', ToastTypeEnum.Success);
      } else {
        ToastService.showToast(res.responseMessage || 'Could not create topic', ToastTypeEnum.Error);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleRunScan = async (topicId: string) => {
    setScanningTopicId(topicId);
    try {
      // PRD §9: "Before running, show the accessible period... A shorter
      // available period must never silently replace the requested one" —
      // surfaced here, before the scan starts, not discovered afterward.
      const previewRes = await MarketIntelligenceService.getCoveragePreview(topicId);
      if (previewRes.status) {
        for (const p of previewRes.responseData ?? []) {
          if (p.capped && p.note) {
            ToastService.showToast(p.note, ToastTypeEnum.Warning);
          }
        }
      }

      const res = await MarketIntelligenceService.startScan(topicId);
      if (!res.status || !res.responseData) {
        ToastService.showToast(res.responseMessage || 'Could not start scan', ToastTypeEnum.Error);
        setScanningTopicId(null);
        return;
      }
      // PRD §16 budget-limited copy: a BUDGET_LIMITED run is created but
      // never actually executed (see the backend's create_scan_run) — it
      // will never progress through collecting/analysing, so this must be
      // caught immediately rather than left to time out after 30 polls.
      if (res.responseData.status === 'budget_limited') {
        setScanningTopicId(null);
        ToastService.showToast('This scan reached its collection limit. Results are partial.', ToastTypeEnum.Warning);
        loadBudget();
        return;
      }

      const scanId = res.responseData.id;
      // Simple poll — a scan against the mock adapter finishes in well under a
      // second, but this holds for a real provider adapter too since status
      // moves through the same queued/collecting/analysing/completed states
      // regardless of how long collection actually takes.
      const poll = async (attempt: number) => {
        const scanRes = await MarketIntelligenceService.getScan(scanId);
        const status = scanRes.responseData?.status;
        if (status === 'completed' || status === 'partial' || status === 'failed' || status === 'budget_limited') {
          setScanningTopicId(null);
          await loadAll();
          loadBudget();
          if (status === 'budget_limited') {
            ToastService.showToast(
              'This scan reached its collection limit. Results are partial.',
              ToastTypeEnum.Warning
            );
          } else if (status === 'partial') {
            ToastService.showToast(
              'Scan finished with some gaps — see insight cards for details.',
              ToastTypeEnum.Success
            );
          } else if (status === 'failed') {
            ToastService.showToast('Scan failed.', ToastTypeEnum.Error);
          } else {
            ToastService.showToast('Scan complete.', ToastTypeEnum.Success);
          }
          return;
        }
        if (attempt > 30) {
          setScanningTopicId(null);
          ToastService.showToast('Scan is taking longer than expected — check back shortly.', ToastTypeEnum.Error);
          return;
        }
        setTimeout(() => poll(attempt + 1), 1000);
      };
      poll(0);
    } catch {
      setScanningTopicId(null);
      ToastService.showToast('Could not start scan', ToastTypeEnum.Error);
    }
  };

  const handleFeedback = async (insightId: string, verdict: 'useful' | 'not_relevant') => {
    const res = await MarketIntelligenceService.submitFeedback(insightId, verdict);
    if (res.status) {
      ToastService.showToast('Thanks for the feedback.', ToastTypeEnum.Success);
      if (verdict === 'not_relevant') {
        setInsights((prev) => {
          const next = prev.filter((i) => i.id !== insightId);
          setSelectedId((prevSelected) => (prevSelected === insightId ? (next[0]?.id ?? null) : prevSelected));
          return next;
        });
      }
    }
  };

  const handleInsightRetracted = () => {
    loadAll(false);
  };

  const selectedInsight = insights.find((i) => i.id === selectedId) ?? null;

  return (
    <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111', margin: 0 }}>Market Intelligence</h2>
        <button style={buttonStyle} onClick={() => setShowNewTopic((s) => !s)}>
          + New topic
        </button>
      </div>
      <p style={{ fontSize: 13, color: '#888', marginTop: 4, marginBottom: 16 }}>
        What customers want, what stops them buying, and what's changing in your market — with evidence, not guesses.
      </p>

      {(budget || preferences) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          {budget && (
            <div style={{ fontSize: 11.5, color: '#999' }}>
              Budget this month: ${budget.spent_usd.toFixed(2)} spent
              {budget.reserved_usd > 0 ? ` + $${budget.reserved_usd.toFixed(2)} reserved` : ''} of $
              {budget.monthly_allowance_usd.toFixed(2)} allowance
            </div>
          )}
          {preferences && (
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11.5,
                color: '#666',
                cursor: 'pointer',
              }}
            >
              <input type="checkbox" checked={preferences.email_enabled} onChange={handleToggleEmail} />
              Email me about important findings
            </label>
          )}
        </div>
      )}

      {showNewTopic && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={{ fontSize: 12.5, color: '#666', marginBottom: 8 }}>
            Ask a plain question, e.g. &ldquo;What stops Lagos customers from ordering ready-to-wear clothes
            online?&rdquo;
          </div>
          <textarea
            style={{ ...inputStyle, minHeight: 60, resize: 'vertical', fontFamily: 'inherit' }}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What do you want to understand about your market?"
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button style={buttonStyle} onClick={handleCreateTopic} disabled={creating || !question.trim()}>
              {creating ? 'Creating…' : 'Create topic'}
            </button>
            <button style={secondaryButtonStyle} onClick={() => setShowNewTopic(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {topics.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#999', textTransform: 'uppercase', marginBottom: 8 }}>
            Topics
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {topics.map((t) => (
              <div
                key={t.id}
                style={{
                  ...cardStyle,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                }}
              >
                <div style={{ fontSize: 13, color: '#333' }}>{t.question}</div>
                <button
                  style={{ ...secondaryButtonStyle, padding: '6px 12px', fontSize: 12 }}
                  onClick={() => handleRunScan(t.id)}
                  disabled={scanningTopicId === t.id}
                >
                  {scanningTopicId === t.id ? 'Scanning…' : 'Run scan'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <DevelopmentsSection developments={developments} onUpdated={loadDevelopments} />

      <div style={{ fontSize: 12, fontWeight: 700, color: '#999', textTransform: 'uppercase', marginBottom: 8 }}>
        Insights
      </div>

      {loading ? (
        <div style={{ fontSize: 13, color: '#999' }}>Loading…</div>
      ) : insights.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', color: '#999', fontSize: 13 }}>
          {topics.length === 0
            ? 'Create a topic above to start understanding your market.'
            : 'No strong findings yet. Run a scan on a topic above, or try a broader question.'}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div
            style={{
              flex: '1 1 320px',
              minWidth: 280,
              maxWidth: 380,
              background: '#fff',
              border: '1.5px solid #eee',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            {insights.map((insight) => (
              <InsightListRow
                key={insight.id}
                insight={insight}
                active={insight.id === selectedId}
                onClick={() => setSelectedId(insight.id)}
              />
            ))}
          </div>

          <div style={{ flex: '2 1 480px', minWidth: 320 }}>
            {selectedInsight ? (
              <InsightDetail
                insight={selectedInsight}
                onFeedback={handleFeedback}
                onInsightRetracted={handleInsightRetracted}
              />
            ) : (
              <div style={{ ...cardStyle, textAlign: 'center', color: '#999', fontSize: 13 }}>
                Select an insight to see the full detail.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
