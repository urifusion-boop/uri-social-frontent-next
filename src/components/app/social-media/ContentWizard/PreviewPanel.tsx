'use client';

import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { BrandProfileService } from '@/src/api/BrandProfileService';
import { ContentWizardState } from './useContentWizardState';

function Icon({
  d,
  color = '#374151',
  size = 18,
  fill = 'none',
}: {
  d: string;
  color?: string;
  size?: number;
  fill?: string;
}) {
  return (
    <Box component="svg" viewBox="0 0 24 24" sx={{ width: size, height: size, flexShrink: 0 }}>
      <path d={d} fill={fill} stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </Box>
  );
}

const HEART =
  'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z';
const COMMENT = 'M21 11.5a8.4 8.4 0 0 1-8.9 8.4 9 9 0 0 1-3.6-.7L3 21l1.8-5.5A8.4 8.4 0 1 1 21 11.5Z';
const SEND = 'M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z';
const BOOKMARK = 'M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z';
const THUMBS_UP =
  'M7 11v10H3V11h4Zm4-2V5a2 2 0 0 1 4 0l-1 4h5a2 2 0 0 1 2 2.2l-1.5 7A2 2 0 0 1 16.5 20H11a2 2 0 0 1-2-2V11l2-2Z';
const RETWEET = 'M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3';
const REPOST = 'M4 6h13l-2.5-2.5M20 18H7l2.5 2.5';

function AvatarCircle({
  logoUrl,
  name,
  size = 28,
  radius = '50%',
}: {
  logoUrl?: string;
  name: string;
  size?: number;
  radius?: string;
}) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: radius,
        flexShrink: 0,
        background: logoUrl ? `url(${logoUrl}) center/cover` : 'linear-gradient(135deg,#CD1B78,#A01560)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {!logoUrl && (
        <Typography fontSize={size * 0.4} fontWeight={700} color="#fff">
          {name.charAt(0).toUpperCase()}
        </Typography>
      )}
    </Box>
  );
}

function MediaBox({
  previewImage,
  previewVideo,
  aspect,
  radius = 0,
  emptyLabel,
}: {
  previewImage?: string;
  previewVideo?: string;
  aspect: string;
  radius?: number;
  emptyLabel: string;
}) {
  return (
    <Box
      sx={{
        width: '100%',
        maxHeight: 240,
        aspectRatio: aspect,
        borderRadius: `${radius}px`,
        overflow: 'hidden',
        background: previewImage ? `url(${previewImage}) center/cover` : previewVideo ? '#111' : '#F3F4F6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {previewVideo && (
        <Box component="video" src={previewVideo} controls sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      )}
      {!previewImage && !previewVideo && (
        <Typography fontSize="12px" color="#9CA3AF" textAlign="center" px={2}>
          {emptyLabel}
        </Typography>
      )}
    </Box>
  );
}

interface PlatformPreviewProps {
  brand: { name: string; logoUrl?: string };
  previewImage?: string;
  previewVideo?: string;
  captionText: string;
  captionPlaceholder: string;
  isStory: boolean;
}

// Instagram: circular avatar + username + ⋯ header, square (or 9:16 story)
// media, icon-only engagement row (heart/comment/send left, bookmark right),
// caption shown as "**name** caption" directly under the media — all real
// Instagram chrome, not just a re-tinted badge.
function InstagramPreview({
  brand,
  previewImage,
  previewVideo,
  captionText,
  captionPlaceholder,
  isStory,
}: PlatformPreviewProps) {
  return (
    <Box sx={{ border: '1px solid #E5E7EB', borderRadius: '16px', overflow: 'hidden', background: '#fff' }}>
      <Box display="flex" alignItems="center" gap={1} sx={{ p: 1.25 }}>
        <AvatarCircle logoUrl={brand.logoUrl} name={brand.name} />
        <Typography fontSize="12.5px" fontWeight={700} color="#111827">
          {brand.name}
        </Typography>
        <Box sx={{ ml: 'auto', display: 'flex', gap: '3px' }}>
          {[0, 1, 2].map((i) => (
            <Box key={i} sx={{ width: 3, height: 3, borderRadius: '50%', background: '#9CA3AF' }} />
          ))}
        </Box>
      </Box>
      <MediaBox
        previewImage={previewImage}
        previewVideo={previewVideo}
        aspect={isStory ? '9 / 16' : '1 / 1'}
        emptyLabel="AI image will appear here"
      />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 1.25, pt: 1.25 }}>
        <Icon d={HEART} />
        <Icon d={COMMENT} />
        <Icon d={SEND} />
        <Box sx={{ ml: 'auto' }}>
          <Icon d={BOOKMARK} />
        </Box>
      </Box>
      <Box sx={{ p: 1.25, pt: 1 }}>
        <Typography
          fontSize="12.5px"
          color="#374151"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            whiteSpace: 'pre-wrap',
          }}
        >
          <Box component="span" fontWeight={700} color="#111827" mr={0.75}>
            {brand.name}
          </Box>
          {captionText.trim() || captionPlaceholder}
        </Typography>
      </Box>
    </Box>
  );
}

// Facebook: square avatar + name + "Just now · 🌐" header, caption shown
// ABOVE the media (Facebook's real post order), then a labeled Like/Comment/
// Share bar below a divider — not Instagram's icon-only row.
function FacebookPreview({ brand, previewImage, previewVideo, captionText, captionPlaceholder }: PlatformPreviewProps) {
  return (
    <Box sx={{ border: '1px solid #E5E7EB', borderRadius: '16px', overflow: 'hidden', background: '#fff' }}>
      <Box display="flex" alignItems="center" gap={1} sx={{ p: 1.25 }}>
        <AvatarCircle logoUrl={brand.logoUrl} name={brand.name} radius="8px" />
        <Box sx={{ minWidth: 0 }}>
          <Typography fontSize="12.5px" fontWeight={700} color="#111827" noWrap>
            {brand.name}
          </Typography>
          <Typography fontSize="10.5px" color="#9CA3AF">
            Just now · 🌐
          </Typography>
        </Box>
        <Box sx={{ ml: 'auto', display: 'flex', gap: '3px' }}>
          {[0, 1, 2].map((i) => (
            <Box key={i} sx={{ width: 3, height: 3, borderRadius: '50%', background: '#9CA3AF' }} />
          ))}
        </Box>
      </Box>
      <Box sx={{ px: 1.25, pb: 1.25 }}>
        <Typography
          fontSize="12.5px"
          color="#374151"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            whiteSpace: 'pre-wrap',
          }}
        >
          {captionText.trim() || captionPlaceholder}
        </Typography>
      </Box>
      <MediaBox
        previewImage={previewImage}
        previewVideo={previewVideo}
        aspect="1.91 / 1"
        emptyLabel="AI image will appear here"
      />
      <Box sx={{ display: 'flex', borderTop: '1px solid #F3F4F6', mt: 0.5 }}>
        {[
          { d: THUMBS_UP, label: 'Like' },
          { d: COMMENT, label: 'Comment' },
          { d: SEND, label: 'Share' },
        ].map((a) => (
          <Box
            key={a.label}
            sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, py: 0.9 }}
          >
            <Icon d={a.d} size={15} color="#6B7280" />
            <Typography fontSize="11px" fontWeight={600} color="#6B7280">
              {a.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// LinkedIn: square avatar + name + small gray headline/timestamp lines,
// caption above a wider (1.91:1-ish, LinkedIn crops closer to 1.91:1 too but
// rendered a touch taller to read as "LinkedIn" not "Facebook") image, then
// a labeled Like/Comment/Repost/Send bar — LinkedIn's real four actions,
// not Facebook's three.
function LinkedInPreview({ brand, previewImage, previewVideo, captionText, captionPlaceholder }: PlatformPreviewProps) {
  return (
    <Box sx={{ border: '1px solid #E5E7EB', borderRadius: '16px', overflow: 'hidden', background: '#fff' }}>
      <Box display="flex" alignItems="flex-start" gap={1} sx={{ p: 1.25 }}>
        <AvatarCircle logoUrl={brand.logoUrl} name={brand.name} radius="6px" />
        <Box sx={{ minWidth: 0 }}>
          <Typography fontSize="12.5px" fontWeight={700} color="#111827" noWrap>
            {brand.name}
          </Typography>
          <Typography fontSize="10.5px" color="#9CA3AF" noWrap>
            Company · 1,204 followers
          </Typography>
          <Typography fontSize="10.5px" color="#9CA3AF">
            2m
          </Typography>
        </Box>
      </Box>
      <Box sx={{ px: 1.25, pb: 1.25 }}>
        <Typography
          fontSize="12.5px"
          color="#374151"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            whiteSpace: 'pre-wrap',
          }}
        >
          {captionText.trim() || captionPlaceholder}
        </Typography>
      </Box>
      <MediaBox
        previewImage={previewImage}
        previewVideo={previewVideo}
        aspect="1.5 / 1"
        emptyLabel="AI image will appear here"
      />
      <Box sx={{ display: 'flex', borderTop: '1px solid #F3F4F6', mt: 0.5 }}>
        {[
          { d: THUMBS_UP, label: 'Like' },
          { d: COMMENT, label: 'Comment' },
          { d: REPOST, label: 'Repost' },
          { d: SEND, label: 'Send' },
        ].map((a) => (
          <Box
            key={a.label}
            sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.4, py: 0.9 }}
          >
            <Icon d={a.d} size={14} color="#6B7280" />
            <Typography fontSize="10.5px" fontWeight={600} color="#6B7280">
              {a.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// X/Twitter: avatar + name + @handle + timestamp inline, caption directly
// under the header (X shows text before/above media, not after), rounded
// wide image, then the real reply/retweet/like/share four-icon row with no
// labels — X's actual layout, not a repaint of the Instagram card.
function TwitterPreview({ brand, previewImage, previewVideo, captionText, captionPlaceholder }: PlatformPreviewProps) {
  const handle = '@' + brand.name.toLowerCase().replace(/\s+/g, '');
  return (
    <Box sx={{ border: '1px solid #E5E7EB', borderRadius: '16px', overflow: 'hidden', background: '#fff', p: 1.25 }}>
      <Box display="flex" alignItems="center" gap={1} mb={0.75}>
        <AvatarCircle logoUrl={brand.logoUrl} name={brand.name} />
        <Box display="flex" alignItems="baseline" gap={0.5} sx={{ minWidth: 0 }}>
          <Typography fontSize="12.5px" fontWeight={700} color="#111827" noWrap>
            {brand.name}
          </Typography>
          <Typography fontSize="11.5px" color="#9CA3AF" noWrap>
            {handle} · 2m
          </Typography>
        </Box>
      </Box>
      <Typography
        fontSize="13px"
        color="#0F1419"
        mb={1}
        sx={{
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          whiteSpace: 'pre-wrap',
        }}
      >
        {captionText.trim() || captionPlaceholder}
      </Typography>
      <MediaBox
        previewImage={previewImage}
        previewVideo={previewVideo}
        aspect="16 / 9"
        radius={14}
        emptyLabel="AI image will appear here"
      />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, pt: 1.25 }}>
        <Icon d={COMMENT} size={16} color="#536471" />
        <Icon d={RETWEET} size={16} color="#536471" />
        <Icon d={HEART} size={16} color="#536471" />
        <Icon d={SEND} size={15} color="#536471" />
      </Box>
    </Box>
  );
}

// TikTok: the one platform that isn't a "card" at all — full-bleed 9:16
// video/image with the caption + hashtags overlaid bottom-left and a
// vertical icon stack (profile, heart, comment, bookmark, share) pinned to
// the bottom-right, same as scrolling the real app. Reusing the card layout
// here was the exact complaint; this is a deliberately different shape.
function TikTokPreview({ brand, previewImage, previewVideo, captionText, captionPlaceholder }: PlatformPreviewProps) {
  const caption = captionText.trim() || captionPlaceholder;
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: 220,
        mx: 'auto',
        aspectRatio: '9 / 16',
        borderRadius: '16px',
        overflow: 'hidden',
        background: previewImage ? `url(${previewImage}) center/cover` : previewVideo ? '#111' : '#F3F4F6',
      }}
    >
      {previewVideo && (
        <Box
          component="video"
          src={previewVideo}
          controls
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
      {!previewImage && !previewVideo && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: 2,
          }}
        >
          <Typography fontSize="12px" color="#9CA3AF" textAlign="center">
            AI image will appear here
          </Typography>
        </Box>
      )}
      {/* Darkening gradient so white overlay text/icons stay legible over any media */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,.55) 100%)',
          pointerEvents: 'none',
        }}
      />
      <Box sx={{ position: 'absolute', left: 10, right: 54, bottom: 10 }}>
        <Typography fontSize="12px" fontWeight={700} color="#fff" mb={0.4}>
          @{brand.name.toLowerCase().replace(/\s+/g, '')}
        </Typography>
        <Typography
          fontSize="11px"
          color="#fff"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            whiteSpace: 'pre-wrap',
          }}
        >
          {caption}
        </Typography>
      </Box>
      <Box
        sx={{
          position: 'absolute',
          right: 8,
          bottom: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <AvatarCircle logoUrl={brand.logoUrl} name={brand.name} size={30} />
        {[HEART, COMMENT, SEND].map((d, i) => (
          <Icon key={i} d={d} size={22} color="#fff" fill={d === HEART ? 'rgba(255,255,255,.95)' : 'none'} />
        ))}
      </Box>
    </Box>
  );
}

const PLATFORM_PREVIEWS: Record<string, (p: PlatformPreviewProps) => React.ReactElement> = {
  instagram: InstagramPreview,
  facebook: FacebookPreview,
  linkedin: LinkedInPreview,
  twitter: TwitterPreview,
  tiktok: TikTokPreview,
};

// A single, honest-effort live preview per platform — not pixel-exact
// mockups, but genuinely different chrome per platform (header shape, where
// the caption sits relative to the media, which icons show and whether
// they're labeled) rather than one Instagram-shaped card with a swapped
// badge color for every platform. Falls back to the old generic card only
// when no platform is selected yet (nothing to differentiate between).
export default function PreviewPanel({ wizard }: { wizard: ContentWizardState }) {
  const [brand, setBrand] = useState<{ name: string; logoUrl?: string }>({ name: 'yourbrand' });

  useEffect(() => {
    BrandProfileService.get()
      .then((res) => {
        const data = res.responseData;
        if (data) setBrand({ name: data.brand_name || 'yourbrand', logoUrl: data.logo_url });
      })
      .catch(() => {});
  }, []);

  const primaryPlatform = wizard.selectedPlatforms[0];
  const isUpload = wizard.contentSource === 'upload';
  const previewImage = isUpload
    ? (!wizard.hasUploadedVideo && wizard.uploadedFiles[0]?.preview) || undefined
    : (wizard.referenceImages.find((img) => img.included)?.dataUrl ?? wizard.referenceImages[0]?.dataUrl);
  const previewVideo = isUpload && wizard.hasUploadedVideo ? wizard.uploadedFiles[0]?.preview : undefined;
  const captionText = isUpload ? wizard.uploadContextText : wizard.seedContent;
  const captionPlaceholder = isUpload
    ? 'AI will write a caption for your upload — add context above for a better one.'
    : 'Your brief will appear here as you type…';
  const isStory = wizard.postType === 'story';

  const PlatformPreview = primaryPlatform ? PLATFORM_PREVIEWS[primaryPlatform] : undefined;

  return (
    <Box>
      <Typography fontSize="12.5px" fontWeight={700} color="#111827" mb={1}>
        Preview
      </Typography>

      {PlatformPreview ? (
        <PlatformPreview
          brand={brand}
          previewImage={previewImage}
          previewVideo={previewVideo}
          captionText={captionText}
          captionPlaceholder={captionPlaceholder}
          isStory={isStory}
        />
      ) : (
        // No platform chosen yet — a platform-neutral placeholder, not a
        // guess at which platform's chrome to show.
        <Box
          sx={{
            border: '1px solid #E5E7EB',
            borderRadius: '16px',
            overflow: 'hidden',
            background: '#fff',
            boxShadow: '0 1px 3px rgba(20,16,14,.08)',
          }}
        >
          <Box display="flex" alignItems="center" gap={1} sx={{ p: 1.25 }}>
            <AvatarCircle logoUrl={brand.logoUrl} name={brand.name} />
            <Typography fontSize="12.5px" fontWeight={700} color="#111827">
              {brand.name}
            </Typography>
          </Box>
          <MediaBox
            previewImage={previewImage}
            previewVideo={previewVideo}
            aspect={isStory ? '9 / 16' : '1 / 1'}
            emptyLabel={
              isUpload
                ? 'Your upload will appear here'
                : wizard.includeImages
                  ? 'AI image will appear here'
                  : 'No image for this post'
            }
          />
          <Box sx={{ p: 1.25 }}>
            <Typography
              fontSize="12.5px"
              color="#374151"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                whiteSpace: 'pre-wrap',
              }}
            >
              {captionText.trim() || captionPlaceholder}
            </Typography>
            <Typography fontSize="11px" color="#9CA3AF" mt={1}>
              Choose a platform to preview how this will actually look.
            </Typography>
          </Box>
        </Box>
      )}

      {wizard.selectedPlatforms.length > 1 && (
        <Typography fontSize="11px" color="#9CA3AF" mt={1}>
          Also posting to: {wizard.selectedPlatforms.slice(1).join(', ')}
        </Typography>
      )}
    </Box>
  );
}
