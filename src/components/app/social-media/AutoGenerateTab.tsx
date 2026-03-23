'use client';

import { AutoGenerateSettings, SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { ToastService } from '@/src/utils/toast.util';
import { Box, Button, Checkbox, Chip, CircularProgress, Divider, FormControlLabel, FormGroup, Radio, RadioGroup, Switch, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from 'react-icons/fa';
import { MdAutoAwesome, MdInfoOutline, MdLinkOff, MdVerified } from 'react-icons/md';

const PLATFORMS = [
  { key: 'facebook', label: 'Facebook', icon: <FaFacebook size={15} color="#1877F2" /> },
  { key: 'instagram', label: 'Instagram', icon: <FaInstagram size={15} color="#E1306C" /> },
  { key: 'twitter', label: 'Twitter / X', icon: <FaTwitter size={15} color="#1DA1F2" /> },
  { key: 'linkedin', label: 'LinkedIn', icon: <FaLinkedin size={15} color="#0A66C2" /> },
];

interface AutoGenerateTabProps {
  settings: AutoGenerateSettings | null;
  onGenerated: () => void;
  onSettingsChange: () => void;
  /** Called silently in the background to refresh drafts without switching tabs. */
  onRefreshDrafts?: () => void;
}

const AutoGenerateTab = ({ settings, onGenerated, onSettingsChange, onRefreshDrafts }: AutoGenerateTabProps) => {
  const [enabled, setEnabled] = useState(settings?.enabled ?? false);
  const [platforms, setPlatforms] = useState<string[]>(settings?.platforms ?? ['facebook', 'instagram']);
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>(settings?.frequency ?? 'daily');
  const [includeImages, setIncludeImages] = useState(settings?.include_images ?? false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [triggering, setTriggering] = useState(false);

  const togglePlatform = (key: string) => setPlatforms((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));

  const handleSaveSettings = async () => {
    if (platforms.length === 0) {
      ToastService.showToast('Select at least one platform', ToastTypeEnum.Error);
      return;
    }
    setSavingSettings(true);
    try {
      const response = await SocialMediaAgentService.updateAutoGenerateSettings({
        enabled,
        platforms,
        frequency,
        include_images: includeImages,
      });
      if (response.status) {
        ToastService.showToast('Settings saved', ToastTypeEnum.Success);
        onSettingsChange();
      } else {
        ToastService.showToast(response.responseMessage || 'Save failed', ToastTypeEnum.Error);
      }
    } catch {
      ToastService.showToast('Save failed', ToastTypeEnum.Error);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      const resp = await SocialMediaAgentService.triggerAutoGenerate();
      if (resp.status) {
        ToastService.showToast('Content generating — switching to Drafts', ToastTypeEnum.Success);

        // Switch to drafts immediately so the user can see drafts appear
        onSettingsChange();
        onGenerated();

        // Image generation runs as a separate background task on the server and
        // typically finishes 10–40s after the text draft is created. Schedule
        // silent refreshes so the image appears in the draft card automatically.
        const delays = [10_000, 25_000, 45_000];
        delays.forEach((ms) =>
          setTimeout(() => {
            onRefreshDrafts?.();
          }, ms)
        );
      } else {
        ToastService.showToast(resp.responseMessage || 'Trigger failed', ToastTypeEnum.Error);
        setTriggering(false);
      }
    } catch {
      ToastService.showToast('Trigger failed', ToastTypeEnum.Error);
      setTriggering(false);
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box sx={{ maxWidth: 640 }}>
      {/* ── Settings card ─────────────────────────────────────── */}
      <Box sx={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', p: 3, mb: 2 }}>
        {/* Title + on/off */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
          <Box display="flex" alignItems="center" gap={1}>
            <MdAutoAwesome size={20} color="#CD1B78" />
            <Typography fontWeight={700} fontSize="16px" color="#111827">
              Auto Content Generation
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography fontSize="13px" color={enabled ? '#059669' : '#6B7280'} fontWeight={600}>
              {enabled ? 'On' : 'Off'}
            </Typography>
            <Switch
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              size="small"
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': { color: '#CD1B78' },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#CD1B78' },
              }}
            />
          </Box>
        </Box>
        <Typography fontSize="13px" color="#6B7280" mb={2.5}>
          Analyses your top-performing posts and auto-generates platform drafts for your approval, personalised using your brand profile.
        </Typography>

        <Divider sx={{ mb: 2.5 }} />

        {/* Platforms */}
        <Typography fontSize="13px" fontWeight={600} color="#374151" mb={1}>
          Platforms
        </Typography>
        <FormGroup row sx={{ gap: 1, mb: 2.5 }}>
          {PLATFORMS.map(({ key, label, icon }) => (
            <FormControlLabel
              key={key}
              disabled={!enabled}
              control={<Checkbox checked={platforms.includes(key)} onChange={() => togglePlatform(key)} size="small" sx={{ '&.Mui-checked': { color: '#CD1B78' } }} />}
              label={
                <Box display="flex" alignItems="center" gap={0.5}>
                  {icon}
                  <Typography fontSize="13px">{label}</Typography>
                </Box>
              }
              sx={{ mr: 0, border: '1px solid #E5E7EB', borderRadius: '8px', pl: 0.5, pr: 1.5, py: 0.25 }}
            />
          ))}
        </FormGroup>

        {/* Frequency */}
        <Typography fontSize="13px" fontWeight={600} color="#374151" mb={0.5}>
          Frequency
        </Typography>
        <RadioGroup row value={frequency} onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekly')} sx={{ mb: 2.5 }}>
          {(['daily', 'weekly'] as const).map((f) => (
            <FormControlLabel
              key={f}
              value={f}
              disabled={!enabled}
              control={<Radio size="small" sx={{ '&.Mui-checked': { color: '#CD1B78' } }} />}
              label={<Typography fontSize="13px">{f.charAt(0).toUpperCase() + f.slice(1)}</Typography>}
            />
          ))}
        </RadioGroup>

        {/* Include images */}
        <FormControlLabel
          disabled={!enabled}
          control={
            <Switch
              checked={includeImages}
              onChange={(e) => setIncludeImages(e.target.checked)}
              size="small"
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': { color: '#CD1B78' },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#CD1B78' },
              }}
            />
          }
          label={<Typography fontSize="13px">Include AI-generated images</Typography>}
          sx={{ mb: 2.5 }}
        />

        <Divider sx={{ mb: 2.5 }} />

        <Button
          variant="contained"
          onClick={handleSaveSettings}
          disabled={savingSettings}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '13px',
            background: '#CD1B78',
            '&:hover': { background: '#A01560' },
            borderRadius: '8px',
          }}
        >
          {savingSettings ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Save Settings'}
        </Button>
      </Box>

      {/* ── Analytics context card ─────────────────────────────── */}
      <AnalyticsContextCard ctx={settings?.analytics_context} />

      {/* ── Status + trigger card ──────────────────────────────── */}
      <Box sx={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', p: 3 }}>
        <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} gap={2}>
          <Box>
            <Typography fontSize="13px" color="#374151">
              <strong>Last run:</strong>{' '}
              {settings?.last_run_at
                ? `${formatDate(settings.last_run_at)}${
                    settings.last_run_draft_count != null ? ` · ${settings.last_run_draft_count} draft${settings.last_run_draft_count !== 1 ? 's' : ''} created` : ''
                  }`
                : 'Never'}
            </Typography>
            <Typography fontSize="13px" color="#374151" mt={0.5}>
              <strong>Next scheduled:</strong> {settings?.next_run_at && settings?.enabled ? formatDate(settings.next_run_at) : '—'}
            </Typography>
          </Box>

          <Button
            variant="contained"
            onClick={handleTrigger}
            disabled={triggering}
            startIcon={triggering ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <MdAutoAwesome size={16} />}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '13px',
              background: '#111827',
              '&:hover': { background: '#374151' },
              borderRadius: '8px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {triggering ? 'Generating…' : 'Generate Now'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

// ─── Analytics context card ───────────────────────────────────────────────────

interface AnalyticsContextCardProps {
  ctx?: AutoGenerateSettings['analytics_context'];
}

const AnalyticsContextCard = ({ ctx }: AnalyticsContextCardProps) => {
  const connected = ctx?.connected ?? false;

  return (
    <Box
      sx={{
        background: connected ? '#F0FDF4' : '#F9FAFB',
        border: `1px solid ${connected ? '#BBF7D0' : '#E5E7EB'}`,
        borderRadius: '12px',
        p: 2.5,
        mb: 2,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
      }}
    >
      <Box mt={0.2}>{connected ? <MdVerified size={20} color="#16A34A" /> : <MdLinkOff size={20} color="#9CA3AF" />}</Box>
      <Box flex={1}>
        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
          <Typography fontWeight={700} fontSize="13px" color={connected ? '#15803D' : '#6B7280'}>
            {connected ? 'Account Tracking Insights Connected' : 'No Account Insights Yet'}
          </Typography>
          <Tooltip
            title={
              connected
                ? 'Industry classification, content themes, and engagement drivers from your Account Tracking analysis feed into the AI brief alongside your brand profile.'
                : 'Open Account Tracking → click Analyse on any account. The AI media report will automatically sync here and enrich your generated posts.'
            }
            arrow
          >
            <span style={{ display: 'flex', alignItems: 'center', cursor: 'help' }}>
              <MdInfoOutline size={14} color="#9CA3AF" />
            </span>
          </Tooltip>
        </Box>

        {connected ? (
          <>
            <Typography fontSize="12px" color="#374151" mb={1}>
              The AI combines your brand profile with analysed account data to generate more relevant, on-brand posts.
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={0.75}>
              {(ctx?.connected_platforms ?? []).map((p) => (
                <Chip key={p} label={p.charAt(0).toUpperCase() + p.slice(1)} size="small" sx={{ background: '#DCFCE7', color: '#15803D', fontWeight: 600, fontSize: '11px', height: 22 }} />
              ))}
              {(ctx?.industries_detected ?? []).map((ind) => (
                <Chip key={ind} label={ind} size="small" sx={{ background: '#EDE9FE', color: '#6D28D9', fontWeight: 600, fontSize: '11px', height: 22 }} />
              ))}
              {(ctx?.accounts_analysed ?? 0) > 0 && (
                <Chip
                  label={`${ctx!.accounts_analysed} account${ctx!.accounts_analysed !== 1 ? 's' : ''} analysed`}
                  size="small"
                  sx={{ background: '#E0F2FE', color: '#0369A1', fontWeight: 600, fontSize: '11px', height: 22 }}
                />
              )}
            </Box>
            {ctx?.last_synced_at && (
              <Typography fontSize="11px" color="#9CA3AF" mt={0.75}>
                Last synced:{' '}
                {new Date(ctx.last_synced_at).toLocaleString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Typography>
            )}
          </>
        ) : (
          <Typography fontSize="12px" color="#9CA3AF">
            Go to <strong>Account Tracking</strong>, open any account and click Analyse. The AI media report will automatically sync here to power richer content generation.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default AutoGenerateTab;
