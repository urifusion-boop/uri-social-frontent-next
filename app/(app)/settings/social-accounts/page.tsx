'use client';

import { AvailablePage, SocialAccountService } from '@/src/api/SocialAccountService';
import { SocialMediaAgentService, SocialConnection } from '@/src/api/SocialMediaAgentService';
import DashboardLayout from '@/src/components/app/atoms/DashboardLayout';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { ToastService } from '@/src/utils/toast.util';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

const PLATFORMS = [
  { id: 'facebook',  label: 'Facebook',   emoji: '📘', color: '#1877F2', bg: '#E7F0FD' },
  { id: 'instagram', label: 'Instagram',  emoji: '📸', color: '#E4405F', bg: '#FDE7EC' },
  { id: 'linkedin',  label: 'LinkedIn',   emoji: '💼', color: '#0A66C2', bg: '#E7F0FA' },
  { id: 'twitter',   label: 'X / Twitter',emoji: '𝕏',  color: '#000',    bg: '#F0F0F0' },
  { id: 'tiktok',    label: 'TikTok',     emoji: '🎵', color: '#010101', bg: '#F0F0F0' },
  { id: 'youtube',   label: 'YouTube',    emoji: '▶️', color: '#FF0000', bg: '#FFEDED' },
  { id: 'pinterest', label: 'Pinterest',  emoji: '📌', color: '#E60023', bg: '#FFEAEC' },
];

function SocialAccountsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  // Pending page selection state
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [availablePages, setAvailablePages] = useState<AvailablePage[]>([]);
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const [networkName, setNetworkName] = useState('');
  const [phase, setPhase] = useState<'idle' | 'pending' | 'finalizing'>('idle');

  const fetchConnections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await SocialMediaAgentService.getConnections();
      if (res.status && res.responseData) {
        const raw = res.responseData as { connections?: Record<string, SocialConnection[]> };
        const flat: SocialConnection[] = Object.entries(raw.connections ?? {}).flatMap(([platform, conns]) =>
          conns.map((c) => ({ ...c, platform }))
        );
        setConnections(flat);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // Handle OAuth callback return (?sessionToken=...&connected=pending)
  useEffect(() => {
    const connected = searchParams.get('connected');
    const token = searchParams.get('sessionToken');

    if (connected === 'pending' && token) {
      setSessionToken(token);
      setPhase('pending');
      router.replace('/settings/social-accounts');
      SocialAccountService.getPendingConnection(token).then((res) => {
        if (res.status && res.responseData) {
          setAvailablePages(res.responseData.available_pages ?? []);
          setNetworkName(res.responseData.network ?? '');
        }
      }).catch(() => {
        ToastService.showToast('Could not load accounts. Please try again.', ToastTypeEnum.Error);
        setPhase('idle');
      });
    }

    if (connected === 'false') {
      const err = searchParams.get('error');
      ToastService.showToast(err ?? 'Connection failed. Please try again.', ToastTypeEnum.Error);
      router.replace('/settings/social-accounts');
    }
  }, [searchParams, router]);

  const handleConnect = async (platformId: string) => {
    setConnectingPlatform(platformId);
    try {
      const res = await SocialAccountService.initiateConnection([platformId], 'settings');
      if (res.status && res.responseData?.auth_urls) {
        const url = res.responseData.auth_urls[platformId];
        if (url) {
          // Store intent so brand-setup can redirect back here if Outstand strips ?source= from callback
          localStorage.setItem('outstand_connect_source', 'settings');
          window.location.href = url;
          return;
        }
      }
      ToastService.showToast('Could not start connection. Please try again.', ToastTypeEnum.Error);
    } catch {
      ToastService.showToast('Connection failed. Please try again.', ToastTypeEnum.Error);
    } finally {
      setConnectingPlatform(null);
    }
  };

  const handleFinalize = async () => {
    if (!sessionToken || selectedPageIds.length === 0) return;
    setPhase('finalizing');
    try {
      const res = await SocialAccountService.finalizeConnection(sessionToken, selectedPageIds);
      if (res.status) {
        const names = (res.responseData?.accounts_connected ?? []).map((a) => a.account_name || a.username).join(', ');
        ToastService.showToast(`Connected: ${names}`, ToastTypeEnum.Success);
        setPhase('idle');
        setSessionToken(null);
        setAvailablePages([]);
        setSelectedPageIds([]);
        fetchConnections();
      } else {
        ToastService.showToast('Finalization failed. Please try again.', ToastTypeEnum.Error);
        setPhase('pending');
      }
    } catch {
      ToastService.showToast('Finalization failed. Please try again.', ToastTypeEnum.Error);
      setPhase('pending');
    }
  };

  const handleDisconnect = async (outstandId: string) => {
    try {
      await SocialMediaAgentService.disconnectPlatform(outstandId);
      ToastService.showToast('Account disconnected.', ToastTypeEnum.Success);
      fetchConnections();
    } catch {
      ToastService.showToast('Could not disconnect. Please try again.', ToastTypeEnum.Error);
    }
  };

  const connectedPlatformIds = new Set(connections.map((c) => c.platform?.toLowerCase()));

  return (
    <DashboardLayout excludeHeader>
      <Box sx={{ backgroundColor: '#FAFAFA', minHeight: '100vh', pt: '52px' }}>
        {/* Header */}
        <Box sx={{ background: '#fff', px: 3, py: 3, borderBottom: '1px solid #E5E7EB' }}>
          <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#111' }}>Social Accounts</Typography>
          <Typography sx={{ fontSize: 13, color: '#6B7280', mt: 0.25 }}>
            Connect your social media accounts to publish and schedule posts
          </Typography>
        </Box>

        <Box sx={{ px: 3, py: 3, maxWidth: 680 }}>

          {/* Page selection overlay */}
          {phase !== 'idle' && (
            <Box sx={{ background: '#fff', borderRadius: 2, border: '1px solid #e5e3df', p: 3, mb: 3 }}>
              {phase === 'finalizing' ? (
                <Box textAlign="center" py={2}>
                  <CircularProgress size={32} sx={{ color: '#C2185B' }} />
                  <Typography sx={{ fontSize: 13, color: '#555', mt: 1.5 }}>Connecting accounts…</Typography>
                </Box>
              ) : (
                <>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#111', mb: 0.5 }}>
                    Select {networkName} accounts to connect
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: '#6B7280', mb: 2 }}>
                    Choose which pages or accounts you want URI to manage.
                  </Typography>
                  {availablePages.length === 0 ? (
                    <Typography sx={{ fontSize: 13, color: '#999', textAlign: 'center', py: 2 }}>
                      No accounts found. Make sure you have admin access to at least one page.
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                      {availablePages.map((page) => (
                        <Box
                          key={page.id}
                          onClick={() => setSelectedPageIds((prev) =>
                            prev.includes(page.id) ? prev.filter((x) => x !== page.id) : [...prev, page.id]
                          )}
                          sx={{
                            display: 'flex', alignItems: 'center', gap: 1.5,
                            p: 1.5, borderRadius: 1.5, cursor: 'pointer',
                            border: `2px solid ${selectedPageIds.includes(page.id) ? '#C2185B' : '#e5e3df'}`,
                            background: selectedPageIds.includes(page.id) ? '#fdf0f6' : '#fff',
                            transition: 'all 0.15s',
                          }}
                        >
                          {page.profilePictureUrl && (
                            <img src={page.profilePictureUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                          )}
                          <Box>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{page.name}</Typography>
                            {page.username && <Typography sx={{ fontSize: 11, color: '#999' }}>@{page.username}</Typography>}
                          </Box>
                          <Box sx={{ ml: 'auto', width: 18, height: 18, borderRadius: '50%', border: '2px solid', borderColor: selectedPageIds.includes(page.id) ? '#C2185B' : '#ccc', background: selectedPageIds.includes(page.id) ? '#C2185B' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {selectedPageIds.includes(page.id) && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <button
                      onClick={() => { setPhase('idle'); setSessionToken(null); setAvailablePages([]); setSelectedPageIds([]); }}
                      style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid #e5e3df', background: '#fff', color: '#666', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleFinalize}
                      disabled={selectedPageIds.length === 0}
                      style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: selectedPageIds.length > 0 ? '#C2185B' : '#e5e3df', color: '#fff', fontSize: 13, fontWeight: 700, cursor: selectedPageIds.length > 0 ? 'pointer' : 'not-allowed' }}
                    >
                      Connect {selectedPageIds.length > 0 ? `(${selectedPageIds.length})` : ''}
                    </button>
                  </Box>
                </>
              )}
            </Box>
          )}

          {/* Connected accounts */}
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}><CircularProgress sx={{ color: '#C2185B' }} /></Box>
          ) : connections.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 0.6, mb: 1.5 }}>
                Connected
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {connections.map((conn, i) => {
                  const pl = PLATFORMS.find((p) => p.id === conn.platform?.toLowerCase());
                  return (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, background: '#fff', borderRadius: 2, border: '1px solid #e5e3df' }}>
                      <Box sx={{ width: 36, height: 36, borderRadius: 10, background: pl?.bg ?? '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                        {pl?.emoji ?? '🌐'}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#111', textTransform: 'capitalize' }}>{conn.platform}</Typography>
                        <Typography sx={{ fontSize: 12, color: '#6B7280' }}>{conn.page_name ?? 'Connected'}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: 20 }}>Active</span>
                        <button
                          onClick={() => handleDisconnect((conn as any).outstand_account_id ?? conn.page_id ?? '')}
                          style={{ background: 'none', border: 'none', color: '#bbb', fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: '2px 4px' }}
                          title="Disconnect"
                        >×</button>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}

          {/* Available platforms */}
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 0.6, mb: 1.5 }}>
            {connections.length > 0 ? 'Add More Accounts' : 'Connect an Account'}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {PLATFORMS.map((pl) => {
              const isConnected = connectedPlatformIds.has(pl.id);
              const isConnecting = connectingPlatform === pl.id;
              return (
                <Box key={pl.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, background: '#fff', borderRadius: 2, border: '1px solid #e5e3df' }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: 10, background: pl.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    {pl.emoji}
                  </Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111', flex: 1 }}>{pl.label}</Typography>
                  {isConnected ? (
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#16a34a', background: '#dcfce7', padding: '2px 10px', borderRadius: 20 }}>Connected</span>
                  ) : (
                    <button
                      onClick={() => handleConnect(pl.id)}
                      disabled={isConnecting}
                      style={{
                        padding: '6px 14px', borderRadius: 8, border: `1.5px solid ${pl.color}`,
                        background: '#fff', color: pl.color, fontSize: 12.5, fontWeight: 700,
                        cursor: isConnecting ? 'not-allowed' : 'pointer', opacity: isConnecting ? 0.6 : 1,
                        fontFamily: 'var(--wf)',
                      }}
                    >
                      {isConnecting ? 'Opening…' : 'Connect'}
                    </button>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    </DashboardLayout>
  );
}

export default function SocialAccountsPage() {
  return (
    <Suspense fallback={<Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh"><CircularProgress sx={{ color: '#CD1B78' }} /></Box>}>
      <SocialAccountsContent />
    </Suspense>
  );
}
