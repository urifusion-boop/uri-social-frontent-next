'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Checkbox,
  Dialog,
  DialogContent,
  IconButton,
  Menu,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { FaFacebook, FaInstagram, FaLinkedin, FaTiktok, FaTwitter } from 'react-icons/fa';
import { MdMoreVert, MdSearch } from 'react-icons/md';
import { ContentDraft, SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import DraftCard from '../DraftCard';

const PINK = '#CD1B78';

type LibraryTab = 'all' | 'draft' | 'needs_review' | 'scheduled' | 'published' | 'archived';

const TABS: { key: LibraryTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Drafts' },
  { key: 'needs_review', label: 'Needs Review' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'published', label: 'Published' },
  { key: 'archived', label: 'Archived' },
];

const PLATFORM_ICON: Record<string, { icon: React.ReactNode; color: string }> = {
  facebook: { icon: <FaFacebook size={13} color="#1877F2" />, color: '#1877F2' },
  instagram: { icon: <FaInstagram size={13} color="#E1306C" />, color: '#E1306C' },
  instagram_reels: { icon: <FaInstagram size={13} color="#E1306C" />, color: '#E1306C' },
  twitter: { icon: <FaTwitter size={13} color="#1DA1F2" />, color: '#1DA1F2' },
  linkedin: { icon: <FaLinkedin size={13} color="#0A66C2" />, color: '#0A66C2' },
  tiktok: { icon: <FaTiktok size={13} color="#010101" />, color: '#010101' },
};

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  draft: { bg: '#F3F4F6', color: '#374151', label: 'Draft' },
  needs_review: { bg: '#FEF3C7', color: '#92400E', label: 'Needs Review' },
  scheduled: { bg: '#DBEAFE', color: '#1E40AF', label: 'Scheduled' },
  published: { bg: '#D1FAE5', color: '#065F46', label: 'Published' },
  archived: { bg: '#FEE2E2', color: '#991B1B', label: 'Archived' },
};

const FORMAT_LABEL: Record<string, string> = {
  feed: 'Feed Post',
  carousel: 'Carousel',
  story: 'Story',
  reel: 'Reel',
};

// Buckets a real draft into one of this page's 6 real categories. Several
// drafts in production carry `approval_status` but no `status` (confirmed
// live) — mirrors DraftCard's own `status ?? approval_status` fallback.
function categorize(d: ContentDraft): LibraryTab {
  const s = d.status ?? (d.approval_status === 'pending' ? 'pending_approval' : d.approval_status);
  switch (s) {
    case 'published':
      return 'published';
    case 'scheduled':
    case 'confirming':
    case 'ready_to_publish':
      return 'scheduled';
    case 'pending_approval':
      return 'needs_review';
    case 'denied':
    case 'replaced':
    case 'publish_failed':
      return 'archived';
    default:
      return 'draft';
  }
}

function dateFor(d: ContentDraft): string | null {
  return d.scheduled_datetime ?? d.created_at ?? null;
}

function titleAndExcerpt(content: string): { title: string; excerpt: string } {
  const trimmed = content.trim();
  const firstLine = trimmed.split('\n')[0] ?? '';
  const title = firstLine.length > 60 ? firstLine.slice(0, 57) + '…' : firstLine || 'Untitled post';
  const rest = trimmed.slice(firstLine.length).trim();
  const excerpt = (rest || trimmed).slice(0, 80);
  return { title, excerpt: excerpt + (excerpt.length >= 80 ? '…' : '') };
}

export default function ContentLibraryPage() {
  const [items, setItems] = useState<ContentDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<LibraryTab>('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [formatFilter, setFormatFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<'all' | '7' | '30' | '90'>('all');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'list' | 'calendar' | 'grid'>('list');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [menuFor, setMenuFor] = useState<{ anchor: HTMLElement; id: string } | null>(null);
  const [editingDraft, setEditingDraft] = useState<ContentDraft | null>(null);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const [calendarRes, scheduledRes] = await Promise.all([
        SocialMediaAgentService.getContentCalendar(),
        SocialMediaAgentService.getScheduled(),
      ]);
      const fromCalendar = calendarRes.responseData?.drafts ?? [];
      const fromScheduled = scheduledRes.responseData?.scheduled_drafts ?? [];
      const byId = new Map<string, ContentDraft>();
      for (const d of [...fromCalendar, ...fromScheduled]) {
        const id = d.id ?? d.draft_id;
        if (id) byId.set(id, d);
      }
      setItems(Array.from(byId.values()));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => {
    const c: Record<LibraryTab, number> = {
      all: items.length,
      draft: 0,
      needs_review: 0,
      scheduled: 0,
      published: 0,
      archived: 0,
    };
    for (const d of items) c[categorize(d)]++;
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const windowMs = dateFilter === 'all' ? null : Number(dateFilter) * 24 * 60 * 60 * 1000;
    return items.filter((d) => {
      if (tab !== 'all' && categorize(d) !== tab) return false;
      if (platformFilter !== 'all' && (d.platform || '').toLowerCase() !== platformFilter) return false;
      if (formatFilter !== 'all' && (d.post_type || 'feed') !== formatFilter) return false;
      if (windowMs !== null) {
        const dt = dateFor(d);
        if (!dt || now - new Date(dt).getTime() > windowMs) return false;
      }
      if (search.trim() && !d.content?.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [items, tab, platformFilter, formatFilter, dateFilter, search]);

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    setMenuFor(null);
    try {
      await SocialMediaAgentService.deleteDraft(id);
      ToastService.showToast('Deleted.', ToastTypeEnum.Success);
      load();
    } catch {
      ToastService.showToast('Could not delete — try again.', ToastTypeEnum.Error);
    }
  };

  return (
    <Box>
      <Box display="flex" gap={0.5} sx={{ borderBottom: '1px solid #E5E7EB', mb: 2 }}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <Box
              key={t.key}
              component="button"
              onClick={() => setTab(t.key)}
              sx={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                px: 1.5,
                py: 1,
                fontSize: '13px',
                fontWeight: active ? 700 : 500,
                fontFamily: 'inherit',
                color: active ? PINK : '#6B7280',
                borderBottom: active ? `2px solid ${PINK}` : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                whiteSpace: 'nowrap',
              }}
            >
              {t.label}
              {counts[t.key] > 0 && (
                <Box
                  component="span"
                  sx={{
                    background: active ? PINK : '#E5E7EB',
                    color: active ? '#fff' : '#6B7280',
                    borderRadius: '10px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    px: 0.75,
                    lineHeight: '16px',
                  }}
                >
                  {counts[t.key]}
                </Box>
              )}
            </Box>
          );
        })}
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5, pb: 1 }}>
          {(['list', 'calendar', 'grid'] as const).map((v) => (
            <Box
              key={v}
              component="button"
              onClick={() => {
                if (v === 'list') setView(v);
                else
                  ToastService.showToast(
                    `${v === 'calendar' ? 'Calendar' : 'Grid'} view isn't built yet — use List for now.`,
                    ToastTypeEnum.Warning
                  );
              }}
              sx={{
                border: '1px solid',
                borderColor: view === v ? PINK : '#E5E7EB',
                background: view === v ? '#FDF2F8' : '#fff',
                color: view === v ? PINK : '#6B7280',
                borderRadius: '8px',
                px: 1.25,
                py: 0.5,
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
                fontFamily: 'inherit',
              }}
            >
              {v}
            </Box>
          ))}
        </Box>
      </Box>

      <Box display="flex" gap={1} flexWrap="wrap" mb={2} alignItems="center">
        <Select
          size="small"
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          sx={{ fontSize: '12.5px', minWidth: 110 }}
        >
          <MenuItem value="all">Platform</MenuItem>
          <MenuItem value="facebook">Facebook</MenuItem>
          <MenuItem value="instagram">Instagram</MenuItem>
          <MenuItem value="twitter">Twitter / X</MenuItem>
          <MenuItem value="linkedin">LinkedIn</MenuItem>
          <MenuItem value="tiktok">TikTok</MenuItem>
        </Select>
        <Select
          size="small"
          value={formatFilter}
          onChange={(e) => setFormatFilter(e.target.value)}
          sx={{ fontSize: '12.5px', minWidth: 110 }}
        >
          <MenuItem value="all">Format</MenuItem>
          <MenuItem value="feed">Feed Post</MenuItem>
          <MenuItem value="carousel">Carousel</MenuItem>
          <MenuItem value="story">Story</MenuItem>
          <MenuItem value="reel">Reel</MenuItem>
        </Select>
        <Select
          size="small"
          value={tab}
          onChange={(e) => setTab(e.target.value as LibraryTab)}
          sx={{ fontSize: '12.5px', minWidth: 110 }}
        >
          {TABS.map((t) => (
            <MenuItem key={t.key} value={t.key}>
              {t.key === 'all' ? 'Status' : t.label}
            </MenuItem>
          ))}
        </Select>
        <Select
          size="small"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
          sx={{ fontSize: '12.5px', minWidth: 130 }}
        >
          <MenuItem value="all">Date range</MenuItem>
          <MenuItem value="7">Last 7 days</MenuItem>
          <MenuItem value="30">Last 30 days</MenuItem>
          <MenuItem value="90">Last 90 days</MenuItem>
        </Select>
        <TextField
          size="small"
          placeholder="Search content..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{ input: { startAdornment: <MdSearch size={15} color="#9CA3AF" style={{ marginRight: 6 }} /> } }}
          sx={{ flex: 1, minWidth: 180, '& .MuiInputBase-input': { fontSize: '12.5px' } }}
        />
      </Box>

      {loading ? (
        <Box sx={{ py: 6, textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>Loading…</Box>
      ) : error ? (
        <Box sx={{ py: 6, textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
          Could not load content.{' '}
          <Box
            component="button"
            onClick={load}
            sx={{ border: 'none', background: 'none', color: PINK, fontWeight: 600, cursor: 'pointer' }}
          >
            Retry
          </Box>
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
          {tab === 'published'
            ? "Published-post tracking isn't surfaced in this view yet."
            : tab === 'archived'
              ? 'No archived content.'
              : 'Nothing here yet.'}
        </Box>
      ) : (
        <Box sx={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '28px 1fr 110px 110px 120px 130px 40px',
              gap: 1,
              alignItems: 'center',
              px: 1.5,
              py: 1,
              borderBottom: '1px solid #E5E7EB',
              background: '#FAFAFA',
              fontSize: '11.5px',
              fontWeight: 700,
              color: '#6B7280',
            }}
          >
            <Checkbox size="small" disabled sx={{ p: 0 }} />
            <span>Content</span>
            <span>Platform</span>
            <span>Format</span>
            <span>Status</span>
            <span>Date</span>
            <span />
          </Box>
          {filtered.map((d) => {
            const id = d.id ?? d.draft_id ?? '';
            const cat = categorize(d);
            const badge = STATUS_BADGE[cat];
            const { title, excerpt } = titleAndExcerpt(d.content || '');
            const platformKey = (d.platform || '').toLowerCase();
            const pIcon = PLATFORM_ICON[platformKey];
            const formatKey = d.post_type || 'feed';
            const dt = dateFor(d);

            return (
              <Box
                key={id}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '28px 1fr 110px 110px 120px 130px 40px',
                  gap: 1,
                  alignItems: 'center',
                  px: 1.5,
                  py: 1.25,
                  borderBottom: '1px solid #F3F4F6',
                  '&:hover': { background: '#FAFAFA' },
                  cursor: 'pointer',
                }}
                onClick={() => setEditingDraft(d)}
              >
                <Checkbox
                  size="small"
                  checked={selected.has(id)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => toggleSelected(id)}
                  sx={{ p: 0, '&.Mui-checked': { color: PINK } }}
                />
                <Box display="flex" alignItems="center" gap={1} sx={{ minWidth: 0 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '8px',
                      flexShrink: 0,
                      background: d.image_url ? `url(${d.image_url}) center/cover` : '#F3F4F6',
                    }}
                  />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontSize="13px" fontWeight={600} color="#111827" noWrap>
                      {title}
                    </Typography>
                    <Typography fontSize="11.5px" color="#9CA3AF" noWrap>
                      {excerpt}
                    </Typography>
                  </Box>
                </Box>
                <Box display="flex" alignItems="center" gap={0.75}>
                  {pIcon?.icon}
                  <Typography fontSize="12px" color="#374151" sx={{ textTransform: 'capitalize' }}>
                    {platformKey || '—'}
                  </Typography>
                </Box>
                <Typography fontSize="12px" color="#374151">
                  {FORMAT_LABEL[formatKey] ?? formatKey}
                </Typography>
                <Box>
                  <Box
                    component="span"
                    sx={{
                      background: badge.bg,
                      color: badge.color,
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      px: 1,
                      py: 0.4,
                    }}
                  >
                    {badge.label}
                  </Box>
                </Box>
                <Typography fontSize="12px" color="#6B7280">
                  {dt
                    ? new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '—'}
                </Typography>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuFor({ anchor: e.currentTarget, id });
                  }}
                >
                  <MdMoreVert size={16} />
                </IconButton>
              </Box>
            );
          })}
        </Box>
      )}

      <Menu anchorEl={menuFor?.anchor} open={!!menuFor} onClose={() => setMenuFor(null)}>
        <MenuItem
          onClick={() => {
            const d = items.find((x) => (x.id ?? x.draft_id) === menuFor?.id);
            setMenuFor(null);
            if (d) setEditingDraft(d);
          }}
        >
          Edit
        </MenuItem>
        <MenuItem onClick={() => menuFor && handleDelete(menuFor.id)} sx={{ color: '#DC2626' }}>
          Delete
        </MenuItem>
      </Menu>

      <Dialog open={!!editingDraft} onClose={() => setEditingDraft(null)} maxWidth="sm" fullWidth>
        <DialogContent sx={{ p: 2 }}>
          {editingDraft && (
            <DraftCard
              draft={editingDraft}
              onRefresh={() => {
                load();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
