'use client';

import { AvailablePage, SocialAccountService } from '@/src/api/SocialAccountService';
import { SocialMediaAgentService, SocialConnection } from '@/src/api/SocialMediaAgentService';
import DashboardLayout from '@/src/components/app/atoms/DashboardLayout';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { ToastService } from '@/src/utils/toast.util';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const PLATFORMS = [
  { id: 'facebook', label: 'Facebook', emoji: '📘', color: '#1877F2', bg: '#E7F0FD' },
  { id: 'instagram', label: 'Instagram', emoji: '📸', color: '#E4405F', bg: '#FDE7EC' },
  { id: 'linkedin', label: 'LinkedIn', emoji: '💼', color: '#0A66C2', bg: '#E7F0FA' },
  { id: 'twitter', label: 'X / Twitter', emoji: '𝕏', color: '#000', bg: '#F0F0F0' },
  { id: 'tiktok', label: 'TikTok', emoji: '🎵', color: '#010101', bg: '#F0F0F0' },
  { id: 'youtube', label: 'YouTube', emoji: '▶️', color: '#FF0000', bg: '#FFEDED' },
  { id: 'pinterest', label: 'Pinterest', emoji: '📌', color: '#E60023', bg: '#FFEAEC' },
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
  }, [searchParams, router]);

  const handleConnect = async (platformId: string) => {
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

  const connectedPlatformIds = new Set(connections.map((c) => c.platform?.toLowerCase()));

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Social Accounts</h1>
              <p className="text-gray-600">Connect your social media accounts to publish and schedule posts</p>
            </div>
            <Button variant="outline" onClick={() => router.push('/settings')} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Settings
            </Button>
          </div>

          {/* Page selection overlay */}
          {phase !== 'idle' && (
            <Card className="mb-6">
              <CardContent className="p-6">
                {phase === 'finalizing' ? (
                  <div className="text-center py-4">
                    <Loader2 className="w-8 h-8 animate-spin text-[#CD1B78] mx-auto mb-3" />
                    <p className="text-sm text-gray-600">Connecting accounts…</p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Select {networkName} accounts to connect
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">Choose which pages or accounts you want URI to manage.</p>
                    {availablePages.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No accounts found. Make sure you have admin access to at least one page.
                      </p>
                    ) : (
                      <div className="space-y-2 mb-4">
                        {availablePages.map((page) => {
                          const isInstagram =
                            page.type === 'instagram_business_account' || page.network === 'instagram';
                          const isAutoConnect = !!page.auto_connect;
                          const isSelected = selectedPageIds.includes(page.id);
                          return (
                            <div
                              key={page.id}
                              onClick={() =>
                                !isAutoConnect &&
                                setSelectedPageIds((prev) =>
                                  prev.includes(page.id) ? prev.filter((x) => x !== page.id) : [...prev, page.id]
                                )
                              }
                              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                                isAutoConnect
                                  ? 'border-gray-200 bg-gray-50 opacity-75 cursor-default'
                                  : isSelected
                                    ? 'border-[#CD1B78] bg-pink-50'
                                    : 'border-gray-200 bg-white hover:border-[#CD1B78]'
                              }`}
                            >
                              <div className="relative">
                                {page.profilePictureUrl ? (
                                  <img src={page.profilePictureUrl} alt="" className="w-10 h-10 rounded-full" />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg">
                                    {isInstagram ? '📸' : '📘'}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-semibold text-gray-900">{page.name}</span>
                                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                    {isInstagram ? 'Instagram' : 'Facebook'}
                                  </span>
                                  {isAutoConnect && (
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                      Auto
                                    </span>
                                  )}
                                </div>
                                {page.username && <p className="text-xs text-gray-500">@{page.username}</p>}
                                {isAutoConnect && (
                                  <p className="text-xs text-gray-500">Connected automatically via Facebook</p>
                                )}
                              </div>
                              {!isAutoConnect && (
                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    isSelected ? 'border-[#CD1B78] bg-[#CD1B78]' : 'border-gray-300'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setPhase('idle');
                          setSessionToken(null);
                          setAvailablePages([]);
                          setSelectedPageIds([]);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleFinalize}
                        disabled={selectedPageIds.length === 0}
                        className="bg-[#CD1B78] hover:bg-[#A01560] text-white"
                      >
                        Connect {selectedPageIds.length > 0 ? `(${selectedPageIds.length})` : ''}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Connected accounts */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#CD1B78]" />
            </div>
          ) : (
            <>
              {connections.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Connected</h2>
                  <div className="space-y-2">
                    {connections.map((conn, i) => {
                      const pl = PLATFORMS.find((p) => p.id === conn.platform?.toLowerCase());
                      return (
                        <Card key={i}>
                          <CardContent className="flex items-center gap-4 p-4">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                              style={{ backgroundColor: pl?.bg ?? '#f0f0f0' }}
                            >
                              {pl?.emoji ?? '🌐'}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900 capitalize">{conn.platform}</p>
                              <p className="text-xs text-gray-600">{conn.page_name ?? 'Connected'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">
                                Active
                              </span>
                              <button
                                onClick={() => handleDisconnect(conn.outstand_account_id ?? '')}
                                className="text-gray-400 hover:text-red-600 text-xl leading-none px-2"
                                title="Disconnect"
                              >
                                ×
                              </button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Available platforms */}
              <div>
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  {connections.length > 0 ? 'Add More Accounts' : 'Connect an Account'}
                </h2>
                <div className="space-y-2">
                  {PLATFORMS.map((pl) => {
                    const isConnected = connectedPlatformIds.has(pl.id);
                    const isConnecting = connectingPlatform === pl.id;
                    const isInstagram = pl.id === 'instagram';
                    return (
                      <Card key={pl.id}>
                        <CardContent className="flex items-center gap-4 p-4">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                            style={{ backgroundColor: pl.bg }}
                          >
                            {pl.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{pl.label}</p>
                            {isInstagram && !isConnected && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {connectedPlatformIds.has('facebook')
                                  ? 'Connected automatically when you connect Facebook'
                                  : 'Connect Facebook first — Instagram is detected automatically'}
                              </p>
                            )}
                          </div>
                          {isConnected ? (
                            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-700">
                              Connected
                            </span>
                          ) : isInstagram && !connectedPlatformIds.has('facebook') ? (
                            <Button
                              onClick={() => handleConnect('facebook')}
                              disabled={connectingPlatform === 'facebook'}
                              variant="outline"
                              size="sm"
                              style={{ borderColor: '#1877F2', color: '#1877F2' }}
                            >
                              {connectingPlatform === 'facebook' ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                  Opening…
                                </>
                              ) : (
                                'Connect via Facebook'
                              )}
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleConnect(pl.id)}
                              disabled={isConnecting}
                              variant="outline"
                              size="sm"
                              style={{ borderColor: pl.color, color: pl.color }}
                            >
                              {isConnecting ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                  Opening…
                                </>
                              ) : (
                                'Connect'
                              )}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function SocialAccountsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-[#CD1B78]" />
        </div>
      }
    >
      <SocialAccountsContent />
    </Suspense>
  );
}
