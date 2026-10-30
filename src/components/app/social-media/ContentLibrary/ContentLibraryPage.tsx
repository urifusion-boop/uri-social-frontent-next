'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { FaFacebook, FaInstagram, FaLinkedin, FaTiktok, FaTwitter } from 'react-icons/fa';
import { MdChevronLeft, MdChevronRight, MdClose, MdMoreVert, MdSearch } from 'react-icons/md';
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
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

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
              onClick={() => setView(v)}
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
          sx={{ fontSize: '13px', minWidth: 120, height: 40 }}
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
          sx={{ fontSize: '13px', minWidth: 120, height: 40 }}
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
          sx={{ fontSize: '13px', minWidth: 120, height: 40 }}
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
          sx={{ fontSize: '13px', minWidth: 140, height: 40 }}
        >
          <MenuItem value="all">Date range</MenuItem>
          <MenuItem value="7">Last 7 days</MenuItem>
          <MenuItem value="30">Last 30 days</MenuItem>
          <MenuItem value="90">Last 90 days</MenuItem>
        </Select>
        <TextField
          placeholder="Search content..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{ input: { startAdornment: <MdSearch size={16} color="#9CA3AF" style={{ marginRight: 8 }} /> } }}
          sx={{
            flex: 1,
            minWidth: 220,
            '& .MuiOutlinedInput-root': { height: 40, borderRadius: '8px' },
            '& .MuiInputBase-input': { fontSize: '13px', py: '9.5px' },
          }}
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
      ) : view === 'grid' ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 2 }}>
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
                onClick={() => setEditingDraft(d)}
                sx={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: '#fff',
                  cursor: 'pointer',
                  transition: 'box-shadow .15s',
                  '&:hover': { boxShadow: '0 4px 14px rgba(20,16,14,.08)' },
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    background: d.image_url ? `url(${d.image_url}) center/cover` : '#F3F4F6',
                  }}
                />
                <Box sx={{ p: 1.25 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      {pIcon?.icon}
                      <Typography fontSize="11px" color="#6B7280" sx={{ textTransform: 'capitalize' }}>
                        {FORMAT_LABEL[formatKey] ?? formatKey}
                      </Typography>
                    </Box>
                    <Box
                      component="span"
                      sx={{
                        background: badge.bg,
                        color: badge.color,
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: 700,
                        px: 0.75,
                        py: 0.3,
                      }}
                    >
                      {badge.label}
                    </Box>
                  </Box>
                  <Typography fontSize="12.5px" fontWeight={600} color="#111827" noWrap>
                    {title}
                  </Typography>
                  <Typography fontSize="11px" color="#9CA3AF" noWrap>
                    {excerpt}
                  </Typography>
                  <Typography fontSize="10.5px" color="#9CA3AF" mt={0.5}>
                    {dt
                      ? new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      ) : view === 'calendar' ? (
        <CalendarView
          items={filtered}
          month={calendarMonth}
          onMonthChange={setCalendarMonth}
          onSelect={setEditingDraft}
        />
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
                  aria-label="More actions"
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

      {/* Edit/Approve/Deny all open the real editor below — Approve and Deny
          are DraftCard's own buttons there (with the connected-account and
          TikTok-consent gating that real publishing needs), not reimplemented
          here, so nothing about those flows can drift out of sync. */}
      <Menu anchorEl={menuFor?.anchor} open={!!menuFor} onClose={() => setMenuFor(null)}>
        {['Edit', 'Approve', 'Deny'].map((label) => (
          <MenuItem
            key={label}
            onClick={() => {
              const d = items.find((x) => (x.id ?? x.draft_id) === menuFor?.id);
              setMenuFor(null);
              if (d) setEditingDraft(d);
            }}
          >
            {label}
          </MenuItem>
        ))}
        <MenuItem onClick={() => menuFor && handleDelete(menuFor.id)} sx={{ color: '#DC2626' }}>
          Delete
        </MenuItem>
      </Menu>

      <Dialog open={!!editingDraft} onClose={() => setEditingDraft(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Typography fontSize="15px" fontWeight={700}>
            Edit post
          </Typography>
          <IconButton size="small" onClick={() => setEditingDraft(null)}>
            <MdClose size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2, pt: 0 }}>
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

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function CalendarView({
  items,
  month,
  onMonthChange,
  onSelect,
}: {
  items: ContentDraft[];
  month: Date;
  onMonthChange: (d: Date) => void;
  onSelect: (d: ContentDraft) => void;
}) {
  const byDay = useMemo(() => {
    const map = new Map<string, ContentDraft[]>();
    for (const d of items) {
      const dt = dateFor(d);
      if (!dt) continue;
      const key = new Date(dt).toDateString();
      const arr = map.get(key) ?? [];
      arr.push(d);
      map.set(key, arr);
    }
    return map;
  }, [items]);

  const year = month.getFullYear();
  const mon = month.getMonth();
  const firstOfMonth = new Date(year, mon, 1);
  const startOffset = firstOfMonth.getDay();
  const daysInMonth = new Date(year, mon + 1, 0).getDate();
  const today = new Date().toDateString();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, mon, day));
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <Box sx={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2, py: 1.5, borderBottom: '1px solid #E5E7EB' }}
      >
        <Typography fontSize="14px" fontWeight={700} color="#111827">
          {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Typography>
        <Box display="flex" gap={0.5}>
          <IconButton size="small" onClick={() => onMonthChange(new Date(year, mon - 1, 1))}>
            <MdChevronLeft size={18} />
          </IconButton>
          <IconButton size="small" onClick={() => onMonthChange(new Date(year, mon + 1, 1))}>
            <MdChevronRight size={18} />
          </IconButton>
        </Box>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {WEEKDAYS.map((w) => (
          <Box
            key={w}
            sx={{
              px: 1,
              py: 0.75,
              fontSize: '11px',
              fontWeight: 700,
              color: '#9CA3AF',
              borderBottom: '1px solid #E5E7EB',
            }}
          >
            {w}
          </Box>
        ))}
        {cells.map((date, i) => {
          const dayItems = date ? (byDay.get(date.toDateString()) ?? []) : [];
          const isToday = date?.toDateString() === today;
          return (
            <Box
              key={i}
              sx={{
                minHeight: 92,
                borderBottom: '1px solid #F3F4F6',
                borderRight: (i + 1) % 7 === 0 ? 'none' : '1px solid #F3F4F6',
                p: 0.75,
                background: date ? '#fff' : '#FAFAFA',
              }}
            >
              {date && (
                <>
                  <Typography
                    fontSize="11px"
                    fontWeight={isToday ? 800 : 500}
                    color={isToday ? PINK : '#6B7280'}
                    mb={0.5}
                  >
                    {date.getDate()}
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={0.25}>
                    {dayItems.slice(0, 3).map((d) => {
                      const cat = categorize(d);
                      const badge = STATUS_BADGE[cat];
                      const { title } = titleAndExcerpt(d.content || '');
                      return (
                        <Box
                          key={d.id ?? d.draft_id}
                          onClick={() => onSelect(d)}
                          sx={{
                            fontSize: '10px',
                            fontWeight: 600,
                            color: badge.color,
                            background: badge.bg,
                            borderRadius: '4px',
                            px: 0.5,
                            py: 0.2,
                            cursor: 'pointer',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {title}
                        </Box>
                      );
                    })}
                    {dayItems.length > 3 && (
                      <Typography fontSize="9.5px" color="#9CA3AF">
                        +{dayItems.length - 3} more
                      </Typography>
                    )}
                  </Box>
                </>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
