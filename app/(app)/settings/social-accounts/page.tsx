'use client';

import { Suspense, useEffect, useState as useClientState } from 'react';
import { SocialConnection, SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
import DashboardLayout from '@/src/components/app/atoms/DashboardLayout';
import ConnectFacebookModal from '@/src/components/app/social-media/ConnectFacebookModal';
import ConnectedAccountCard from '@/src/components/app/social-media/ConnectedAccountCard';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { ToastService } from '@/src/utils/toast.util';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { MdOutlineCampaign } from 'react-icons/md';

function SocialAccountsPageContent() {
  const [mounted, setMounted] = useClientState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress sx={{ color: '#CD1B78' }} />
      </Box>
    );
  }

  return <SocialAccountsContent />;
}

function SocialAccountsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchConnections = useCallback(async () => {
    setLoading(true);
    try {
      const response = await SocialMediaAgentService.getConnections();
      if (response.status && response.responseData) {
        const raw = response.responseData as { connections?: Record<string, SocialConnection[]> };
        const platformMap: Record<string, SocialConnection[]> = raw.connections ?? {};
        const flat: SocialConnection[] = Object.entries(platformMap).flatMap(([platform, conns]) =>
          conns.map((conn) => ({ ...conn, platform }))
        );
        setConnections(flat);
      }
    } catch {
      // silently ignore — user may have no connections yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // Handle OAuth callback: ?platform=facebook&connected=true
  useEffect(() => {
    const platform = searchParams.get('platform');
    const connected = searchParams.get('connected');
    if (platform && connected === 'true') {
      ToastService.showToast(`${platform} connected successfully!`, ToastTypeEnum.Success);
      fetchConnections();
      router.replace('/settings/social-accounts');
    }
  }, [searchParams, fetchConnections, router]);

  return (
    <>
      <DashboardLayout excludeHeader>
        <Box sx={{ backgroundColor: '#FAFAFA', minHeight: '100vh' }}>
          <Box sx={{ backgroundColor: '#fff', pt: '52px', pb: '24px', px: 3, borderBottom: '1px solid #E5E7EB' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <Box
                  sx={{
                    backgroundColor: '#CD1B78',
                    padding: '8px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MdOutlineCampaign size={24} color="#fff" />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 'clamp(20px, 1.5vw + 10px, 28px)', color: '#212529', fontWeight: 800, lineHeight: 1 }}>Social Accounts</Typography>
                  <Typography fontSize="13px" color="#6B7280" mt={0.25}>
                    Manage connected social media platforms
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                onClick={() => setModalOpen(true)}
                sx={{
                  background: 'linear-gradient(135deg, #1877F2 0%, #0D5FD9 100%)',
                  textTransform: 'none',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(24, 119, 242, 0.3)',
                  '&:hover': { background: 'linear-gradient(135deg, #0D5FD9 0%, #1877F2 100%)' },
                }}
              >
                + Connect Facebook
              </Button>
            </Box>
          </Box>

          <Box sx={{ px: 3, py: 4 }}>
            {loading ? (
              <Box display="flex" justifyContent="center" py={8}>
                <CircularProgress sx={{ color: '#CD1B78' }} />
              </Box>
            ) : connections.length === 0 ? (
              <Box
                sx={{
                  border: '2px dashed #E5E7EB',
                  borderRadius: '16px',
                  p: 6,
                  textAlign: 'center',
                  background: '#fff',
                }}
              >
                <MdOutlineCampaign size={48} color="#D1D5DB" />
                <Typography fontWeight={600} fontSize="18px" color="#374151" mt={2} mb={1}>
                  No social accounts connected
                </Typography>
                <Typography fontSize="14px" color="#6B7280" mb={3}>
                  Connect your Facebook page to start publishing AI-generated content
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => setModalOpen(true)}
                  sx={{
                    background: 'linear-gradient(135deg, #1877F2 0%, #0D5FD9 100%)',
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  Connect Facebook Page
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 640 }}>
                {connections.map((conn) => (
                  <ConnectedAccountCard key={`${conn.platform}-${conn.page_id}`} connection={conn} onDisconnect={fetchConnections} />
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </DashboardLayout>

      <ConnectFacebookModal open={modalOpen} onClose={() => setModalOpen(false)} onSuccess={fetchConnections} />
    </>
  );
}

export default function SocialAccountsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SocialAccountsPageContent />
    </Suspense>
  );
}
