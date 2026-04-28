'use client';

import { Suspense } from 'react';
import { BrandProfileData, BrandProfileService } from '@/src/api/BrandProfileService';
import { AvailablePage, SocialAccountService } from '@/src/api/SocialAccountService';
import CustomButton from '@/src/components/app/atoms/CustomButton';
import useCustomTheme from '@/src/hooks/theme.hook';
import { useAuth } from '@/src/providers/AuthProvider';
import { Box, Checkbox, CircularProgress, Divider, LinearProgress, Typography } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  FaArrowLeft,
  FaCheckCircle,
  FaFacebook,
  FaImage,
  FaInstagram,
  FaLinkedin,
  FaTimes,
  FaWhatsapp,
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { SocialConnectionService } from '@/src/api/SocialConnectionService';
import StylePickerGallery from '@/src/components/app/social-media/StylePickerGallery';
import FontPickerGallery from '@/src/components/app/social-media/FontPickerGallery';
import { getFont } from '@/src/data/fontLibrary';
import { getStyle } from '@/src/data/styleLibrary';
import { MdOutlineCampaign } from 'react-icons/md';
import Navbar from '@/components/Navbar';

// ─── Step order ──────────────────────────────────────────────────────────────
const STEPS = [
  'welcome',
  'connectAccounts',
  'basics',
  'identity',
  'personality',
  'visualStyle',
  'fontStyle',
  'platformTone',
  'voiceSample',
  'pillars',
  'formats',
  'guardrails',
  'cta',
  'audience',
  'competitors',
  'calendar',
  'cadence',
  'postingTimes',
  'approvalChannels',
  'notifications',
  'language',
  'preview',
] as const;
type Step = (typeof STEPS)[number];

// ─── Shared micro-components ─────────────────────────────────────────────────

/** The "U" agent bubble — uses Uri primary colour */
const AgentBubble = ({ children, primary }: { children: React.ReactNode; primary: string }) => (
  <Box display="flex" gap={1.5} alignItems="flex-start" mb={2.5}>
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${primary}, ${primary}cc)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: `0 2px 8px ${primary}33`,
      }}
    >
      <Typography sx={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>U</Typography>
    </Box>
    <Box
      sx={{
        background: '#F7F7FD',
        border: '1px solid #E0DEF7',
        borderRadius: '2px 12px 12px 12px',
        px: 2,
        py: 1.5,
        maxWidth: { xs: '100%', sm: 520 },
        fontSize: 14,
        lineHeight: 1.6,
        color: '#374151',
      }}
    >
      {children}
    </Box>
  </Box>
);

/** Pill-shaped toggle chip */
const Chip = ({
  label,
  active,
  onClick,
  emoji,
  primary,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  emoji?: string;
  primary: string;
}) => (
  <Box
    component="button"
    onClick={onClick}
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.75,
      px: 1.75,
      py: 0.875,
      borderRadius: '8px',
      border: `2px solid ${active ? primary : '#E0DEF7'}`,
      background: active ? primary : '#fff',
      color: active ? '#fff' : '#374151',
      fontSize: 12.5,
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.18s',
      '&:hover': { borderColor: primary },
    }}
  >
    {emoji && <span style={{ fontSize: 13 }}>{emoji}</span>}
    {label}
  </Box>
);

/** Section label above a group of fields */
const FieldLabel = ({ children, sub }: { children: React.ReactNode; sub?: string }) => (
  <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: '#374151', mb: 0.75 }}>
    {children}
    {sub && (
      <Box component="span" sx={{ color: '#9CA3AF', fontWeight: 400, ml: 0.5 }}>
        {sub}
      </Box>
    )}
  </Typography>
);

/** Hint text below a field */
const Hint = ({ children }: { children: React.ReactNode }) => (
  <Typography sx={{ fontSize: 11.5, color: '#9CA3AF', mt: 0.5, lineHeight: 1.5 }}>{children}</Typography>
);

/** Standard text input styled to match the Uri InputField component */
const UriInput = ({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) => (
  <Box
    component="input"
    type={type}
    value={value}
    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
    placeholder={placeholder}
    sx={{
      width: '100%',
      height: 40,
      px: 1.5,
      borderRadius: '10px',
      border: '1px solid #E0DEF7',
      background: '#F7F7FD',
      fontSize: 13.5,
      color: '#1f2937',
      outline: 'none',
      boxSizing: 'border-box',
      fontFamily: 'inherit',
      '&:focus': { borderColor: 'primary.main' },
    }}
  />
);

/** Standard textarea */
const UriTextarea = ({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) => (
  <Box
    component="textarea"
    value={value}
    rows={rows}
    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
    placeholder={placeholder}
    sx={{
      width: '100%',
      px: 1.5,
      py: 1.25,
      borderRadius: '10px',
      border: '1px solid #E0DEF7',
      background: '#F7F7FD',
      fontSize: 13.5,
      color: '#1f2937',
      outline: 'none',
      resize: 'vertical',
      boxSizing: 'border-box',
      fontFamily: 'inherit',
      lineHeight: 1.6,
      '&:focus': { borderColor: 'primary.main' },
    }}
  />
);

/** Large option card (like select-workflow style) */
const OptionCard = ({
  emoji,
  label,
  desc,
  active,
  onClick,
  primary,
}: {
  emoji: string;
  label: string;
  desc?: string;
  active: boolean;
  onClick: () => void;
  primary: string;
}) => (
  <Box
    component="button"
    onClick={onClick}
    sx={{
      flex: 1,
      p: 2,
      borderRadius: '14px',
      textAlign: 'center',
      border: `2px solid ${active ? primary : '#E0DEF7'}`,
      background: active ? `${primary}10` : '#fff',
      cursor: 'pointer',
      transition: 'all 0.18s',
      '&:hover': { borderColor: primary },
    }}
  >
    <Typography sx={{ fontSize: 22, mb: 0.5 }}>{emoji}</Typography>
    <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: active ? primary : '#374151', mb: desc ? 0.25 : 0 }}>
      {label}
    </Typography>
    {desc && <Typography sx={{ fontSize: 11, color: '#9CA3AF', lineHeight: 1.3 }}>{desc}</Typography>}
  </Box>
);

/** Personality pair toggle */
const PersonalityPair = ({
  optA,
  optB,
  selected,
  onSelect,
  primary,
}: {
  optA: { emoji: string; label: string; value: string; example: string };
  optB: { emoji: string; label: string; value: string; example: string };
  selected?: string;
  onSelect: (v: string) => void;
  primary: string;
}) => (
  <Box display="flex" gap={1.25} mb={1.5}>
    {[optA, optB].map((opt) => (
      <Box
        key={opt.value}
        component="button"
        onClick={() => onSelect(opt.value)}
        sx={{
          flex: 1,
          p: 1.75,
          borderRadius: '12px',
          textAlign: 'left',
          border: `2px solid ${selected === opt.value ? primary : '#E0DEF7'}`,
          background: selected === opt.value ? `${primary}10` : '#fff',
          cursor: 'pointer',
          transition: 'all 0.18s',
          '&:hover': { borderColor: primary },
        }}
      >
        <Typography sx={{ fontSize: 18, mb: 0.5 }}>{opt.emoji}</Typography>
        <Typography
          sx={{ fontSize: 12.5, fontWeight: 600, color: selected === opt.value ? primary : '#374151', mb: 0.25 }}
        >
          {opt.label}
        </Typography>
        <Typography sx={{ fontSize: 11, color: '#9CA3AF', lineHeight: 1.4 }}>{opt.example}</Typography>
      </Box>
    ))}
  </Box>
);

/** Drag-to-rank list */
const PillarRanker = ({
  items,
  onReorder,
  primary,
}: {
  items: string[];
  onReorder: (v: string[]) => void;
  primary: string;
}) => {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  return (
    <Box display="flex" flexDirection="column" gap={0.75}>
      {items.map((item, i) => (
        <Box
          key={item}
          draggable
          onDragStart={() => setDragIdx(i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (dragIdx !== null && dragIdx !== i) {
              const c = [...items];
              const [m] = c.splice(dragIdx, 1);
              c.splice(i, 0, m);
              onReorder(c);
            }
            setDragIdx(null);
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            px: 1.75,
            py: 1.25,
            borderRadius: '10px',
            background: dragIdx === i ? '#F0EFFB' : '#F7F7FD',
            border: '1px solid #E0DEF7',
            cursor: 'grab',
            transition: 'background 0.15s',
            fontSize: 13,
            color: '#374151',
          }}
        >
          <Box
            sx={{
              width: 22,
              height: 22,
              borderRadius: '6px',
              background: primary,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {i + 1}
          </Box>
          <Typography sx={{ flex: 1, fontSize: 13, color: '#374151' }}>{item}</Typography>
          <Typography sx={{ color: '#D1D5DB', fontSize: 14 }}>⠿</Typography>
        </Box>
      ))}
    </Box>
  );
};

/** Colour picker */
const ColorPicker = ({
  colors,
  onChange,
  primary,
}: {
  colors: string[];
  onChange: (c: string[]) => void;
  primary: string;
}) => {
  const presets = [
    '#C91A79',
    '#7C3AED',
    '#0F3460',
    '#0891B2',
    '#059669',
    '#D97706',
    '#DC2626',
    '#E76F51',
    '#264653',
    '#2D6A4F',
    '#533483',
    '#EC4899',
    '#6B21A8',
    '#1D4ED8',
    '#0369A1',
    '#374151',
  ];
  return (
    <Box>
      <Box display="flex" gap={0.75} flexWrap="wrap" mb={1}>
        {presets.map((c) => (
          <Box
            key={c}
            component="button"
            onClick={() => {
              if (colors.includes(c)) onChange(colors.filter((x) => x !== c));
              else if (colors.length < 3) onChange([...colors, c]);
            }}
            sx={{
              width: 28,
              height: 28,
              borderRadius: '7px',
              background: c,
              border: colors.includes(c) ? `3px solid ${primary}` : '3px solid transparent',
              boxShadow: colors.includes(c) ? `0 0 0 2px #fff, 0 0 0 4px ${primary}` : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          />
        ))}
      </Box>
      <Box display="flex" alignItems="center" gap={1}>
        <Box
          component="input"
          type="text"
          placeholder="#hex"
          maxLength={7}
          sx={{
            width: 90,
            height: 36,
            px: 1.25,
            borderRadius: '8px',
            border: '1px solid #E0DEF7',
            background: '#F7F7FD',
            fontSize: 12.5,
            color: '#374151',
            outline: 'none',
            fontFamily: 'inherit',
          }}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            const t = e.currentTarget;
            if (e.key === 'Enter' && t.value.match(/^#[0-9a-fA-F]{6}$/) && colors.length < 3) {
              onChange([...colors, t.value]);
              t.value = '';
            }
          }}
        />
        <Typography sx={{ fontSize: 11.5, color: '#9CA3AF' }}>{colors.length}/3 selected</Typography>
      </Box>
    </Box>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
function BrandSetupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { themeColors } = useCustomTheme();
  const { userDetails } = useAuth();
  const primary = themeColors.primary; // #C91A79

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);

  // ── Connect accounts ──────────────────────────────────────────
  const [connectPhase, setConnectPhase] = useState<'selecting' | 'connecting' | 'pending' | 'finalizing' | 'success'>(
    'selecting'
  );
  const [selectedConnectPlatform, setSelectedConnectPlatform] = useState<string | null>(null);
  const [connectSessionToken, setConnectSessionToken] = useState<string | null>(null);
  const [availablePages, setAvailablePages] = useState<AvailablePage[]>([]);
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const [connectNetworkName, setConnectNetworkName] = useState('');
  const [connectedAccountNames, setConnectedAccountNames] = useState<string[]>([]);
  const [whatsappPhone, setWhatsappPhone] = useState('');

  // ── Basics ────────────────────────────────────────────────────
  const [brandName, setBrandName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [productDesc, setProductDesc] = useState('');

  // ── Identity ──────────────────────────────────────────────────
  const [logoUrl, setLogoUrl] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState('');
  const [colors, setColors] = useState<string[]>([]);

  // ── Personality ───────────────────────────────────────────────
  const [quiz, setQuiz] = useState<Record<string, string>>({});

  // ── Visual Style ──────────────────────────────────────────────
  const [styleSelections, setStyleSelections] = useState<string[]>([]);

  // ── Font Style ────────────────────────────────────────────────
  const [fontStyle, setFontStyle] = useState<string>('');
  const quizData = [
    {
      id: 'formality',
      optA: {
        emoji: '👔',
        label: 'Polished & Professional',
        value: 'formal',
        example: '"We\'re excited to share our latest."',
      },
      optB: {
        emoji: '🤙',
        label: 'Casual & Conversational',
        value: 'casual',
        example: '"Y\'all are gonna LOVE this drop."',
      },
    },
    {
      id: 'humor',
      optA: { emoji: '😂', label: 'Witty & Playful', value: 'witty', example: '"Like a hug, but for your wallet."' },
      optB: { emoji: '🎯', label: 'Straight & Direct', value: 'direct', example: '"Save 30%. Link in bio."' },
    },
    {
      id: 'energy',
      optA: { emoji: '🔥', label: 'Bold & Energetic', value: 'bold', example: '"This changes EVERYTHING."' },
      optB: { emoji: '🌿', label: 'Calm & Reassuring', value: 'calm', example: '"Take your time. We\'re here."' },
    },
    {
      id: 'approach',
      optA: { emoji: '📚', label: 'Educational', value: 'educational', example: '"Did you know? 3 tips to..."' },
      optB: { emoji: '💫', label: 'Inspirational', value: 'inspirational', example: '"Imagine your dream life..."' },
    },
  ];

  // ── Platform tone ─────────────────────────────────────────────
  const [platformTones, setPlatformTones] = useState<Record<string, string>>({});
  const [sameTone, setSameTone] = useState(true);
  const toneOptions = ['Professional', 'Casual', 'Witty', 'Bold', 'Calm', 'Educational', 'Inspirational'];

  // ── Voice sample ──────────────────────────────────────────────
  const [voiceSample, setVoiceSample] = useState('');
  const [sampleTemplateUrls, setSampleTemplateUrls] = useState<string[]>([]);
  const [sampleTemplateUploading, setSampleTemplateUploading] = useState(false);
  const [sampleTemplateError, setSampleTemplateError] = useState('');

  // ── Pillars ───────────────────────────────────────────────────
  const allPillars = [
    'Behind the Scenes',
    'Product Highlights',
    'Tips & Education',
    'Customer Stories',
    'Promotions',
    'Team & Culture',
    'Industry News',
    'Trending & Seasonal',
  ];
  const [pillars, setPillars] = useState<string[]>([]);

  // ── Formats ───────────────────────────────────────────────────
  const allFormats = [
    { name: 'Single Image', emoji: '🖼️' },
    { name: 'Carousel', emoji: '🎠' },
    { name: 'Short Video / Reel', emoji: '🎬' },
    { name: 'Stories', emoji: '📱' },
    { name: 'Text Only', emoji: '✍️' },
    { name: 'Infographic', emoji: '📊' },
    { name: 'Meme / Humor', emoji: '😂' },
    { name: 'Live / Q&A', emoji: '🔴' },
  ];
  const [formats, setFormats] = useState<string[]>([]);

  // ── Guardrails ────────────────────────────────────────────────
  const [avoidTopics, setAvoidTopics] = useState('');
  const [bannedWords, setBannedWords] = useState('');
  const [useEmoji, setUseEmoji] = useState('');
  const [maxHash, setMaxHash] = useState('5');
  const [compliance, setCompliance] = useState('');

  // ── CTA ───────────────────────────────────────────────────────
  const [ctaStyle, setCtaStyle] = useState<string[]>([]);
  const [defaultLink, setDefaultLink] = useState('');
  const allCtas = [
    'Link in bio',
    'Shop now',
    'DM us',
    'Book a call',
    'Learn more',
    'Sign up',
    'Download',
    'Visit our website',
    'Use code...',
  ];

  // ── Audience ──────────────────────────────────────────────────
  const [audienceAge, setAudienceAge] = useState<string[]>([]);
  const [targetPlatforms, setTargetPlatforms] = useState<string[]>([]);
  const [goal, setGoal] = useState('');

  // ── Competitors ───────────────────────────────────────────────
  const [competitors, setCompetitors] = useState(['', '', '']);

  // ── Calendar ──────────────────────────────────────────────────
  const [keyDates, setKeyDates] = useState<{ date: string; label: string }[]>([]);
  const [newDate, setNewDate] = useState('');
  const [newDateLabel, setNewDateLabel] = useState('');

  // ── Cadence ───────────────────────────────────────────────────
  const [cadence, setCadence] = useState('');

  // ── Posting times ─────────────────────────────────────────────
  const [timeMode, setTimeMode] = useState('');
  const [timePrefs, setTimePrefs] = useState<Record<string, string>>({});

  // ── Approval ──────────────────────────────────────────────────
  const [approval, setApproval] = useState('');
  const [approvalChannels, setApprovalChannels] = useState<string[]>([]);

  // ── Notifications ─────────────────────────────────────────────
  const [notifEvents, setNotifEvents] = useState<string[]>([]);
  const [notifChannel, setNotifChannel] = useState('');

  // ── Language ──────────────────────────────────────────────────
  const [languages, setLanguages] = useState<string[]>([]);
  const [region, setRegion] = useState<string[]>([]);

  // ── Feedback ──────────────────────────────────────────────────
  const [postFeedback, setPostFeedback] = useState('');

  // ─── Init ────────────────────────────────────────────────────
  useEffect(() => {
    if (!userDetails?.userId) return;

    // If this is an OAuth callback return, handle it before checking onboarding
    // (otherwise completed-onboarding users get redirected to /workspace immediately)
    const connected = searchParams.get('connected');
    const platform = searchParams.get('platform');
    const sessionToken = searchParams.get('sessionToken');

    // LinkedIn / X popup-flow callback — if initiated from workspace, go back there
    if ((connected === 'true' || connected === 'false') && platform) {
      const oauthSource = localStorage.getItem('uri_oauth_connect_source');
      if (oauthSource === 'workspace') {
        localStorage.removeItem('uri_oauth_connect_source');
        router.replace('/workspace');
        return;
      }
    }

    if (connected === 'pending' && sessionToken) {
      const connectSource = localStorage.getItem('outstand_connect_source');
      if (connectSource === 'settings') {
        localStorage.removeItem('outstand_connect_source');
        router.replace(`/settings/social-accounts?sessionToken=${encodeURIComponent(sessionToken)}&connected=pending`);
        return;
      }
      // Onboarding OAuth callback — don't redirect to workspace
      setCheckingExisting(false);
      return;
    }

    BrandProfileService.isOnboardingDone().then((done) => {
      if (done) router.replace('/workspace');
      else setCheckingExisting(false);
    });
  }, [userDetails, router, searchParams]);

  // Detect OAuth callback return from Outstand (?sessionToken=...&connected=pending)
  // or LinkedIn/X callback (?connected=true&platform=linkedin&username=...)
  useEffect(() => {
    if (checkingExisting) return;
    const sessionToken = searchParams.get('sessionToken');
    const connected = searchParams.get('connected');
    const platform = searchParams.get('platform');
    const username = searchParams.get('username');

    // Instagram direct OAuth callback
    if (connected === 'instagram_direct') {
      const igUserId = searchParams.get('ig_user_id');
      const igUsername = searchParams.get('username') ?? 'Instagram';
      router.replace('/social-media/brand-setup');
      if (igUserId) {
        SocialAccountService.finalizeInstagramDirect(igUserId)
          .then(() => {
            setConnectedAccountNames((prev) => [...prev, `@${igUsername}`]);
            setStep(STEPS.indexOf('connectAccounts'));
            setConnectPhase('success');
          })
          .catch(() => {
            setConnectPhase('selecting');
          });
      }
      return;
    }

    if (connected === 'true' && platform) {
      // New LinkedIn / X OAuth callback
      const displayName = username ? decodeURIComponent(username) : platform;
      setConnectedAccountNames((prev) => [...prev, displayName]);
      setStep(STEPS.indexOf('connectAccounts'));
      setConnectPhase('success');
      router.replace('/social-media/brand-setup');
    } else if (connected === 'false' && platform) {
      setStep(STEPS.indexOf('connectAccounts'));
      setConnectPhase('selecting');
      router.replace('/social-media/brand-setup');
    } else if (connected === 'pending' && typeof sessionToken === 'string' && sessionToken) {
      setConnectSessionToken(sessionToken);
      setStep(STEPS.indexOf('connectAccounts'));
      setConnectPhase('connecting');
      router.replace('/social-media/brand-setup');

      SocialAccountService.getPendingConnection(sessionToken)
        .then((res) => {
          if (res.status && res.responseData) {
            const pages = res.responseData.available_pages ?? [];
            setAvailablePages(pages);
            setConnectNetworkName(res.responseData.network ?? '');
            const selectable = pages.filter((p) => !p.auto_connect);
            if (selectable.length === 1) setSelectedPageIds([selectable[0].id]);
            setConnectPhase('pending');
          } else {
            setConnectPhase('selecting');
          }
        })
        .catch(() => setConnectPhase('selecting'));
    } else if (connected === 'false') {
      setStep(STEPS.indexOf('connectAccounts'));
      setConnectPhase('selecting');
      router.replace('/social-media/brand-setup');
    }
  }, [searchParams, checkingExisting, router]);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));
  const toggle = <T,>(arr: T[], setArr: (v: T[]) => void, val: T, max?: number) =>
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : max && arr.length >= max ? arr : [...arr, val]);

  const deriveVoice = () => {
    if (quiz.humor === 'witty') return 'witty';
    if (quiz.energy === 'bold') return 'bold';
    if (quiz.energy === 'calm') return 'calm';
    if (quiz.formality === 'casual') return 'playful';
    if (quiz.formality === 'formal') return 'professional';
    return 'warm';
  };

  const connectedPlatforms = targetPlatforms.length > 0 ? targetPlatforms : ['Instagram', 'LinkedIn'];

  // Progress: ignore welcome (step 0) only
  const progressibleSteps = STEPS.length - 1;
  const progressStep = Math.max(0, step - 1);
  const progressPct = progressibleSteps > 0 ? (progressStep / progressibleSteps) * 100 : 0;

  // ─── Save & complete ─────────────────────────────────────────
  const handleComplete = async () => {
    setSaving(true);
    const profile: BrandProfileData = {
      brand_name: brandName,
      industry,
      website,
      product_description: productDesc,
      logo_url: logoUrl || undefined,
      brand_colors: colors,
      personality_quiz: quiz,
      derived_voice: deriveVoice(),
      voice_sample: voiceSample,
      sample_template_urls: sampleTemplateUrls.length > 0 ? sampleTemplateUrls : undefined,
      platform_tones: platformTones,
      same_tone_everywhere: sameTone,
      content_pillars: pillars,
      preferred_formats: formats,
      guardrails: {
        avoid_topics: avoidTopics,
        banned_words: bannedWords,
        emoji_usage: useEmoji,
        max_hashtags: maxHash,
        compliance_notes: compliance,
      },
      cta_styles: ctaStyle,
      default_link: defaultLink,
      audience_age_range: audienceAge.join(', '),
      target_platforms: targetPlatforms,
      primary_goal: goal,
      competitor_handles: competitors.filter(Boolean),
      key_dates: keyDates,
      posting_cadence: cadence,
      posting_time_mode: timeMode,
      posting_time_prefs: timePrefs,
      approval_workflow: approval,
      approval_channels: approvalChannels,
      notification_events: notifEvents,
      notification_channel: notifChannel,
      languages,
      region: region.join(', '),
      style_selections: styleSelections,
      style_prompt_fragments: styleSelections.map((slug) => getStyle(slug)?.promptFragment ?? ''),
      font_style: fontStyle,
      font_style_prompt: getFont(fontStyle)?.promptFragment ?? '',
      onboarding_completed: true,
    };
    try {
      await BrandProfileService.complete(profile);
      router.push('/workspace');
    } catch {
      setSaving(false);
    }
  };

  // ─── Step renderer ────────────────────────────────────────────
  const renderStep = (): React.ReactNode => {
    switch (STEPS[step] as Step) {
      // ══ WELCOME ══════════════════════════════════════════════════
      case 'welcome':
        return (
          <Box textAlign="center" py={2}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${primary}, ${primary}cc)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 8px 24px ${primary}33`,
                }}
              >
                <MdOutlineCampaign size={28} color="#fff" />
              </Box>
            </Box>
            <Typography sx={{ fontSize: { xs: 22, md: 26 }, fontWeight: 700, color: '#0d0e0f', mb: 1 }}>
              Meet your AI social media manager
            </Typography>
            <Typography sx={{ fontSize: 14, color: '#6C727F', maxWidth: 440, mx: 'auto', mb: 3, lineHeight: 1.6 }}>
              Let's spend a few minutes so I can learn everything about your brand — then I'll create content that
              sounds like you wrote it.
            </Typography>
            <Box display="flex" gap={1} justifyContent="center" flexWrap="wrap" mb={3}>
              {[
                { i: '🎨', l: 'Identity' },
                { i: '🗣️', l: 'Voice' },
                { i: '📋', l: 'Strategy' },
                { i: '🎯', l: 'Audience' },
                { i: '⚙️', l: 'Settings' },
              ].map((x) => (
                <Box
                  key={x.l}
                  sx={{
                    background: '#F7F7FD',
                    border: '1px solid #E0DEF7',
                    borderRadius: '8px',
                    px: 1.5,
                    py: 0.875,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    fontSize: 12.5,
                    color: '#374151',
                  }}
                >
                  <span>{x.i}</span>
                  {x.l}
                </Box>
              ))}
            </Box>
            <Typography sx={{ fontSize: 11.5, color: '#9CA3AF', mb: 3 }}>
              ⏱ About 5–7 minutes · Skip any step · Progress saves at the end
            </Typography>
            <CustomButton mode="primary" onClick={next} style={{ padding: '12px 32px' }}>
              Let's get started →
            </CustomButton>
          </Box>
        );

      // ══ CONNECT ACCOUNTS ═════════════════════════════════════════
      case 'connectAccounts': {
        const LIVE_PLATFORMS = [
          {
            id: 'facebook',
            name: 'Facebook',
            icon: FaFacebook,
            color: '#1877F2',
            bg: '#E7F0FD',
            description: 'Pages you manage',
            flow: 'outstand',
          },
          {
            id: 'instagram',
            name: 'Instagram',
            icon: FaInstagram,
            color: '#E4405F',
            bg: '#FDE7EC',
            description: 'Business & creator accounts',
            flow: 'outstand',
          },
          {
            id: 'linkedin',
            name: 'LinkedIn',
            icon: FaLinkedin,
            color: '#0A66C2',
            bg: '#E8F1FB',
            description: 'Professional profile & company pages',
            flow: 'popup',
          },
          {
            id: 'x',
            name: 'X (Twitter)',
            icon: FaXTwitter,
            color: '#000000',
            bg: '#F0F0F0',
            description: 'Post tweets and threads',
            flow: 'popup',
            comingSoon: true,
          },
          {
            id: 'whatsapp',
            name: 'WhatsApp',
            icon: FaWhatsapp,
            color: '#25D366',
            bg: '#E8F9EF',
            description: 'Receive AI drafts via WhatsApp',
            flow: 'phone',
          },
        ];

        const handleInitiateConnect = async () => {
          if (!selectedConnectPlatform) return;
          const platform = LIVE_PLATFORMS.find((p) => p.id === selectedConnectPlatform);
          if (!platform) return;

          if (platform.flow === 'phone') {
            // WhatsApp — handled inline, no redirect needed
            if (!whatsappPhone.trim()) return;
            setConnectPhase('connecting');
            try {
              const res = await SocialConnectionService.whatsappConnect(whatsappPhone.trim());
              if (res.status) {
                setConnectedAccountNames((prev) => [...prev, whatsappPhone.trim()]);
                setConnectPhase('success');
              } else {
                setConnectPhase('selecting');
              }
            } catch {
              setConnectPhase('selecting');
            }
            return;
          }

          if (platform.flow === 'popup') {
            setConnectPhase('connecting');
            try {
              const res =
                platform.id === 'linkedin'
                  ? await SocialConnectionService.linkedinConnect()
                  : await SocialConnectionService.xConnect();
              if (res.status && res.responseData?.auth_url) {
                const authUrl = res.responseData.auth_url;
                // Try popup first; fall back to full-page redirect if blocked
                const popup = window.open(authUrl, 'uri-oauth', 'width=620,height=700,left=200,top=80');
                if (!popup || popup.closed || typeof popup.closed === 'undefined') {
                  // Popup blocked — full-page redirect
                  window.location.href = authUrl;
                  return;
                }
                // Popup opened — poll for close then check query params on return
                const timer = setInterval(() => {
                  if (popup.closed) {
                    clearInterval(timer);
                    setConnectPhase('selecting');
                    // Re-check URL params in case the page was redirected back by backend
                    const params = new URLSearchParams(window.location.search);
                    const cbConnected = params.get('connected');
                    const cbPlatform = params.get('platform');
                    const cbUsername = params.get('username');
                    if (cbConnected === 'true' && cbPlatform) {
                      const displayName = cbUsername ? decodeURIComponent(cbUsername) : cbPlatform;
                      setConnectedAccountNames((prev) => [...prev, displayName]);
                      setConnectPhase('success');
                      router.replace('/social-media/brand-setup');
                    } else if (cbConnected === 'false' && cbPlatform) {
                      setConnectPhase('selecting');
                      router.replace('/social-media/brand-setup');
                    }
                  }
                }, 800);
                return;
              }
            } catch {
              /* fall through */
            }
            setConnectPhase('selecting');
            return;
          }

          // Instagram: direct OAuth flow (bypasses Outstand)
          if (selectedConnectPlatform === 'instagram') {
            const apiBase =
              process.env.NODE_ENV !== 'production'
                ? process.env.NEXT_PUBLIC_URI_API_BASE_URL_DEV
                : process.env.NEXT_PUBLIC_URI_API_BASE_URL;
            window.location.href = `${apiBase}/social-media/connect/instagram-direct/initiate?source=onboarding`;
            return;
          }

          // Outstand flow (Facebook / other platforms)
          setConnectPhase('connecting');
          try {
            const res = await SocialAccountService.initiateConnection([selectedConnectPlatform]);
            if (res.status && res.responseData?.auth_urls) {
              const url = res.responseData.auth_urls[selectedConnectPlatform];
              if (url) {
                window.location.href = url;
                return;
              }
            }
            setConnectPhase('selecting');
          } catch {
            setConnectPhase('selecting');
          }
        };

        const handleFinalize = async () => {
          if (!connectSessionToken || selectedPageIds.length === 0) return;
          setConnectPhase('finalizing');
          try {
            const res = await SocialAccountService.finalizeConnection(connectSessionToken, selectedPageIds);
            if (res.status && res.responseData) {
              setConnectedAccountNames(
                (res.responseData.accounts_connected ?? []).map((a) => a.account_name || a.username)
              );
              setConnectPhase('success');
            } else {
              setConnectPhase('pending');
            }
          } catch {
            setConnectPhase('pending');
          }
        };

        const handlePageToggle = (id: string) =>
          setSelectedPageIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

        if (connectPhase === 'connecting' || connectPhase === 'finalizing') {
          return (
            <Box textAlign="center" py={4}>
              <CircularProgress size={48} sx={{ color: primary, mb: 2 }} />
              <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>
                {connectPhase === 'finalizing' ? 'Connecting your accounts...' : 'Loading your accounts...'}
              </Typography>
            </Box>
          );
        }

        if (connectPhase === 'pending') {
          return (
            <Box>
              <AgentBubble primary={primary}>
                Great! Choose which {connectNetworkName} accounts you want to manage through Uri Creative.
              </AgentBubble>
              <Box mt={1.5} display="flex" flexDirection="column" gap={1.25} mb={2.5}>
                {availablePages.length === 0 ? (
                  <Typography sx={{ fontSize: 13, color: '#6C727F', py: 2, textAlign: 'center' }}>
                    No accounts found. Make sure you have admin access to at least one page.
                  </Typography>
                ) : (
                  availablePages.map((page) => {
                    const isInstagram = page.type === 'instagram_business_account' || page.network === 'instagram';
                    const isAutoConnect = !!page.auto_connect;
                    const isSelected = selectedPageIds.includes(page.id);
                    return (
                      <Box
                        key={page.id}
                        onClick={() => !isAutoConnect && handlePageToggle(page.id)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          p: 2,
                          borderRadius: '12px',
                          border: '2px solid',
                          borderColor: isAutoConnect ? '#D1FAE5' : isSelected ? primary : '#E0DEF7',
                          background: isAutoConnect ? '#F0FDF4' : isSelected ? `${primary}0D` : '#fff',
                          cursor: isAutoConnect ? 'default' : 'pointer',
                          transition: 'all 0.18s',
                          '&:hover': { borderColor: isAutoConnect ? '#D1FAE5' : primary },
                          opacity: isAutoConnect ? 0.9 : 1,
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
                              bgcolor: isInstagram ? '#FDE7EC' : '#E0DEF7',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 20,
                            }}
                          >
                            {isInstagram ? '📸' : '📘'}
                          </Box>
                        )}
                        <Box flex={1}>
                          <Box display="flex" alignItems="center" gap={0.75} flexWrap="wrap">
                            <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#374151' }}>
                              {page.name}
                            </Typography>
                            {isInstagram && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: '#E4405F',
                                  background: '#FDE7EC',
                                  padding: '1px 7px',
                                  borderRadius: 20,
                                }}
                              >
                                Instagram
                              </span>
                            )}
                            {isAutoConnect && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: '#16a34a',
                                  background: '#dcfce7',
                                  padding: '1px 7px',
                                  borderRadius: 20,
                                }}
                              >
                                Auto
                              </span>
                            )}
                          </Box>
                          {page.username && (
                            <Typography sx={{ fontSize: 12, color: '#9CA3AF' }}>@{page.username}</Typography>
                          )}
                          {isAutoConnect && (
                            <Typography sx={{ fontSize: 11, color: '#9CA3AF' }}>
                              Connected automatically via Facebook
                            </Typography>
                          )}
                        </Box>
                        {!isAutoConnect && (
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handlePageToggle(page.id)}
                            onClick={(e) => e.stopPropagation()}
                            sx={{ p: 0, color: '#E0DEF7', '&.Mui-checked': { color: primary } }}
                          />
                        )}
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
                  onClick={next}
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
                  Skip for now
                </Typography>
              </Box>
            </Box>
          );
        }

        if (connectPhase === 'success') {
          return (
            <Box textAlign="center" py={2}>
              <FaCheckCircle size={48} color="#4CAF50" style={{ marginBottom: 12 }} />
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#374151', mb: 0.75 }}>
                Accounts connected!
              </Typography>
              <Typography sx={{ fontSize: 13, color: '#9CA3AF', mb: 2.5 }}>
                {connectedAccountNames.join(', ')} {connectedAccountNames.length === 1 ? 'is' : 'are'} ready to publish
                to.
              </Typography>
              <Box display="flex" gap={1.5} justifyContent="center" alignItems="center">
                <CustomButton mode="primary" onClick={next} style={{ padding: '10px 24px' }}>
                  Continue →
                </CustomButton>
                <Typography
                  component="button"
                  onClick={() => {
                    setConnectPhase('selecting');
                    setSelectedConnectPlatform(null);
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
                  Connect another
                </Typography>
              </Box>
            </Box>
          );
        }

        // Default: selecting phase
        const selectedPlatformDef = LIVE_PLATFORMS.find((p) => p.id === selectedConnectPlatform);
        return (
          <Box>
            <AgentBubble primary={primary}>
              To publish content, connect a social account. You can add more platforms anytime.
            </AgentBubble>
            <Box mt={1.5} display="flex" flexDirection="column" gap={1.5} mb={2.5}>
              {LIVE_PLATFORMS.map((platform) => {
                const IconComponent = platform.icon;
                const isSelected = selectedConnectPlatform === platform.id;
                const isComingSoon = (platform as { comingSoon?: boolean }).comingSoon;
                return (
                  <Box key={platform.id}>
                    <Box
                      onClick={() => !isComingSoon && setSelectedConnectPlatform(platform.id)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 2,
                        borderRadius: '12px',
                        border: '2px solid',
                        borderColor: isSelected ? primary : '#E0DEF7',
                        background: isComingSoon ? '#FAFAFA' : isSelected ? `${primary}0D` : '#fff',
                        cursor: isComingSoon ? 'default' : 'pointer',
                        opacity: isComingSoon ? 0.65 : 1,
                        transition: 'all 0.18s',
                        '&:hover': { borderColor: isComingSoon ? '#E0DEF7' : primary },
                      }}
                    >
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: '10px',
                          bgcolor: platform.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <IconComponent size={24} color={isComingSoon ? '#aaa' : platform.color} />
                      </Box>
                      <Box flex={1}>
                        <Typography sx={{ fontSize: 14, fontWeight: 700, color: isComingSoon ? '#9CA3AF' : '#374151' }}>
                          {platform.name}
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: '#9CA3AF' }}>{platform.description}</Typography>
                      </Box>
                      {isComingSoon ? (
                        <Box
                          sx={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#6B7280',
                            background: '#F3F4F6',
                            border: '1px solid #E5E7EB',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: '20px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Coming Soon
                        </Box>
                      ) : isSelected ? (
                        <FaCheckCircle size={18} color={primary} />
                      ) : null}
                    </Box>
                    {isSelected && platform.flow === 'phone' && (
                      <Box sx={{ mt: 1, px: 0.5 }}>
                        <UriInput
                          type="tel"
                          value={whatsappPhone}
                          onChange={setWhatsappPhone}
                          placeholder="+1 234 567 8900"
                        />
                        <Hint>Enter phone in E.164 format (e.g. +1 234 567 8900)</Hint>
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
            <Box display="flex" gap={1.5} alignItems="center">
              <CustomButton
                mode="primary"
                onClick={handleInitiateConnect}
                disabled={!selectedConnectPlatform || (selectedPlatformDef?.flow === 'phone' && !whatsappPhone.trim())}
                style={{
                  padding: '10px 24px',
                  opacity:
                    !selectedConnectPlatform || (selectedPlatformDef?.flow === 'phone' && !whatsappPhone.trim())
                      ? 0.5
                      : 1,
                }}
              >
                Connect {selectedPlatformDef?.name ?? 'account'} →
              </CustomButton>
              <Typography
                component="button"
                onClick={next}
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
                I'll do this later
              </Typography>
            </Box>
          </Box>
        );
      }

      // ══ BASICS ═══════════════════════════════════════════════════
      case 'basics':
        return (
          <Box>
            <AgentBubble primary={primary}>
              First things first — what's your brand called? Tell me a bit about what you do.
            </AgentBubble>
            <Grid container spacing={2.5} mt={0}>
              <Grid item xs={12}>
                <FieldLabel sub="*">Brand / Business Name</FieldLabel>
                <UriInput value={brandName} onChange={setBrandName} placeholder="e.g. Bloom Coffee Roasters" />
              </Grid>
              <Grid item xs={12} md={6}>
                <FieldLabel>Industry</FieldLabel>
                <Box
                  component="select"
                  value={industry}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setIndustry(e.target.value)}
                  sx={{
                    width: '100%',
                    height: 40,
                    px: 1.5,
                    borderRadius: '10px',
                    border: '1px solid #E0DEF7',
                    background: '#F7F7FD',
                    fontSize: 13.5,
                    color: '#374151',
                    outline: 'none',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">Select...</option>
                  {[
                    'Food & Beverage',
                    'Fashion & Beauty',
                    'Tech & SaaS',
                    'Health & Wellness',
                    'Real Estate',
                    'Education',
                    'E-commerce / Retail',
                    'Professional Services',
                    'Creative Agency',
                    'Finance & Fintech',
                    'Non-Profit',
                    'Entertainment',
                    'Other',
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <FieldLabel sub="(optional)">Website</FieldLabel>
                <UriInput value={website} onChange={setWebsite} placeholder="https://yourbrand.com" />
              </Grid>
              <Grid item xs={12}>
                <FieldLabel sub="(1–2 sentences)">What does your business do?</FieldLabel>
                <UriTextarea
                  value={productDesc}
                  onChange={setProductDesc}
                  placeholder="e.g. We help Lagos SMEs grow their online presence with AI-powered content."
                  rows={3}
                />
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" gap={1.5} alignItems="center">
                  <CustomButton mode="primary" onClick={next} disabled={!brandName} style={{ padding: '10px 24px' }}>
                    Continue →
                  </CustomButton>
                  <Typography
                    component="button"
                    onClick={next}
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
                    I'll do this later
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        );

      // ══ IDENTITY ═════════════════════════════════════════════════
      case 'identity':
        return (
          <Box>
            <AgentBubble primary={primary}>
              Upload your logo and pick your brand colors — I'll use these in every post I create.
            </AgentBubble>
            <Grid container spacing={2.5} mt={0}>
              <Grid item xs={12}>
                <FieldLabel sub="(PNG, JPG, WEBP or SVG · max 5 MB)">Brand Logo</FieldLabel>

                {/* Upload area */}
                <Box
                  component="label"
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    border: `2px dashed ${logoUrl ? primary : '#E0DEF7'}`,
                    borderRadius: '12px',
                    p: 3,
                    cursor: logoUploading ? 'not-allowed' : 'pointer',
                    background: logoUrl ? `${primary}08` : '#FAFAFA',
                    transition: 'border-color 0.2s, background 0.2s',
                    '&:hover': { borderColor: primary, background: `${primary}08` },
                    position: 'relative',
                    minHeight: 110,
                  }}
                >
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                    style={{ display: 'none' }}
                    disabled={logoUploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setLogoError('');
                      setLogoUploading(true);
                      try {
                        const res = await BrandProfileService.uploadLogo(file);
                        if (res.status && res.responseData?.logo_url) {
                          setLogoUrl(res.responseData.logo_url);
                        } else {
                          setLogoError('Upload failed. Please try again.');
                        }
                      } catch {
                        setLogoError('Upload failed. Please try again.');
                      } finally {
                        setLogoUploading(false);
                        e.target.value = '';
                      }
                    }}
                  />

                  {logoUploading ? (
                    <CircularProgress size={28} sx={{ color: primary }} />
                  ) : logoUrl ? (
                    <>
                      <img
                        src={logoUrl}
                        alt="brand logo"
                        style={{ maxHeight: 60, maxWidth: 180, objectFit: 'contain', borderRadius: 8 }}
                        onError={() => setLogoUrl('')}
                      />
                      <Typography sx={{ fontSize: 11.5, color: primary, fontWeight: 600 }}>Click to replace</Typography>
                    </>
                  ) : (
                    <>
                      <Typography sx={{ fontSize: 22 }}>🖼️</Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                        Click to upload your logo
                      </Typography>
                      <Typography sx={{ fontSize: 11.5, color: '#9CA3AF' }}>PNG, JPG, WEBP, SVG · max 5 MB</Typography>
                    </>
                  )}
                </Box>

                {logoError && <Typography sx={{ fontSize: 12, color: '#EF4444', mt: 0.75 }}>{logoError}</Typography>}

                {/* Optional URL fallback */}
                <Box mt={1.5}>
                  <FieldLabel sub="(or paste a direct image link instead)">Logo URL</FieldLabel>
                  <UriInput
                    value={logoUrl}
                    onChange={(v) => {
                      setLogoUrl(v);
                      setLogoError('');
                    }}
                    placeholder="https://yourbrand.com/logo.png"
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <FieldLabel>Brand Colors</FieldLabel>
                <ColorPicker colors={colors} onChange={setColors} primary={primary} />
                {colors.length > 0 && (
                  <Box display="flex" gap={1} alignItems="center" mt={1.5}>
                    {colors.map((c) => (
                      <Box
                        key={c}
                        sx={{ width: 26, height: 26, borderRadius: '6px', background: c, border: '1px solid #E0DEF7' }}
                      />
                    ))}
                    <Typography sx={{ fontSize: 11.5, color: '#9CA3AF' }}>Your brand palette</Typography>
                  </Box>
                )}
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" gap={1.5} alignItems="center">
                  <CustomButton mode="primary" onClick={next} style={{ padding: '10px 24px' }}>
                    Continue →
                  </CustomButton>
                  <Typography
                    component="button"
                    onClick={next}
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
                    I'll do this later
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        );

      // ══ PERSONALITY ══════════════════════════════════════════════
      case 'personality':
        return (
          <Box>
            <AgentBubble primary={primary}>
              My favourite part ✨ For each pair, pick the one that sounds more like your brand.
            </AgentBubble>
            <Box mt={1}>
              {quizData.map((q) => (
                <PersonalityPair
                  key={q.id}
                  optA={q.optA}
                  optB={q.optB}
                  selected={quiz[q.id]}
                  onSelect={(v) => setQuiz((p) => ({ ...p, [q.id]: v }))}
                  primary={primary}
                />
              ))}
              {Object.keys(quiz).length >= 2 && (
                <Box sx={{ background: '#F7F7FD', border: '1px solid #E0DEF7', borderRadius: '10px', p: 1.75, mb: 2 }}>
                  <Typography sx={{ fontSize: 11.5, color: '#9CA3AF', mb: 1 }}>Your voice profile:</Typography>
                  <Box display="flex" gap={0.75} flexWrap="wrap">
                    {Object.values(quiz).map((v) => (
                      <Box
                        key={v}
                        sx={{
                          background: primary,
                          color: '#fff',
                          borderRadius: 99,
                          px: 1.5,
                          py: 0.375,
                          fontSize: 11.5,
                          fontWeight: 600,
                          textTransform: 'capitalize',
                        }}
                      >
                        {v}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
              <Box display="flex" gap={1.5} alignItems="center">
                <CustomButton mode="primary" onClick={next} style={{ padding: '10px 24px' }}>
                  Continue →
                </CustomButton>
                <Typography
                  component="button"
                  onClick={next}
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
                  I'll do this later
                </Typography>
              </Box>
            </Box>
          </Box>
        );

      // ══ VISUAL STYLE ═════════════════════════════════════════════
      case 'visualStyle':
        return (
          <Box>
            <AgentBubble primary={primary}>
              Pick up to 3 visual styles that feel right for your brand. I'll rotate through them when creating your
              content — keeping your feed fresh while staying on-brand.
            </AgentBubble>
            <Box mt={1} mb={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Box
                  sx={{
                    background: styleSelections.length > 0 ? primary : '#E5E7EB',
                    borderRadius: 99,
                    px: 1.5,
                    py: 0.375,
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: styleSelections.length > 0 ? '#fff' : '#6B7280',
                    transition: 'all 0.2s',
                  }}
                >
                  {styleSelections.length}/3 selected
                </Box>
                {styleSelections.length > 0 && (
                  <Typography
                    component="button"
                    onClick={() => setStyleSelections([])}
                    sx={{
                      background: 'none',
                      border: 'none',
                      fontSize: 11.5,
                      color: '#9CA3AF',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      p: 0,
                    }}
                  >
                    Clear all
                  </Typography>
                )}
              </Box>
              <StylePickerGallery industry={industry} selected={styleSelections} onChange={setStyleSelections} />
            </Box>
            <Box display="flex" gap={1.5} alignItems="center">
              <CustomButton mode="primary" onClick={next} style={{ padding: '10px 24px' }}>
                Continue →
              </CustomButton>
              <Typography
                component="button"
                onClick={next}
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
                I'll choose later
              </Typography>
            </Box>
          </Box>
        );

      // ══ FONT STYLE ═══════════════════════════════════════════════
      case 'fontStyle':
        return (
          <Box>
            <AgentBubble primary={primary}>
              Pick a typography direction for your brand. I'll use this when placing text on your images — keeping your
              visual identity consistent across every post.
            </AgentBubble>
            <Box mt={1} mb={2}>
              {fontStyle && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Box
                    sx={{
                      background: primary,
                      borderRadius: 99,
                      px: 1.5,
                      py: 0.375,
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: '#fff',
                    }}
                  >
                    {getFont(fontStyle)?.name} selected
                  </Box>
                  <Typography
                    component="button"
                    onClick={() => setFontStyle('')}
                    sx={{
                      background: 'none',
                      border: 'none',
                      fontSize: 11.5,
                      color: '#9CA3AF',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      p: 0,
                    }}
                  >
                    Clear
                  </Typography>
                </Box>
              )}
              <FontPickerGallery selected={fontStyle} onChange={setFontStyle} />
            </Box>
            <Box display="flex" gap={1.5} alignItems="center">
              <CustomButton mode="primary" onClick={next} style={{ padding: '10px 24px' }}>
                Continue →
              </CustomButton>
              <Typography
                component="button"
                onClick={next}
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
                I'll choose later
              </Typography>
            </Box>
          </Box>
        );

      // ══ PLATFORM TONE ════════════════════════════════════════════
      case 'platformTone':
        return (
          <Box>
            <AgentBubble primary={primary}>
              Should I use the same voice everywhere, or adjust my tone per platform?
            </AgentBubble>
            <Box mt={1.5}>
              <Box display="flex" gap={1.5} mb={2}>
                <OptionCard
                  emoji="🔗"
                  label="Same everywhere"
                  desc="One consistent voice"
                  active={sameTone}
                  onClick={() => setSameTone(true)}
                  primary={primary}
                />
                <OptionCard
                  emoji="🎭"
                  label="Customize per platform"
                  desc="Adjust tone by channel"
                  active={!sameTone}
                  onClick={() => setSameTone(false)}
                  primary={primary}
                />
              </Box>
              {!sameTone && (
                <Box display="flex" flexDirection="column" gap={2} mb={2}>
                  {connectedPlatforms.map((p) => (
                    <Box key={p}>
                      <FieldLabel>{p}</FieldLabel>
                      <Box display="flex" gap={0.75} flexWrap="wrap" mt={0.75}>
                        {toneOptions.map((t) => (
                          <Chip
                            key={t}
                            label={t}
                            active={platformTones[p] === t}
                            onClick={() => setPlatformTones((prev) => ({ ...prev, [p]: t }))}
                            primary={primary}
                          />
                        ))}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
              <Box display="flex" gap={1.5} alignItems="center">
                <CustomButton mode="primary" onClick={next} style={{ padding: '10px 24px' }}>
                  Continue →
                </CustomButton>
                <Typography
                  component="button"
                  onClick={next}
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
                  I'll do this later
                </Typography>
              </Box>
            </Box>
          </Box>
        );

      // ══ VOICE SAMPLE ═════════════════════════════════════════════
      case 'voiceSample':
        return (
          <Box>
            <AgentBubble primary={primary}>
              Got a caption, email, or piece of writing that really sounds like your brand? Paste it here — real
              examples beat any quiz.
            </AgentBubble>
            <Box mt={1.5}>
              <FieldLabel sub="(optional but powerful)">Sample of your brand voice</FieldLabel>
              <UriTextarea
                value={voiceSample}
                onChange={setVoiceSample}
                placeholder="Paste your best caption, a paragraph from your site, or an email that nailed your tone..."
                rows={5}
              />
              {voiceSample.length > 30 && (
                <Box sx={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', p: 1.5, mt: 1.5 }}>
                  <Box display="flex" alignItems="center" gap={0.75}>
                    <FaCheckCircle color="#16A34A" size={13} />
                    <Typography sx={{ fontSize: 12.5, color: '#166534' }}>
                      Locked in — I'll mirror this tone in everything I write.
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* ── Template / design samples ── */}
              <Box mt={2.5}>
                <FieldLabel sub="(optional — images or PDFs)">Sample designs or content templates</FieldLabel>
                <Hint>
                  Upload posts, flyers, or any content that nails your visual style — I'll use these as reference.
                </Hint>

                <Box
                  component="label"
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    border: `2px dashed ${sampleTemplateUrls.length > 0 ? primary : '#E0DEF7'}`,
                    borderRadius: '12px',
                    p: 2.5,
                    mt: 1,
                    cursor: sampleTemplateUploading ? 'not-allowed' : 'pointer',
                    background: sampleTemplateUrls.length > 0 ? `${primary}08` : '#FAFAFA',
                    transition: 'border-color 0.2s, background 0.2s',
                    '&:hover': { borderColor: primary, background: `${primary}08` },
                  }}
                >
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                    multiple
                    style={{ display: 'none' }}
                    disabled={sampleTemplateUploading}
                    onChange={async (e) => {
                      const files = Array.from(e.target.files ?? []);
                      if (!files.length) return;
                      setSampleTemplateError('');
                      setSampleTemplateUploading(true);
                      try {
                        const results = await Promise.all(
                          files.map((f) => BrandProfileService.uploadSampleTemplate(f))
                        );
                        const urls = results.flatMap((r) =>
                          r.status && r.responseData?.file_url ? [r.responseData.file_url] : []
                        );
                        if (urls.length) {
                          setSampleTemplateUrls((prev) => [...prev, ...urls]);
                        } else {
                          setSampleTemplateError('Upload failed. Please try again.');
                        }
                      } catch {
                        setSampleTemplateError('Upload failed. Please try again.');
                      } finally {
                        setSampleTemplateUploading(false);
                        e.target.value = '';
                      }
                    }}
                  />
                  {sampleTemplateUploading ? (
                    <CircularProgress size={24} sx={{ color: primary }} />
                  ) : (
                    <>
                      <FaImage size={22} color={primary} />
                      <Typography sx={{ fontSize: 12.5, color: '#6B7280', textAlign: 'center' }}>
                        Click to upload sample designs
                        <br />
                        <span style={{ fontSize: 11, color: '#9CA3AF' }}>PNG, JPG, WEBP or PDF · up to 5 files</span>
                      </Typography>
                    </>
                  )}
                </Box>

                {sampleTemplateError && (
                  <Typography sx={{ fontSize: 12, color: '#DC2626', mt: 0.75 }}>{sampleTemplateError}</Typography>
                )}

                {sampleTemplateUrls.length > 0 && (
                  <Box display="flex" flexWrap="wrap" gap={1} mt={1.5}>
                    {sampleTemplateUrls.map((url, i) => (
                      <Box
                        key={i}
                        sx={{
                          position: 'relative',
                          width: 72,
                          height: 72,
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '1px solid #E5E7EB',
                          flexShrink: 0,
                        }}
                      >
                        {url.endsWith('.pdf') ? (
                          <Box
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            sx={{ width: '100%', height: '100%', background: '#F3F4F6' }}
                          >
                            <Typography sx={{ fontSize: 10, color: '#6B7280', textAlign: 'center', px: 0.5 }}>
                              PDF
                            </Typography>
                          </Box>
                        ) : (
                          <Image src={url} alt={`sample ${i + 1}`} fill style={{ objectFit: 'cover' }} />
                        )}
                        <Box
                          component="button"
                          onClick={() => setSampleTemplateUrls((prev) => prev.filter((_, idx) => idx !== i))}
                          sx={{
                            position: 'absolute',
                            top: 2,
                            right: 2,
                            background: 'rgba(0,0,0,0.55)',
                            border: 'none',
                            borderRadius: '50%',
                            width: 18,
                            height: 18,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            p: 0,
                          }}
                        >
                          <FaTimes size={9} color="#fff" />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>

              <Box display="flex" gap={1.5} alignItems="center" mt={2.5}>
                <CustomButton mode="primary" onClick={next} style={{ padding: '10px 24px' }}>
                  Continue →
                </CustomButton>
                <Typography
                  component="button"
                  onClick={next}
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
                  I'll do this later
                </Typography>
              </Box>
            </Box>
          </Box>
        );

      // ══ PILLARS ══════════════════════════════════════════════════
      case 'pillars':
        return (
          <Box>
            <AgentBubble primary={primary}>
              What do you want to talk about? Pick 3–5 content pillars, then drag to rank by priority.
            </AgentBubble>
            <Box mt={1.5}>
              <FieldLabel>Select 3–5 content pillars</FieldLabel>
              <Box display="flex" gap={0.75} flexWrap="wrap" mt={0.75} mb={2}>
                {allPillars.map((p) => (
                  <Chip
                    key={p}
                    label={p}
                    active={pillars.includes(p)}
                    onClick={() => toggle(pillars, setPillars, p, 5)}
                    primary={primary}
                  />
                ))}
              </Box>
              {pillars.length >= 2 && (
                <Box mb={2}>
                  <FieldLabel sub="(#1 = most posts)">Drag to rank</FieldLabel>
                  <Box mt={0.75}>
                    <PillarRanker items={pillars} onReorder={setPillars} primary={primary} />
                  </Box>
                </Box>
              )}
              <Box display="flex" gap={1.5} alignItems="center">
                <CustomButton mode="primary" onClick={next} style={{ padding: '10px 24px' }}>
                  Continue →
                </CustomButton>
                <Typography
                  component="button"
                  onClick={next}
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
                  I'll do this later
                </Typography>
              </Box>
            </Box>
          </Box>
        );

      // ══ FORMATS ══════════════════════════════════════════════════
      case 'formats':
        return (
          <Box>
            <AgentBubble primary={primary}>
              What content formats do you prefer? I'll focus on these and skip formats you don't want.
            </AgentBubble>
            <Box mt={1.5}>
              <FieldLabel sub="(select all that apply)">Preferred content formats</FieldLabel>
              <Box display="flex" gap={0.75} flexWrap="wrap" mt={0.75} mb={1.5}>
                {allFormats.map((fmt) => (
                  <Chip
                    key={fmt.name}
                    label={fmt.name}
                    emoji={fmt.emoji}
                    active={formats.includes(fmt.name)}
                    onClick={() => toggle(formats, setFormats, fmt.name)}
                    primary={primary}
                  />
                ))}
              </Box>
              <Hint>I'll create a mix weighted toward your top choices. You can adjust anytime.</Hint>
              <Box display="flex" gap={1.5} alignItems="center" mt={2}>
                <CustomButton mode="primary" onClick={next} style={{ padding: '10px 24px' }}>
                  Continue →
                </CustomButton>
                <Typography
                  component="button"
                  onClick={next}
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
                  I'll do this later
                </Typography>
              </Box>
            </Box>
          </Box>
        );

      // ══ GUARDRAILS ═══════════════════════════════════════════════
      case 'guardrails':
        return (
          <Box>
            <AgentBubble primary={primary}>
              Every good team member needs boundaries. Tell me what to avoid — topics, words, or rules I should always
              follow.
            </AgentBubble>
            <Grid container spacing={2} mt={0}>
              <Grid item xs={12}>
                <FieldLabel sub="(e.g. politics, religion, competitors)">Topics to avoid</FieldLabel>
                <UriTextarea
                  value={avoidTopics}
                  onChange={setAvoidTopics}
                  placeholder="Never mention competitor brands, avoid political commentary..."
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <FieldLabel>Words or phrases to never use</FieldLabel>
                <UriInput value={bannedWords} onChange={setBannedWords} placeholder='"cheap", "guys", "synergy"' />
              </Grid>
              <Grid item xs={12}>
                <FieldLabel>Emoji usage</FieldLabel>
                <Box display="flex" gap={0.75} mt={0.75}>
                  {[
                    { l: 'Yes, love them 🎉', v: 'yes' },
                    { l: 'Sparingly', v: 'some' },
                    { l: 'Never', v: 'no' },
                  ].map((o) => (
                    <Chip
                      key={o.v}
                      label={o.l}
                      active={useEmoji === o.v}
                      onClick={() => setUseEmoji(o.v)}
                      primary={primary}
                    />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <FieldLabel>Max hashtags per post</FieldLabel>
                <Box display="flex" gap={0.75} mt={0.75}>
                  {['3', '5', '10', '15', 'No limit'].map((n) => (
                    <Chip key={n} label={n} active={maxHash === n} onClick={() => setMaxHash(n)} primary={primary} />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <FieldLabel sub="(optional — finance, health, legal)">Compliance notes</FieldLabel>
                <UriTextarea
                  value={compliance}
                  onChange={setCompliance}
                  placeholder="All health claims need disclaimers..."
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" gap={1.5} alignItems="center">
                  <CustomButton mode="primary" onClick={next} style={{ padding: '10px 24px' }}>
                    Continue →
                  </CustomButton>
                  <Typography
                    component="button"
                    onClick={next}
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
                    I'll do this later
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        );

      // ══ CTA ══════════════════════════════════════════════════════
      case 'cta':
        return (
          <Box>
            <AgentBubble primary={primary}>
              What call-to-action style fits your brand? And is there a default link you always want to drive traffic
              to?
            </AgentBubble>
            <Box mt={1.5}>
              <FieldLabel sub="(select all that fit)">Preferred CTAs</FieldLabel>
              <Box display="flex" gap={0.75} flexWrap="wrap" mt={0.75} mb={2.5}>
                {allCtas.map((c) => (
                  <Chip
                    key={c}
                    label={c}
                    active={ctaStyle.includes(c)}
                    onClick={() => toggle(ctaStyle, setCtaStyle, c)}
                    primary={primary}
                  />
                ))}
              </Box>
              <FieldLabel sub="(optional)">Default link</FieldLabel>
              <Box mt={0.75} mb={2}>
                <UriInput value={defaultLink} onChange={setDefaultLink} placeholder="https://yourbrand.com/shop" />
              </Box>
              <Box display="flex" gap={1.5} alignItems="center">
                <CustomButton mode="primary" onClick={next} style={{ padding: '10px 24px' }}>
                  Continue →
                </CustomButton>
                <Typography
                  component="button"
                  onClick={next}
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
                  I'll do this later
                </Typography>
              </Box>
            </Box>
          </Box>
        );

      // ══ AUDIENCE ═════════════════════════════════════════════════
      case 'audience':
        return (
          <Box>
            <AgentBubble primary={primary}>
              Who are we trying to reach? This shapes what I write, when I post, and where.
            </AgentBubble>
            <Grid container spacing={2.5} mt={0}>
              <Grid item xs={12}>
                <FieldLabel sub="(select all that apply)">Target audience age range</FieldLabel>
                <Box display="flex" gap={0.75} flexWrap="wrap" mt={0.75}>
                  {['Gen Z (18-24)', 'Millennials (25-40)', 'Gen X (41-56)', 'Boomers (57+)', 'Everyone'].map((a) => (
                    <Chip
                      key={a}
                      label={a}
                      active={audienceAge.includes(a)}
                      onClick={() => toggle(audienceAge, setAudienceAge, a)}
                      primary={primary}
                    />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <FieldLabel>Priority platforms</FieldLabel>
                <Box display="flex" gap={0.75} flexWrap="wrap" mt={0.75}>
                  {[
                    { n: 'Instagram', e: '📸' },
                    { n: 'Facebook', e: '👥' },
                    { n: 'X / Twitter', e: '🐦' },
                    { n: 'LinkedIn', e: '💼' },
                    { n: 'TikTok', e: '🎵' },
                    { n: 'Pinterest', e: '📌' },
                    { n: 'YouTube', e: '▶️' },
                  ].map((p) => (
                    <Chip
                      key={p.n}
                      label={p.n}
                      emoji={p.e}
                      active={targetPlatforms.includes(p.n)}
                      onClick={() => toggle(targetPlatforms, setTargetPlatforms, p.n)}
                      primary={primary}
                    />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <FieldLabel>Primary goal</FieldLabel>
                <Box display="flex" gap={0.75} flexWrap="wrap" mt={0.75}>
                  {[
                    'Brand Awareness',
                    'Drive Sales',
                    'Grow Following',
                    'Build Community',
                    'Lead Generation',
                    'Website Traffic',
                  ].map((g) => (
                    <Chip key={g} label={g} active={goal === g} onClick={() => setGoal(g)} primary={primary} />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" gap={1.5} alignItems="center">
                  <CustomButton mode="primary" onClick={next} style={{ padding: '10px 24px' }}>
                    Continue →
                  </CustomButton>
                  <Typography
                    component="button"
                    onClick={next}
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
                    I'll do this later
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        );

      // ══ COMPETITORS ══════════════════════════════════════════════
      case 'competitors':
        return (
          <Box>
            <AgentBubble primary={primary}>
              Who are your competitors or brands you admire? I'll monitor them and flag opportunities.
            </AgentBubble>
            <Box mt={1.5}>
              <FieldLabel sub="(up to 3)">Competitor / aspirational handles</FieldLabel>
              <Box display="flex" flexDirection="column" gap={1} mt={0.75} mb={2}>
                {competitors.map((c, i) => (
                  <Box key={i} display="flex" alignItems="center" gap={1}>
                    <Typography sx={{ color: '#9CA3AF', fontSize: 13, flexShrink: 0 }}>@</Typography>
                    <UriInput
                      value={c}
                      onChange={(v) => {
                        const cp = [...competitors];
                        cp[i] = v;
                        setCompetitors(cp);
                      }}
                      placeholder={['e.g. competitor_brand', 'e.g. aspirational_brand', 'e.g. another_brand'][i]}
                    />
                  </Box>
                ))}
              </Box>
              <Box display="flex" gap={1.5} alignItems="center">
                <CustomButton mode="primary" onClick={next} style={{ padding: '10px 24px' }}>
                  Continue →
                </CustomButton>
                <Typography
                  component="button"
                  onClick={next}
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
                  I'll do this later
                </Typography>
              </Box>
            </Box>
          </Box>
        );

      // ══ CALENDAR ═════════════════════════════════════════════════
      case 'calendar':
        return (
          <Box>
            <AgentBubble primary={primary}>
              Any important dates? Product launches, sales, anniversaries — I'll plan content around them automatically.
            </AgentBubble>
            <Box mt={1.5}>
              <FieldLabel>Key dates</FieldLabel>
              <Box display="flex" gap={1} mt={0.75} mb={1.5}>
                <Box
                  component="input"
                  type="date"
                  value={newDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDate(e.target.value)}
                  sx={{
                    flex: '0 0 150px',
                    height: 40,
                    px: 1.5,
                    borderRadius: '10px',
                    border: '1px solid #E0DEF7',
                    background: '#F7F7FD',
                    fontSize: 13,
                    color: '#374151',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
                <Box
                  component="input"
                  value={newDateLabel}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDateLabel(e.target.value)}
                  placeholder="e.g. Summer Sale Launch"
                  sx={{
                    flex: 1,
                    height: 40,
                    px: 1.5,
                    borderRadius: '10px',
                    border: '1px solid #E0DEF7',
                    background: '#F7F7FD',
                    fontSize: 13,
                    color: '#374151',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
                <CustomButton
                  mode="primary"
                  onClick={() => {
                    if (newDate && newDateLabel) {
                      setKeyDates((p) => [...p, { date: newDate, label: newDateLabel }]);
                      setNewDate('');
                      setNewDateLabel('');
                    }
                  }}
                  disabled={!newDate || !newDateLabel}
                  style={{ padding: '10px 16px', minWidth: 'unset' }}
                >
                  +
                </CustomButton>
              </Box>
              {keyDates.length > 0 && (
                <Box display="flex" flexDirection="column" gap={0.75} mb={2}>
                  {keyDates.map((d, i) => (
                    <Box
                      key={i}
                      display="flex"
                      alignItems="center"
                      gap={1}
                      sx={{ background: '#F7F7FD', border: '1px solid #E0DEF7', borderRadius: '8px', px: 1.5, py: 1 }}
                    >
                      <Typography sx={{ fontWeight: 600, fontSize: 12.5, color: '#374151' }}>{d.date}</Typography>
                      <Typography sx={{ color: '#9CA3AF', fontSize: 12 }}>—</Typography>
                      <Typography sx={{ flex: 1, fontSize: 12.5, color: '#374151' }}>{d.label}</Typography>
                      <Box
                        component="button"
                        onClick={() => setKeyDates((p) => p.filter((_, idx) => idx !== i))}
                        sx={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#9CA3AF',
                          fontSize: 16,
                          lineHeight: 1,
                        }}
                      >
                        ×
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
              <Box display="flex" gap={1.5} alignItems="center">
                <CustomButton mode="primary" onClick={next} style={{ padding: '10px 24px' }}>
                  Continue →
                </CustomButton>
                <Typography
                  component="button"
                  onClick={next}
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
                  I'll do this later
                </Typography>
              </Box>
            </Box>
          </Box>
        );

      // ══ CADENCE ══════════════════════════════════════════════════
      case 'cadence':
        return (
          <Box>
            <AgentBubble primary={primary}>How often should I post?</AgentBubble>
            <Box mt={1.5}>
              <FieldLabel>Posting frequency</FieldLabel>
              <Box display="flex" gap={0.75} flexWrap="wrap" mt={0.75} mb={2}>
                {[
                  { l: 'Daily', e: '🚀' },
                  { l: '5x / week', e: '💪' },
                  { l: '3x / week', e: '👍' },
                  { l: 'Weekly', e: '🌱' },
                  { l: 'Let AI decide', e: '🤖' },
                ].map((o) => (
                  <Chip
                    key={o.l}
                    label={o.l}
                    emoji={o.e}
                    active={cadence === o.l}
                    onClick={() => setCadence(o.l)}
                    primary={primary}
                  />
                ))}
              </Box>
              <Box display="flex" gap={1.5} alignItems="center">
                <CustomButton mode="primary" onClick={next} style={{ padding: '10px 24px' }}>
                  Continue →
                </CustomButton>
                <Typography
                  component="button"
                  onClick={next}
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
                  I'll do this later
                </Typography>
              </Box>
            </Box>
          </Box>
        );

      // ══ POSTING TIMES ════════════════════════════════════════════
      case 'postingTimes':
        return (
          <Box>
            <AgentBubble primary={primary}>
              When should I post? I can figure out the optimal times, or you can set preferences.
            </AgentBubble>
            <Box mt={1.5}>
              <FieldLabel>Posting time strategy</FieldLabel>
              <Box display="flex" gap={1.5} mb={2} mt={0.75}>
                <OptionCard
                  emoji="🤖"
                  label="AI Optimal"
                  desc="I'll pick the best times"
                  active={timeMode === 'ai'}
                  onClick={() => setTimeMode('ai')}
                  primary={primary}
                />
                <OptionCard
                  emoji="☀️"
                  label="General Preference"
                  desc="Pick broad time-of-day slots"
                  active={timeMode === 'general'}
                  onClick={() => setTimeMode('general')}
                  primary={primary}
                />
                <OptionCard
                  emoji="🕐"
                  label="Set Per-Platform"
                  desc="Choose specific time windows"
                  active={timeMode === 'custom'}
                  onClick={() => setTimeMode('custom')}
                  primary={primary}
                />
              </Box>
              {timeMode === 'general' && (
                <Box mb={2}>
                  <FieldLabel>Preferred time of day</FieldLabel>
                  <Box display="flex" gap={0.75} flexWrap="wrap" mt={0.75}>
                    {[
                      { l: 'Early Morning (6-9am)', e: '🌅' },
                      { l: 'Late Morning (9am-12pm)', e: '☀️' },
                      { l: 'Afternoon (12-4pm)', e: '🌤️' },
                      { l: 'Evening (4-8pm)', e: '🌆' },
                      { l: 'Night (8pm-12am)', e: '🌙' },
                    ].map((t) => (
                      <Chip
                        key={t.l}
                        label={t.l}
                        emoji={t.e}
                        active={(timePrefs.general || '').includes(t.l)}
                        onClick={() =>
                          setTimePrefs((p) => ({
                            ...p,
                            general: (p.general || '').includes(t.l)
                              ? (p.general || '').replace(t.l + ',', '')
                              : `${p.general || ''}${t.l},`,
                          }))
                        }
                        primary={primary}
                      />
                    ))}
                  </Box>
                </Box>
              )}
              {timeMode === 'ai' && (
                <Box sx={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', p: 1.5, mb: 2 }}>
                  <Typography sx={{ fontSize: 12.5, color: '#166534' }}>
                    ✨ I'll analyze when your audience is most active and schedule posts for peak engagement.
                  </Typography>
                </Box>
              )}
              <Box display="flex" gap={1.5} alignItems="center">
                <CustomButton mode="primary" onClick={next} style={{ padding: '10px 24px' }}>
                  Continue →
                </CustomButton>
                <Typography
                  component="button"
                  onClick={next}
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
                  I'll do this later
                </Typography>
              </Box>
            </Box>
          </Box>
        );

      // ══ APPROVAL CHANNELS ════════════════════════════════════════
      case 'approvalChannels':
        return (
          <Box>
            <AgentBubble primary={primary}>How do you want to approve posts before they go live?</AgentBubble>
            <Box mt={1.5}>
              <FieldLabel>Approval workflow</FieldLabel>
              <Box display="flex" gap={1.5} mb={2} mt={0.75}>
                <OptionCard
                  emoji="👀"
                  label="Review first"
                  desc="I queue posts for your approval"
                  active={approval === 'review'}
                  onClick={() => setApproval('review')}
                  primary={primary}
                />
                <OptionCard
                  emoji="⚡"
                  label="Auto-publish"
                  desc="I post on schedule"
                  active={approval === 'auto'}
                  onClick={() => setApproval('auto')}
                  primary={primary}
                />
                <OptionCard
                  emoji="🔀"
                  label="Hybrid"
                  desc="Auto for recurring, review for campaigns"
                  active={approval === 'hybrid'}
                  onClick={() => setApproval('hybrid')}
                  primary={primary}
                />
              </Box>
              {(approval === 'review' || approval === 'hybrid') && (
                <Box mb={2}>
                  <FieldLabel sub="(select all)">Where do you want to review &amp; approve?</FieldLabel>
                  <Box display="flex" flexDirection="column" gap={0.875} mt={0.75}>
                    {[
                      { name: 'Dashboard', emoji: '🖥️', color: primary },
                      { name: 'WhatsApp', emoji: '💬', color: '#25D366' },
                      { name: 'Email', emoji: '📧', color: '#EA4335' },
                      { name: 'Slack', emoji: '💼', color: '#4A154B' },
                      { name: 'Telegram', emoji: '✈️', color: '#0088cc' },
                    ].map((ch) => (
                      <Box
                        key={ch.name}
                        component="button"
                        onClick={() => toggle(approvalChannels, setApprovalChannels, ch.name)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          px: 1.75,
                          py: 1.25,
                          borderRadius: '10px',
                          border: `2px solid ${approvalChannels.includes(ch.name) ? ch.color : '#E0DEF7'}`,
                          background: approvalChannels.includes(ch.name) ? `${ch.color}10` : '#fff',
                          cursor: 'pointer',
                          transition: 'all 0.18s',
                          textAlign: 'left',
                          '&:hover': { borderColor: ch.color },
                        }}
                      >
                        <Typography sx={{ fontSize: 20 }}>{ch.emoji}</Typography>
                        <Typography sx={{ flex: 1, fontWeight: 600, fontSize: 13, color: '#374151' }}>
                          {ch.name}
                        </Typography>
                        <Box
                          sx={{
                            width: 18,
                            height: 18,
                            borderRadius: '5px',
                            border: `2px solid ${approvalChannels.includes(ch.name) ? ch.color : '#D1D5DB'}`,
                            background: approvalChannels.includes(ch.name) ? ch.color : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {approvalChannels.includes(ch.name) && (
                            <Typography sx={{ color: '#fff', fontSize: 11, lineHeight: 1 }}>✓</Typography>
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
              {approval === 'auto' && (
                <Box sx={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', p: 1.5, mb: 2 }}>
                  <Typography sx={{ fontSize: 12.5, color: '#166534' }}>
                    ⚡ I'll publish posts automatically on schedule. You can still pause or edit any queued post from
                    your dashboard.
                  </Typography>
                </Box>
              )}
              <Box display="flex" gap={1.5} alignItems="center">
                <CustomButton mode="primary" onClick={next} style={{ padding: '10px 24px' }}>
                  Continue →
                </CustomButton>
                <Typography
                  component="button"
                  onClick={next}
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
                  I'll do this later
                </Typography>
              </Box>
            </Box>
          </Box>
        );

      // ══ NOTIFICATIONS ════════════════════════════════════════════
      case 'notifications':
        return (
          <Box>
            <AgentBubble primary={primary}>How do you want me to keep you in the loop?</AgentBubble>
            <Grid container spacing={2.5} mt={0}>
              <Grid item xs={12}>
                <FieldLabel sub="(select all)">Notify me when...</FieldLabel>
                <Box display="flex" gap={0.75} flexWrap="wrap" mt={0.75}>
                  {[
                    'Post ready for review',
                    'Post published',
                    'Weekly performance report',
                    'Trending topic in your niche',
                    'Content calendar needs refill',
                    'Engagement spike detected',
                  ].map((ev) => (
                    <Chip
                      key={ev}
                      label={ev}
                      active={notifEvents.includes(ev)}
                      onClick={() => toggle(notifEvents, setNotifEvents, ev)}
                      primary={primary}
                    />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <FieldLabel>Preferred notification channel</FieldLabel>
                <Box display="flex" gap={0.75} flexWrap="wrap" mt={0.75}>
                  {[
                    { l: 'Email', e: '📧' },
                    { l: 'WhatsApp', e: '💬' },
                    { l: 'SMS', e: '📱' },
                    { l: 'Push Notification', e: '🔔' },
                    { l: 'Slack', e: '💼' },
                    { l: 'Telegram', e: '✈️' },
                  ].map((c) => (
                    <Chip
                      key={c.l}
                      label={c.l}
                      emoji={c.e}
                      active={notifChannel === c.l}
                      onClick={() => setNotifChannel(c.l)}
                      primary={primary}
                    />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" gap={1.5} alignItems="center">
                  <CustomButton mode="primary" onClick={next} style={{ padding: '10px 24px' }}>
                    Continue →
                  </CustomButton>
                  <Typography
                    component="button"
                    onClick={next}
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
                    I'll do this later
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        );

      // ══ LANGUAGE ═════════════════════════════════════════════════
      case 'language':
        return (
          <Box>
            <AgentBubble primary={primary}>
              What language(s) should I write in? Any regional preferences — like local slang or cultural references?
            </AgentBubble>
            <Grid container spacing={2.5} mt={0}>
              <Grid item xs={12}>
                <FieldLabel sub="(select all)">Content languages</FieldLabel>
                <Box display="flex" gap={0.75} flexWrap="wrap" mt={0.75}>
                  {['English', 'Yoruba', 'Pidgin', 'French', 'Hausa', 'Igbo', 'Swahili', 'Other'].map((l) => (
                    <Chip
                      key={l}
                      label={l}
                      active={languages.includes(l)}
                      onClick={() => toggle(languages, setLanguages, l)}
                      primary={primary}
                    />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <FieldLabel sub="(select all that apply)">Region / market</FieldLabel>
                <Box display="flex" gap={0.75} flexWrap="wrap" mt={0.75}>
                  {[
                    'Nigeria',
                    'West Africa',
                    'Pan-African',
                    'United States',
                    'United Kingdom',
                    'Global / International',
                    'Other',
                  ].map((r) => (
                    <Chip
                      key={r}
                      label={r}
                      active={region.includes(r)}
                      onClick={() => toggle(region, setRegion, r)}
                      primary={primary}
                    />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <CustomButton mode="primary" onClick={next} style={{ padding: '10px 28px' }}>
                  Generate my profile →
                </CustomButton>
              </Grid>
            </Grid>
          </Box>
        );

      // ══ PREVIEW ══════════════════════════════════════════════════
      case 'preview':
        return (
          <Box>
            <AgentBubble primary={primary}>
              Here's a summary of the brand profile I've built for <strong>{brandName || 'your brand'}</strong>.
              Everything looks good?
            </AgentBubble>
            <Box
              mt={1.5}
              sx={{ background: '#fff', border: '1px solid #E0DEF7', borderRadius: '14px', overflow: 'hidden' }}
            >
              {/* Profile header strip */}
              <Box sx={{ background: `linear-gradient(135deg, ${primary}, ${primary}cc)`, px: 2.5, py: 2 }}>
                <Typography
                  sx={{
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: 1.5,
                    color: 'rgba(255,255,255,0.7)',
                    fontWeight: 700,
                    mb: 0.5,
                  }}
                >
                  Brand Profile
                </Typography>
                <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
                  {brandName || 'Your Brand'}
                </Typography>
                {industry && (
                  <Typography sx={{ fontSize: 12.5, color: 'rgba(255,255,255,0.75)', mt: 0.25 }}>{industry}</Typography>
                )}
              </Box>
              {/* Profile grid */}
              <Box sx={{ px: 2.5, py: 2 }}>
                <Grid container spacing={2}>
                  {[
                    {
                      l: 'Voice',
                      v:
                        Object.values(quiz)
                          .map((v) => v[0].toUpperCase() + v.slice(1))
                          .join(', ') || '—',
                    },
                    { l: 'Goal', v: goal || '—' },
                    { l: 'Platforms', v: targetPlatforms.slice(0, 3).join(', ') || '—' },
                    { l: 'Cadence', v: cadence || '—' },
                    { l: 'Approval', v: approval || '—' },
                    { l: 'Top pillars', v: pillars.slice(0, 2).join(', ') || '—' },
                    { l: 'Languages', v: languages.join(', ') || '—' },
                    { l: 'Region', v: region.join(', ') || '—' },
                  ].map((item) => (
                    <Grid item xs={6} key={item.l}>
                      <Typography
                        sx={{
                          fontSize: 10.5,
                          color: '#9CA3AF',
                          mb: 0.25,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                        }}
                      >
                        {item.l}
                      </Typography>
                      <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: '#374151', lineHeight: 1.3 }}>
                        {item.v}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
                {colors.length > 0 && (
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={1}
                    mt={2}
                    pt={1.5}
                    sx={{ borderTop: '1px solid #F3F4F6' }}
                  >
                    <Typography
                      sx={{
                        fontSize: 10.5,
                        color: '#9CA3AF',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      Brand colors
                    </Typography>
                    {colors.map((c) => (
                      <Box
                        key={c}
                        sx={{ width: 18, height: 18, borderRadius: '5px', background: c, border: '1px solid #E0DEF7' }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
            <Box mt={2.5} sx={{ borderTop: '1px solid #F3F4F6', pt: 2.5 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#374151', mb: 1.5 }}>
                Does this profile capture your brand accurately?
              </Typography>
              <Box display="flex" gap={1.5} mb={2}>
                {[
                  { e: '🎯', l: 'Nailed it!', v: 'great' },
                  { e: '👍', l: 'Close enough', v: 'okay' },
                  { e: '🔄', l: 'Needs work', v: 'miss' },
                ].map((o) => (
                  <OptionCard
                    key={o.v}
                    emoji={o.e}
                    label={o.l}
                    active={postFeedback === o.v}
                    onClick={() => setPostFeedback(o.v)}
                    primary={primary}
                  />
                ))}
              </Box>
              {postFeedback && postFeedback !== 'great' && (
                <Box mb={2}>
                  <UriTextarea
                    value=""
                    onChange={() => {}}
                    placeholder="Tell me what's off — I'll factor it in..."
                    rows={3}
                  />
                </Box>
              )}
              <CustomButton
                mode="primary"
                onClick={handleComplete}
                loading={saving}
                style={{ padding: '12px 32px', width: '100%', opacity: postFeedback ? 1 : 0.45 }}
              >
                {saving ? 'Setting up your workspace...' : 'Go to Dashboard →'}
              </CustomButton>
              <Typography sx={{ fontSize: 12, color: '#9CA3AF', mt: 1.5, textAlign: 'center' }}>
                Your brand profile is saved. Edit it anytime in Settings → Brand Profile.
              </Typography>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  // ─── Loading state while checking existing profile ────────────
  if (checkingExisting) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: themeColors.background,
        }}
      >
        <CircularProgress sx={{ color: primary }} />
      </Box>
    );
  }

  return (
    <>
      <Navbar />
      <Box
        sx={{
          background: themeColors.background,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          pt: '64px',
        }}
      >
        {/* Progress bar and back button */}
        {step > 0 && (
          <Box
            sx={{
              background: '#fff',
              borderBottom: '1px solid #F3F4F6',
              px: { xs: 2, md: 3 },
              py: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            {/* Back button */}
            <Box
              component="button"
              onClick={prev}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                background: 'none',
                border: '1px solid #E0DEF7',
                borderRadius: '8px',
                px: 1.5,
                py: 0.75,
                cursor: 'pointer',
                color: primary,
                fontSize: 12.5,
                fontWeight: 600,
                '&:hover': { background: '#F7F7FD' },
              }}
            >
              <FaArrowLeft size={12} />
              Back
            </Box>

            {/* Progress bar */}
            <Box sx={{ flex: 1, maxWidth: 360 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: primary }}>
                  {Math.round(progressPct)}% complete
                </Typography>
                <Typography sx={{ fontSize: 11, color: '#9CA3AF' }}>
                  {progressStep}/{progressibleSteps}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progressPct}
                sx={{
                  height: 5,
                  borderRadius: 3,
                  background: '#F3F4F6',
                  '& .MuiLinearProgress-bar': {
                    background: `linear-gradient(90deg, ${primary}, ${primary}cc)`,
                    borderRadius: 3,
                  },
                }}
              />
            </Box>

            <Box sx={{ width: 72 }} />
          </Box>
        )}

        {/* ── Card body ────────────────────────────────────────── */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            py: { xs: 3, md: 5 },
            px: { xs: 2, md: 3 },
          }}
        >
          <Box
            sx={{
              width: '100%',
              maxWidth: 680,
              backgroundColor: '#fff',
              borderRadius: '20px',
              p: { xs: 3, md: 4.5 },
              boxShadow: '1px 1px 6px 3px #00000011',
            }}
          >
            {/* Step section heading (shown for non-welcome steps) */}
            {step > 0 && (
              <Box mb={2.5}>
                <Divider sx={{ mb: 2.5 }}>
                  <Typography
                    sx={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#9CA3AF',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      px: 1,
                    }}
                  >
                    {{
                      welcome: '',
                      connectAccounts: '🔗 Connect Accounts',
                      basics: '🏢 Brand Basics',
                      identity: '🎨 Visual Identity',
                      personality: '🗣️ Brand Personality',
                      visualStyle: '🎨 Visual Style',
                      fontStyle: '✏️ Typography',
                      platformTone: '🎭 Platform Voice',
                      voiceSample: '✍️ Voice Sample',
                      pillars: '📋 Content Pillars',
                      formats: '🖼️ Content Formats',
                      guardrails: '🚧 Guardrails',
                      cta: '🎯 Call to Action',
                      audience: '👥 Target Audience',
                      competitors: '🔍 Competitors',
                      calendar: '📅 Key Dates',
                      cadence: '🔄 Posting Cadence',
                      postingTimes: '⏰ Posting Times',
                      approvalChannels: '✅ Approval',
                      notifications: '🔔 Notifications',
                      language: '🌍 Language & Region',
                      preview: '👁️ Profile Preview',
                    }[STEPS[step]] || ''}
                  </Typography>
                </Divider>
              </Box>
            )}

            {renderStep()}
          </Box>
        </Box>

        {/* ── Footer ───────────────────────────────────────────── */}
        <Box sx={{ py: 1.5, textAlign: 'center', borderTop: '1px solid #F3F4F6', background: '#fff' }}>
          <Typography sx={{ fontSize: 11.5, color: '#9CA3AF' }}>
            Progress saves when you complete setup · Update your brand profile anytime in Settings
          </Typography>
        </Box>
      </Box>
    </>
  );
}

export default function BrandSetupPage() {
  return (
    <Suspense>
      <BrandSetupPageContent />
    </Suspense>
  );
}
