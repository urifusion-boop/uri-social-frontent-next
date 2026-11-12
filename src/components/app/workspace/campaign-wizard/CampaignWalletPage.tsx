/**
 * "Ad Wallet" — Campaign Manager's new sidebar sub-item for what the old chat page
 * kept as an internal tab: the balance Jane spends from on Meta/TikTok/Google, kept
 * separate from Uri Social's own subscription billing (sidebar's "Budget & Billing",
 * a different balance entirely). Reuses WalletTab unchanged — only the page wrapper
 * and the data-fetching it owned inline before are new, so this works as a real
 * sidebar destination on its own.
 */
'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useIsMobile } from '@/src/hooks/useIsMobile';
import { CampaignService, WalletInfo } from '@/src/api/CampaignService';
import { WalletTab } from '../CampaignsPage';

export default function CampaignWalletPage() {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const loadedOnce = useRef(false);
  const isMobile = useIsMobile();

  const load = useCallback(async () => {
    if (!loadedOnce.current) setLoading(true);
    try {
      setWallet(await CampaignService.getWallet());
      loadedOnce.current = true;
    } catch {
      if (!loadedOnce.current) setWallet(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div style={{ minHeight: '100%', background: 'linear-gradient(180deg, #FCE4EC 0%, #FBF8F7 40%, #FAFAF8 100%)' }}>
      {/* WalletTab brings its own padding (shared with the chat page's wallet tab,
          which has no wrapper of its own to supply it) — only the heading gets this
          page's usual max-width/side padding, so the two don't stack. */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '14px 12px 0' : '18px 20px 0' }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1a0a12' }}>Ad Wallet</h2>
        <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#7a7270' }}>
          Fund what Jane spends on Meta, TikTok and Google — separate from your Uri Social subscription.
        </p>
      </div>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <WalletTab wallet={wallet} loading={loading} onFunded={load} />
      </div>
    </div>
  );
}
