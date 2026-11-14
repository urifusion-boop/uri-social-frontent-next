'use client';

/**
 * Campaign Manager → Competitors (PRD Workstreams 2–4): who the business is up against, the
 * ads they run, and making the business's own version of an idea it likes.
 */
import type { DraftSummary } from '@/src/api/CampaignService';
import { Competitor, CompetitorAd, CompetitorList, CompetitorService } from '@/src/api/CompetitorService';
import { useIsMobile } from '@/src/hooks/useIsMobile';
import { useCallback, useEffect, useRef, useState } from 'react';
import AdComposer from './AdComposer';
import CompetitorSheet from './CompetitorSheet';
import BusinessesTab from './BusinessesTab';
import TheirAdsTab from './TheirAdsTab';
import { btn, C, errorText, font, Notice } from './ui';

type Tab = 'businesses' | 'ads';

export default function CompetitorsPage({
  onNavigate,
  onUseInWizard,
}: {
  onNavigate: (tab: string) => void;
  onUseInWizard: (draft: DraftSummary) => void;
}) {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<Tab>('businesses');
  const [data, setData] = useState<CompetitorList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adsFor, setAdsFor] = useState('');
  const [adCounts, setAdCounts] = useState<Record<string, number>>({});
  const [composing, setComposing] = useState<CompetitorAd | null>(null);
  const [sheet, setSheet] = useState<Competitor | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const discovering = data?.discovery?.status === 'queued' || data?.discovery?.status === 'running';

  const load = useCallback(async () => {
    try {
      setData(await CompetitorService.list());
      setError('');
    } catch (e) {
      setError(errorText(e, "Couldn't load your competitors. Try again."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [load]);

  // While Jane is searching, follow her progress; the list refreshes when she's done.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const job = data?.discovery;
    if (!job || !(job.status === 'queued' || job.status === 'running')) return;
    timer.current = setTimeout(async () => {
      try {
        const next = await CompetitorService.discovery(job.job_id);
        if (next.status === 'done' || next.status === 'failed') await load();
        else setData((d) => (d ? { ...d, discovery: next } : d));
      } catch {
        setData((d) => (d ? { ...d } : d));
      }
    }, job.poll_after_ms ?? 2500);
  }, [data, load]);

  const discover = async (force: boolean) => {
    setError('');
    try {
      const job = await CompetitorService.discover(force);
      setData((d) => ({ ...(d ?? { suggested: [], active: [], removed_count: 0, reasons: [] }), discovery: job }));
    } catch (e) {
      setError(errorText(e, "Jane couldn't start looking just now. Try again."));
    }
  };

  const competitors = [...(data?.active ?? [])];
  const tabs: [Tab, string][] = [
    ['businesses', `Businesses${data?.active.length ? ` · ${data.active.length}` : ''}`],
    ['ads', 'Their ads'],
  ];

  return (
    <div style={{ minHeight: '100%', background: 'linear-gradient(180deg, #FCE4EC 0%, #FBF8F7 40%, #FAFAF8 100%)' }}>
      <div style={{ ...font, maxWidth: 1040, margin: '0 auto', padding: isMobile ? '14px 12px 28px' : '18px 20px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.ink }}>Competitors</h2>
          <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#7a7270' }}>
            Who you&apos;re up against, the ads they run, and your own take on the ideas that work.
          </p>
        </div>
        <div role="tablist" style={{ display: 'flex', gap: 6 }}>
          {tabs.map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              style={{ ...btn(tab === key ? 'primary' : 'ghost'), padding: '6px 14px' }}
            >
              {label}
            </button>
          ))}
        </div>
        {error && <Notice>{error}</Notice>}
        {tab === 'businesses' ? (
          <BusinessesTab
            data={data}
            loading={loading}
            discovering={Boolean(discovering)}
            onDiscover={(force) => void discover(force)}
            onChange={setData}
            onOpenPlaybook={() => onNavigate('playbook')}
            adCounts={adCounts}
            onSeeAds={(id) => {
              setAdsFor(id);
              setTab('ads');
            }}
            onOpen={setSheet}
          />
        ) : (
          <TheirAdsTab
            competitors={competitors}
            competitorId={adsFor}
            onCompetitorChange={setAdsFor}
            onMakeOneLikeThis={setComposing}
            onCounts={setAdCounts}
          />
        )}
      </div>
      <CompetitorSheet
        competitor={sheet}
        onClose={() => setSheet(null)}
        onSeeAds={(id) => {
          setSheet(null);
          setAdsFor(id);
          setTab('ads');
        }}
      />
      {composing && <AdComposer ad={composing} onClose={() => setComposing(null)} onUseInCampaign={onUseInWizard} />}
    </div>
  );
}
