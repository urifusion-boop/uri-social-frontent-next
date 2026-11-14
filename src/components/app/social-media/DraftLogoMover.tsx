'use client';
/**
 * "Move Logo" for a draft, from anywhere it's listed — Content Library's list rows,
 * grid cards and the read-only detail view — so someone can reposition the logo before
 * publishing without first going through Edit. Same modal and same save call as the
 * editor's own Move Logo (GeneratedDraftEditor / DraftCard); this only wraps them so
 * the three entry points share one implementation.
 *
 * Only available for a post generated with a saved logo-free background (it carries a
 * logo_placement) — exactly the same gate the editor uses.
 */
import LogoRepositionModal from './LogoRepositionModal';
import { ContentDraft, LogoPlacement, SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';

type SlideLike = { logo_placement?: LogoPlacement | null; background_image_url?: string | null; image_url?: string };

const resolveMediaUrl = (url: string) => {
  if (!url.startsWith('/')) return url;
  const base = process.env.NEXT_PUBLIC_URI_API_BASE_URL || process.env.NEXT_PUBLIC_URI_API_BASE_URL_DEV || '';
  return `${base}${url}`;
};

/** The slide (for a carousel) or the post whose logo can be moved, or null when it
 *  can't. For a carousel with no slide given, the first slide that supports it. */
export function logoMoveTarget(
  draft: ContentDraft,
  slideIndex?: number
): { slideIndex?: number; placement: LogoPlacement; background: string } | null {
  if (draft.post_type === 'carousel') {
    const slides = (draft.slides || []) as SlideLike[];
    const indexes = slideIndex !== undefined ? [slideIndex] : slides.map((_, i) => i);
    for (const i of indexes) {
      const s = slides[i];
      if (s?.logo_placement && s.background_image_url) {
        return { slideIndex: i, placement: s.logo_placement, background: s.background_image_url };
      }
    }
    return null;
  }
  const d = draft as ContentDraft & SlideLike;
  if (d.logo_placement && d.background_image_url) {
    return { placement: d.logo_placement, background: d.background_image_url };
  }
  return null;
}

export default function DraftLogoMover({
  draft,
  slideIndex,
  open,
  onClose,
  onSaved,
}: {
  draft: ContentDraft;
  /** Carousel slide to move; omitted = the first slide that supports it. */
  slideIndex?: number;
  open: boolean;
  onClose: () => void;
  /** The draft with the new image + placement applied, so the caller can show it at once. */
  onSaved: (updated: ContentDraft) => void;
}) {
  const target = logoMoveTarget(draft, slideIndex);
  if (!target) return null;
  return (
    <LogoRepositionModal
      open={open}
      onClose={onClose}
      imageUrl={resolveMediaUrl(target.background)}
      initialPlacement={target.placement}
      onSave={async (placement) => {
        const id = draft.id || draft.draft_id || '';
        const response = await SocialMediaAgentService.repositionDraftLogo(id, placement, target.slideIndex);
        if (!response.status || !response.responseData) {
          throw new Error(response.responseMessage || 'Could not save the new logo position.');
        }
        const { image_url: newImageUrl, logo_placement: newPlacement } = response.responseData;
        let updated: ContentDraft;
        if (target.slideIndex !== undefined) {
          const slides = [...(draft.slides || [])];
          slides[target.slideIndex] = {
            ...slides[target.slideIndex],
            image_url: newImageUrl,
            logo_placement: newPlacement,
          };
          updated = { ...draft, slides };
        } else {
          updated = { ...draft, image_url: newImageUrl, logo_placement: newPlacement } as ContentDraft;
        }
        ToastService.showToast('✅ Logo position updated!', ToastTypeEnum.Success);
        onSaved(updated);
      }}
    />
  );
}
