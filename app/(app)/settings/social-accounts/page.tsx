'use client';

import { AvailablePage, SocialAccountService } from '@/src/api/SocialAccountService';
import { SocialMediaAgentService, SocialConnection } from '@/src/api/SocialMediaAgentService';
import DashboardLayout from '@/src/components/app/atoms/DashboardLayout';
import CustomButton from '@/src/components/app/atoms/CustomButton';
import useCustomTheme from '@/src/hooks/theme.hook';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { ToastService } from '@/src/utils/toast.util';
import { Box, CircularProgress, Checkbox, Typography } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { FaFacebook, FaInstagram, FaLinkedin, FaCheckCircle, FaTimes } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { BsYoutube, BsPinterest, BsTiktok } from 'react-icons/bs';

const PLATFORMS = [
  {
    id: 'facebook',
    label: 'Facebook',
    icon: FaFacebook,
    emoji: '📘',
    color: '#1877F2',
    bg: '#E7F0FD',
    comingSoon: false,
  },
  {
    id: 'instagram',
    label: 'Instagram',
    icon: FaInstagram,
    emoji: '📸',
    color: '#E4405F',
    bg: '#FDE7EC',
    comingSoon: false,
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: FaLinkedin,
    emoji: '💼',
    color: '#0A66C2',
    bg: '#E7F0FA',
    comingSoon: false,
  },
  { id: 'twitter', label: 'X / Twitter', icon: FaXTwitter, emoji: '𝕏', color: '#000', bg: '#F0F0F0', comingSoon: true },
  { id: 'tiktok', label: 'TikTok', icon: BsTiktok, emoji: '🎵', color: '#010101', bg: '#F0F0F0', comingSoon: true },
  { id: 'youtube', label: 'YouTube', icon: BsYoutube, emoji: '▶️', color: '#FF0000', bg: '#FFEDED', comingSoon: true },
  {
    id: 'pinterest',
    label: 'Pinterest',
    icon: BsPinterest,
    emoji: '📌',
    color: '#E60023',
    bg: '#FFEAEC',
    comingSoon: true,
  },
];

const AgentBubble = ({ children, primary }: { children: React.ReactNode; primary: string }) => (
  <Box
    sx={{
      p: 2,
      borderRadius: '12px',
      background: `linear-gradient(135deg, ${primary}, ${primary}cc)`,
      color: '#fff',
      fontSize: 14,
      fontWeight: 500,
      lineHeight: 1.5,
      boxShadow: `0 2px 8px ${primary}33`,
      mb: 2,
    }}
  >
    {children}
  </Box>
);

function SocialAccountsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { themeColors } = useCustomTheme();
  const primary = themeColors.primary;

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

  // Handle OAuth callback return
  useEffect(() => {
    const connected = searchParams.get('connected');
    const token = searchParams.get('sessionToken');

    // Instagram direct OAuth callback
    if (connected === 'instagram_direct') {
      const igUserId = searchParams.get('ig_user_id') ?? '';
      const igUsername = searchParams.get('username') ?? 'Instagram';
      router.replace('/settings/social-accounts');
      if (igUserId) {
        SocialAccountService.finalizeInstagramDirect(igUserId)
          .then((res) => {
            if (res.status) {
              ToastService.showToast(`Instagram @${igUsername} connected!`, ToastTypeEnum.Success);
              fetchConnections();
            } else {
              ToastService.showToast('Instagram connection failed. Please try again.', ToastTypeEnum.Error);
            }
          })
          .catch(() => {
            ToastService.showToast('Instagram connection failed. Please try again.', ToastTypeEnum.Error);
          });
      }
    }

    if (connected === 'pending' && token) {
      setSessionToken(token);
      setPhase('pending');
      router.replace('/settings/social-accounts');
      SocialAccountService.getPendingConnection(token)
        .then((res) => {
          if (res.status && res.responseData) {
            setAvailablePages(res.responseData.available_pages ?? []);
            setNetworkName(res.responseData.network ?? '');
          }
        })
        .catch(() => {
          ToastService.showToast('Could not load accounts. Please try again.', ToastTypeEnum.Error);
          setPhase('idle');
        });
    }

    if (connected === 'false') {
      const err = searchParams.get('error');
      ToastService.showToast(err ?? 'Connection failed. Please try again.', ToastTypeEnum.Error);
      router.replace('/settings/social-accounts');
    }
  }, [searchParams, router, fetchConnections]);

  const handleConnect = async (platformId: string) => {
    // Instagram uses direct OAuth — bypass Outstand entirely
    if (platformId === 'instagram') {
      const apiBase = process.env.NEXT_PUBLIC_URI_API_BASE_URL ?? '';
      window.location.href = `${apiBase}/social-media/connect/instagram-direct/initiate?source=settings`;
      return;
    }

    setConnectingPlatform(platformId);
    try {
      const res = await SocialAccountService.initiateConnection([platformId], 'settings');
      if (res.status && res.responseData?.auth_urls) {
        const url = res.responseData.auth_urls[platformId];
        if (url) {
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
    if (!outstandId) {
      ToastService.showToast('Could not disconnect. Please try again.', ToastTypeEnum.Error);
      return;
    }
    try {
      await SocialMediaAgentService.disconnectPlatform(outstandId);
      ToastService.showToast('Account disconnected.', ToastTypeEnum.Success);
      fetchConnections();
    } catch {
      ToastService.showToast('Could not disconnect. Please try again.', ToastTypeEnum.Error);
    }
  };

  const handlePageToggle = (id: string) =>
    setSelectedPageIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const connectedPlatformIds = new Set(connections.map((c) => c.platform?.toLowerCase()));

  if (phase === 'finalizing') {
    return (
      <DashboardLayout>
        <Box sx={{ background: themeColors.background, minHeight: '100vh', pt: '80px', px: 3 }}>
          <Box sx={{ maxWidth: 680, mx: 'auto', textAlign: 'center', py: 6 }}>
            <CircularProgress size={48} sx={{ color: primary, mb: 2 }} />
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>
              Connecting your accounts...
            </Typography>
          </Box>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ background: themeColors.background, minHeight: '100vh', pt: '80px', px: { xs: 2, sm: 3 }, pb: 6 }}>
        <Box sx={{ maxWidth: 680, mx: 'auto' }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 3 }}>
            <Box>
              <Typography sx={{ fontSize: { xs: 20, sm: 24 }, fontWeight: 800, color: '#111', mb: 0.5 }}>
                Social Accounts
              </Typography>
              <Typography sx={{ fontSize: { xs: 12, sm: 13 }, color: '#6B7280' }}>
                Connect your social media accounts to publish and schedule posts
              </Typography>
            </Box>
            <button
              onClick={() => router.push('/workspace?tab=settings')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'none',
                border: '1.5px solid #E0DEF7',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: '#555',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <ArrowBack sx={{ fontSize: 15 }} /> Settings
            </button>
          </Box>

          {/* Page selection overlay */}
          {phase === 'pending' && (
            <Box
              sx={{
                background: '#fff',
                borderRadius: '20px',
                p: 3.5,
                boxShadow: '1px 1px 6px 3px #00000011',
                mb: 3,
              }}
            >
              <AgentBubble primary={primary}>
                Great! Choose which {networkName} accounts you want to manage through URI Social.
              </AgentBubble>
              <Box mt={1.5} display="flex" flexDirection="column" gap={1.25} mb={2.5}>
                {availablePages.length === 0 ? (
                  <Typography sx={{ fontSize: 13, color: '#6C727F', py: 2, textAlign: 'center' }}>
                    No accounts found. Make sure you have admin access to at least one page.
                  </Typography>
                ) : (
                  availablePages.map((page) => {
                    const isSelected = selectedPageIds.includes(page.id);
                    const isInstagram = page.type === 'instagram_business_account' || page.network === 'instagram';
                    return (
                      <Box
                        key={page.id}
                        onClick={() => handlePageToggle(page.id)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          p: 2,
                          borderRadius: '12px',
                          border: '2px solid',
                          borderColor: isSelected ? primary : '#E0DEF7',
                          background: isSelected ? `${primary}0D` : '#fff',
                          cursor: 'pointer',
                          transition: 'all 0.18s',
                          '&:hover': { borderColor: primary },
                        }}
                      >
                        {page.profilePictureUrl ? (
                          <img
                            src={page.profilePictureUrl}
                            alt={page.name}
                            style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              bgcolor: isInstagram ? '#FDE7EC' : '#E7F0FD',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 18,
                            }}
                          >
                            {isInstagram ? '📸' : '📘'}
                          </Box>
                        )}
                        <Box flex={1}>
                          <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#374151' }}>
                            {page.name}
                          </Typography>
                          {page.username && (
                            <Typography sx={{ fontSize: 12, color: '#9CA3AF' }}>@{page.username}</Typography>
                          )}
                        </Box>
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handlePageToggle(page.id)}
                          onClick={(e) => e.stopPropagation()}
                          sx={{ p: 0, color: '#E0DEF7', '&.Mui-checked': { color: primary } }}
                        />
                      </Box>
                    );
                  })
                )}
              </Box>
              {/* Instagram-not-detected notice */}
              {(() => {
                const fbPages = availablePages.filter(
                  (p) => p.type !== 'instagram_business_account' && p.network !== 'instagram'
                );
                const igLinkedIds = new Set(
                  availablePages
                    .filter((p) => p.type === 'instagram_business_account' || p.network === 'instagram')
                    .map((p) => p.linked_page_id)
                );
                const pagesWithoutIg = fbPages.filter((p) => !igLinkedIds.has(p.id));
                if (pagesWithoutIg.length === 0 || availablePages.length === 0) return null;
                return (
                  <Box
                    sx={{
                      mb: 2,
                      p: 1.5,
                      borderRadius: '10px',
                      background: '#FEF9C3',
                      border: '1px solid #FDE68A',
                    }}
                  >
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#92400E', mb: 0.5 }}>
                      Instagram not auto-detected for: {pagesWithoutIg.map((p) => p.name).join(', ')}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: '#78350F', lineHeight: 1.6 }}>
                      Connect Instagram separately — go back and select <strong>Instagram</strong> as its own platform.
                      This gives Instagram its own direct connection with full publishing access.
                    </Typography>
                  </Box>
                );
              })()}
              <Box display="flex" gap={1.5} alignItems="center">
                <CustomButton
                  mode="primary"
                  onClick={handleFinalize}
                  disabled={selectedPageIds.length === 0}
                  style={{ padding: '10px 24px', opacity: selectedPageIds.length > 0 ? 1 : 0.5 }}
                >
                  Connect{' '}
                  {selectedPageIds.length > 0
                    ? `${selectedPageIds.length} account${selectedPageIds.length !== 1 ? 's' : ''}`
                    : 'accounts'}
                </CustomButton>
                <Typography
                  component="button"
                  onClick={() => {
                    setPhase('idle');
                    setSessionToken(null);
                    setAvailablePages([]);
                    setSelectedPageIds([]);
                  }}
                  sx={{
                    background: 'none',
                    border: 'none',
                    color: '#9CA3AF',
                    fontSize: 12.5,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    textUnderlineOffset: 3,
                    p: 0,
                  }}
                >
                  Cancel
                </Typography>
              </Box>
            </Box>
          )}

          {/* Connected accounts */}
          {loading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress sx={{ color: primary }} />
            </Box>
          ) : (
            <Box
              sx={{
                background: '#fff',
                borderRadius: '20px',
                p: 3.5,
                boxShadow: '1px 1px 6px 3px #00000011',
              }}
            >
              {connections.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography
                    sx={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#9CA3AF',
                      textTransform: 'uppercase',
                      letterSpacing: 0.8,
                      mb: 1.5,
                    }}
                  >
                    Connected
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {connections.map((conn, i) => {
                      const pl = PLATFORMS.find((p) => p.id === conn.platform?.toLowerCase());
                      const IconComponent = pl?.icon || FaCheckCircle;
                      return (
                        <Box
                          key={i}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            p: 1.5,
                            borderRadius: '10px',
                            border: '1px solid #E0DEF7',
                            background: '#FAFBFC',
                          }}
                        >
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '8px',
                              background: pl?.bg ?? '#f0f0f0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <IconComponent size={20} color={pl?.color ?? '#666'} />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              sx={{ fontSize: 13, fontWeight: 700, color: '#111', textTransform: 'capitalize' }}
                            >
                              {conn.platform}
                            </Typography>
                            <Typography sx={{ fontSize: 11.5, color: '#6B7280' }}>
                              {conn.page_name ?? 'Connected'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                fontSize: 10,
                                fontWeight: 600,
                                color: '#16a34a',
                                background: '#dcfce7',
                                px: 1.5,
                                py: 0.5,
                                borderRadius: '20px',
                              }}
                            >
                              Active
                            </Box>
                            <button
                              onClick={() => handleDisconnect(conn.outstand_account_id ?? '')}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#bbb',
                                fontSize: 22,
                                cursor: 'pointer',
                                lineHeight: 1,
                                padding: '0 4px',
                              }}
                              title="Disconnect"
                            >
                              <FaTimes />
                            </button>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              )}

              {/* Available platforms */}
              <Box>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#9CA3AF',
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                    mb: 1.5,
                  }}
                >
                  {connections.length > 0 ? 'Connect Another Account' : 'Connect an Account'}
                </Typography>
                <AgentBubble primary={primary}>
                  To publish content, connect a social account. You can add more platforms anytime.
                </AgentBubble>
                <Box mt={1.5} display="flex" flexDirection="column" gap={1.5}>
                  {PLATFORMS.map((pl) => {
                    const isConnected = connectedPlatformIds.has(pl.id);
                    const isConnecting = connectingPlatform === pl.id;
                    const IconComponent = pl.icon;
                    return (
                      <Box
                        key={pl.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          p: 2,
                          borderRadius: '12px',
                          border: '2px solid #E0DEF7',
                          background: pl.comingSoon ? '#FAFAFA' : '#fff',
                          opacity: pl.comingSoon ? 0.7 : 1,
                          transition: 'all 0.18s',
                          '&:hover': { borderColor: pl.comingSoon || isConnected ? '#E0DEF7' : primary },
                        }}
                      >
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: '10px',
                            bgcolor: pl.bg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <IconComponent size={24} color={pl.comingSoon ? '#aaa' : pl.color} />
                        </Box>
                        <Box flex={1}>
                          <Typography
                            sx={{ fontSize: 14, fontWeight: 700, color: pl.comingSoon ? '#9CA3AF' : '#374151' }}
                          >
                            {pl.label}
                          </Typography>
                        </Box>
                        {pl.comingSoon ? (
                          <Box
                            sx={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: '#6B7280',
                              background: '#F3F4F6',
                              border: '1px solid #E5E7EB',
                              px: 2,
                              py: 1,
                              borderRadius: '20px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Coming Soon
                          </Box>
                        ) : isConnected ? (
                          <Box
                            sx={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: '#16a34a',
                              background: '#dcfce7',
                              px: 2,
                              py: 1,
                              borderRadius: '20px',
                            }}
                          >
                            Connected
                          </Box>
                        ) : (
                          <CustomButton
                            mode="secondary"
                            onClick={() => handleConnect(pl.id)}
                            disabled={isConnecting}
                            style={{ padding: '8px 20px', fontSize: 12, opacity: isConnecting ? 0.6 : 1 }}
                          >
                            {isConnecting ? 'Opening...' : 'Connect'}
                          </CustomButton>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </DashboardLayout>
  );
}

export default function SocialAccountsPage() {
  return (
    <Suspense
      fallback={
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress sx={{ color: '#CD1B78' }} />
        </Box>
      }
    >
      <SocialAccountsContent />
    </Suspense>
  );
}
