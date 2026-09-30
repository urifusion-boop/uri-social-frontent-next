import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Box, Button, Typography, CircularProgress } from '@mui/material';
import { MdClose } from 'react-icons/md';
import { LogoPlacement } from '../../../api/SocialMediaAgentService';
import { BrandProfileService } from '../../../api/BrandProfileService';

interface LogoRepositionModalProps {
  open: boolean;
  onClose: () => void;
  /** Already resolveUrl()'d — the CURRENT composited image, shown as the
   * backdrop so what's being dragged is visibly the real logo, not a
   * placeholder. */
  imageUrl: string;
  /** In ORIGINAL image pixels, not on-screen display pixels — this is what
   * the backend stored and what gets sent back, unchanged in meaning. */
  initialPlacement: LogoPlacement;
  onSave: (placement: LogoPlacement) => Promise<void>;
}

const MAX_DISPLAY_WIDTH = 480;
const MIN_BOX_SIZE = 24; // on-screen px — a resize can't shrink the logo to nothing

/**
 * A purpose-built drag/resize box for ONE thing — the logo's position and
 * size on an already-generated image — deliberately not the general-purpose
 * Canvas Editor (see LogoRepositionService on the backend for why: that
 * system is off by default and its logo layer doesn't actually work today).
 * Plain mouse events, no drag/resize library — the interaction is simple
 * enough (one box, one corner handle) that a dependency would be more
 * surface area than it saves.
 */
export default function LogoRepositionModal({
  open,
  onClose,
  imageUrl,
  initialPlacement,
  onSave,
}: LogoRepositionModalProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Natural (original) pixel size of the loaded image — the ground truth
  // initialPlacement's x/y/width/height are already expressed in, and what
  // gets sent back on save. Unknown until the <img> actually loads.
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [scale, setScale] = useState(1);

  // On-screen box state, in DISPLAY pixels (scaled down from natural size
  // to fit MAX_DISPLAY_WIDTH) — converted back to natural pixels only when
  // saving, so the drag math below never has to think about the scale
  // factor mid-gesture.
  const [box, setBox] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // The box was previously an empty outline — you'd drag a frame around while
  // the real logo stayed baked into the static backdrop image, with no
  // feedback about what the result would actually look like. This renders
  // the actual logo inside the box so it visibly moves and resizes with it.
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    BrandProfileService.get().then((res) => {
      if (!cancelled && res.status && res.responseData?.logo_url) {
        setLogoUrl(res.responseData.logo_url);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const dragState = useRef<
    | { mode: 'move'; startX: number; startY: number; boxStartX: number; boxStartY: number }
    | { mode: 'resize'; startX: number; startY: number; boxStartW: number; boxStartH: number }
    | null
  >(null);

  const handleImageLoad = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    setNaturalSize({ w, h });
    // Measured from the actual rendered element, not derived from
    // MAX_DISPLAY_WIDTH — the img can render narrower than that (e.g. a
    // narrow viewport shrinking it via maxWidth: 100%), and if scale drifts
    // from the true on-screen size, the drag/resize clamping below goes out
    // of sync with what the user actually sees and can pin the box in place.
    const renderedWidth = img.getBoundingClientRect().width || Math.min(w, MAX_DISPLAY_WIDTH);
    const s = renderedWidth / w;
    setScale(s);
    setBox({
      x: initialPlacement.x * s,
      y: initialPlacement.y * s,
      width: initialPlacement.width * s,
      height: initialPlacement.height * s,
    });
  }, [initialPlacement.x, initialPlacement.y, initialPlacement.width, initialPlacement.height]);

  useEffect(() => {
    if (!open) {
      setNaturalSize(null);
      setError('');
    }
  }, [open]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const drag = dragState.current;
      if (!drag || !containerRef.current || !naturalSize) return;
      const containerWidth = naturalSize.w * scale;
      const containerHeight = naturalSize.h * scale;

      if (drag.mode === 'move') {
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        setBox((prev) => ({
          ...prev,
          x: Math.max(0, Math.min(Math.max(0, containerWidth - prev.width), drag.boxStartX + dx)),
          y: Math.max(0, Math.min(Math.max(0, containerHeight - prev.height), drag.boxStartY + dy)),
        }));
      } else {
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        setBox((prev) => ({
          ...prev,
          width: Math.max(MIN_BOX_SIZE, Math.min(containerWidth - prev.x, drag.boxStartW + dx)),
          height: Math.max(MIN_BOX_SIZE, Math.min(containerHeight - prev.y, drag.boxStartH + dy)),
        }));
      }
    };
    const onUp = () => {
      dragState.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [naturalSize, scale]);

  const startMove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragState.current = {
      mode: 'move',
      startX: e.clientX,
      startY: e.clientY,
      boxStartX: box.x,
      boxStartY: box.y,
    };
  };

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragState.current = {
      mode: 'resize',
      startX: e.clientX,
      startY: e.clientY,
      boxStartW: box.width,
      boxStartH: box.height,
    };
  };

  const handleSave = async () => {
    if (!naturalSize) return;
    setSaving(true);
    setError('');
    try {
      await onSave({
        x: Math.round(box.x / scale),
        y: Math.round(box.y / scale),
        width: Math.round(box.width / scale),
        height: Math.round(box.height / scale),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the new logo position. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={saving ? undefined : onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: '#fff',
          borderRadius: '14px',
          p: 3,
          maxWidth: 560,
          width: '92vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Move &amp; resize logo</Typography>
          <Button onClick={onClose} disabled={saving} sx={{ minWidth: 0, p: 0.5, color: '#888' }}>
            <MdClose size={20} />
          </Button>
        </Box>
        <Typography sx={{ fontSize: 12.5, color: '#888', mb: 2 }}>
          Drag the logo to move it. Drag the corner handle to resize it.
        </Typography>

        <Box
          ref={containerRef}
          sx={{
            position: 'relative',
            display: 'inline-block',
            lineHeight: 0,
            userSelect: 'none',
            maxWidth: '100%',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Post preview"
            onLoad={handleImageLoad}
            style={{ maxWidth: '100%', width: MAX_DISPLAY_WIDTH, display: 'block', borderRadius: 8 }}
            draggable={false}
          />
          {naturalSize && (
            <Box
              data-testid="logo-drag-box"
              onMouseDown={startMove}
              sx={{
                position: 'absolute',
                left: box.x,
                top: box.y,
                width: box.width,
                height: box.height,
                border: '2px solid #C2185B',
                borderRadius: '4px',
                cursor: 'move',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.25)',
              }}
            >
              {logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt=""
                  draggable={false}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'fill',
                    pointerEvents: 'none',
                  }}
                />
              )}
              <Box
                data-testid="logo-resize-handle"
                onMouseDown={startResize}
                sx={{
                  position: 'absolute',
                  right: -7,
                  bottom: -7,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: '#C2185B',
                  border: '2px solid #fff',
                  cursor: 'nwse-resize',
                }}
              />
            </Box>
          )}
          {!naturalSize && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CircularProgress size={24} />
            </Box>
          )}
        </Box>

        {error && <Typography sx={{ fontSize: 12.5, color: '#c62828', mt: 1.5 }}>{error}</Typography>}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2.5 }}>
          <Button onClick={onClose} disabled={saving} sx={{ textTransform: 'none', color: '#888' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !naturalSize}
            variant="contained"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              background: '#C2185B',
              '&:hover': { background: '#A01648' },
            }}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
