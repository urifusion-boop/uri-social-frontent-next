'use client';

import { SocialMediaAgentService, Storyboard, StoryboardScene } from '@/src/api/SocialMediaAgentService';
import { useRef, useState } from 'react';

const PRIMARY = '#CD1B78';
const DARK = '#0d0e0f';
const GREY = '#6B7280';
const LIGHT = '#F9FAFB';
const BORDER = '#E5E7EB';

const PLATFORMS = [
  { value: 'instagram_reels', label: 'Instagram Reels' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'facebook_reels', label: 'Facebook Reels' },
  { value: 'linkedin', label: 'LinkedIn' },
];

const DURATIONS = [
  { value: 10, label: '10s' },
  { value: 15, label: '15s' },
  { value: 20, label: '20s' },
  { value: 30, label: '30s' },
];

const SHOT_COLORS: Record<string, string> = {
  product_hero: '#F0FDF4',
  lifestyle: '#EFF6FF',
  brand_close_up: '#FFF7ED',
  text_card: '#FDF4FF',
  transition: '#F8FAFC',
};
const SHOT_BORDER: Record<string, string> = {
  product_hero: '#86EFAC',
  lifestyle: '#93C5FD',
  brand_close_up: '#FCD34D',
  text_card: '#D8B4FE',
  transition: '#CBD5E1',
};

interface UploadedImage {
  dataUrl: string;
  name: string;
}

export default function VideoStoryboardGenerator() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [optionalText, setOptionalText] = useState('');
  const [platform, setPlatform] = useState('instagram_reels');
  const [duration, setDuration] = useState(15);
  const [loading, setLoading] = useState(false);
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = 5 - images.length;
    if (remaining <= 0) return;
    const accepted = Array.from(files)
      .filter((f) => f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024)
      .slice(0, remaining);
    accepted.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setImages((prev) =>
          prev.length < 5 ? [...prev, { dataUrl: reader.result as string, name: file.name }] : prev
        );
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleGenerate = async () => {
    if (images.length === 0) return;
    setLoading(true);
    setError('');
    setStoryboard(null);
    try {
      const res = await SocialMediaAgentService.generateStoryboard({
        brand_images: images.map((img) => img.dataUrl),
        optional_text: optionalText.trim() || undefined,
        target_platform: platform,
        target_duration_seconds: duration,
      });
      if (res.status && res.responseData) {
        setStoryboard(res.responseData);
      } else {
        setError(res.responseMessage || 'Storyboard generation failed. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px 0', maxWidth: 720, margin: '0 auto' }}>
      {/* Image upload */}
      <Section
        title="Brand Images"
        subtitle="Upload 1–5 images to ground the storyboard (logo, product shots, sample posts)"
      >
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => images.length < 5 && fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? PRIMARY : BORDER}`,
            borderRadius: 12,
            padding: '24px 16px',
            textAlign: 'center',
            cursor: images.length < 5 ? 'pointer' : 'default',
            background: dragging ? '#FFF0F8' : LIGHT,
            transition: 'all .15s',
            marginBottom: images.length ? 14 : 0,
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: DARK, margin: 0 }}>
            {images.length >= 5 ? 'Maximum 5 images reached' : 'Drag & drop or click to upload'}
          </p>
          <p style={{ fontSize: 12, color: GREY, margin: '4px 0 0' }}>
            PNG, JPG, WEBP — up to 10 MB each · {images.length}/5 uploaded
          </p>
        </div>

        {images.length > 0 && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {images.map((img, i) => (
              <div
                key={i}
                style={{
                  position: 'relative',
                  width: 90,
                  height: 90,
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: `1.5px solid ${BORDER}`,
                  flexShrink: 0,
                }}
              >
                <img
                  src={img.dataUrl}
                  alt={img.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    background: 'rgba(0,0,0,.45)',
                    padding: '2px 4px',
                    fontSize: 9.5,
                    color: '#fff',
                    fontWeight: 600,
                    letterSpacing: 0.3,
                  }}
                >
                  Image {i}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(i);
                  }}
                  style={{
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    width: 20,
                    height: 20,
                    borderRadius: 99,
                    background: 'rgba(0,0,0,.6)',
                    border: 'none',
                    color: '#fff',
                    fontSize: 11,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 10,
                  border: `2px dashed ${BORDER}`,
                  background: LIGHT,
                  cursor: 'pointer',
                  fontSize: 22,
                  color: GREY,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                +
              </button>
            )}
          </div>
        )}
      </Section>

      {/* Creative direction */}
      <Section
        title="Creative Direction"
        subtitle="Optional — describe the story or mood you want (e.g. 'focus on the unboxing experience')"
      >
        <textarea
          value={optionalText}
          onChange={(e) => setOptionalText(e.target.value)}
          placeholder="e.g. Show the product being used outdoors at golden hour. Emphasise the texture and quality. End with the logo on a clean background."
          rows={3}
          maxLength={1000}
          style={{
            width: '100%',
            border: `1.5px solid ${BORDER}`,
            borderRadius: 10,
            padding: '10px 12px',
            fontSize: 13.5,
            color: DARK,
            resize: 'vertical',
            fontFamily: 'inherit',
            outline: 'none',
            boxSizing: 'border-box',
            background: '#fff',
          }}
        />
        <p style={{ fontSize: 11, color: '#9CA3AF', margin: '4px 0 0', textAlign: 'right' }}>
          {optionalText.length}/1000
        </p>
      </Section>

      {/* Platform + Duration */}
      <Section title="Video Settings" subtitle="Platform and target duration">
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: GREY, display: 'block', marginBottom: 6 }}>
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              style={{
                width: '100%',
                border: `1.5px solid ${BORDER}`,
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: 13.5,
                color: DARK,
                background: '#fff',
                outline: 'none',
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: GREY, display: 'block', marginBottom: 6 }}>
              Duration
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              {DURATIONS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDuration(d.value)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 8,
                    border: `1.5px solid ${duration === d.value ? PRIMARY : BORDER}`,
                    background: duration === d.value ? '#FFF0F8' : '#fff',
                    color: duration === d.value ? PRIMARY : GREY,
                    fontWeight: duration === d.value ? 700 : 500,
                    fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all .15s',
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Generate button */}
      {error && (
        <div
          style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 16,
          }}
        >
          <p style={{ fontSize: 13, color: '#DC2626', margin: 0 }}>{error}</p>
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={images.length === 0 || loading}
        style={{
          width: '100%',
          padding: '13px 0',
          borderRadius: 10,
          background: images.length === 0 || loading ? '#E5E7EB' : PRIMARY,
          color: images.length === 0 || loading ? '#9CA3AF' : '#fff',
          border: 'none',
          fontSize: 14,
          fontWeight: 700,
          cursor: images.length === 0 || loading ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          transition: 'background .15s',
          marginBottom: 28,
        }}
      >
        {loading ? 'Generating storyboard…' : 'Generate Storyboard'}
      </button>

      {/* Storyboard result */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: GREY }}>
          <div
            style={{
              width: 36,
              height: 36,
              border: `3px solid ${BORDER}`,
              borderTopColor: PRIMARY,
              borderRadius: 99,
              margin: '0 auto 12px',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <p style={{ fontSize: 13, margin: 0 }}>Analysing brand images and crafting scenes…</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {storyboard && !loading && <StoryboardResult storyboard={storyboard} uploadedImages={images} />}
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ marginBottom: 10 }}>
        <p style={{ fontSize: 13.5, fontWeight: 700, color: DARK, margin: 0 }}>{title}</p>
        <p style={{ fontSize: 12, color: GREY, margin: '2px 0 0' }}>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function StoryboardResult({ storyboard, uploadedImages }: { storyboard: Storyboard; uploadedImages: UploadedImage[] }) {
  return (
    <div>
      {/* Summary bar */}
      <div
        style={{
          display: 'flex',
          gap: 20,
          padding: '12px 16px',
          background: '#FFF0F8',
          borderRadius: 10,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <Chip label="Platform" value={storyboard.target_platform.replace(/_/g, ' ')} />
        <Chip label="Duration" value={`${storyboard.total_duration_seconds}s`} />
        <Chip label="Scenes" value={String(storyboard.scenes.length)} />
        <Chip label="Aspect" value={storyboard.aspect_ratio} />
      </div>

      {/* Scene cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {storyboard.scenes.map((scene) => (
          <SceneCard key={scene.scene_number} scene={scene} refImage={uploadedImages[scene.reference_image_index]} />
        ))}
      </div>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: PRIMARY,
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: 13, fontWeight: 700, color: DARK, margin: 0, textTransform: 'capitalize' }}>{value}</p>
    </div>
  );
}

function SceneCard({ scene, refImage }: { scene: StoryboardScene; refImage?: UploadedImage }) {
  const bg = SHOT_COLORS[scene.shot_type] ?? '#F8FAFC';
  const border = SHOT_BORDER[scene.shot_type] ?? '#CBD5E1';
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        border: `1.5px solid ${border}`,
        borderRadius: 12,
        overflow: 'hidden',
        background: '#fff',
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          background: bg,
          cursor: 'pointer',
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Scene number badge */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 99,
            background: PRIMARY,
            color: '#fff',
            fontSize: 13,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {scene.scene_number}
        </div>

        {/* Ref image thumbnail */}
        {refImage && (
          <img
            src={refImage.dataUrl}
            alt={`ref ${scene.reference_image_index}`}
            style={{
              width: 36,
              height: 36,
              borderRadius: 6,
              objectFit: 'cover',
              border: `1.5px solid ${BORDER}`,
              flexShrink: 0,
            }}
          />
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                color: PRIMARY,
                background: '#FFF0F8',
                borderRadius: 4,
                padding: '2px 6px',
                border: `1px solid ${border}`,
              }}
            >
              {scene.shot_type.replace(/_/g, ' ')}
            </span>
            <span style={{ fontSize: 11.5, color: GREY, fontWeight: 600 }}>{scene.duration_seconds}s</span>
          </div>
          <p
            style={{
              fontSize: 12.5,
              color: GREY,
              margin: '3px 0 0',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {scene.motion}
          </p>
        </div>

        {scene.text_overlay && (
          <div
            style={{
              padding: '3px 8px',
              borderRadius: 6,
              background: '#1a1a1a',
              color: '#fff',
              fontSize: 11,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              maxWidth: 120,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            "{scene.text_overlay}"
          </div>
        )}

        <span style={{ fontSize: 14, color: GREY, flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Expanded video prompt */}
      {expanded && (
        <div style={{ padding: '12px 16px 16px', borderTop: `1px solid ${border}` }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: GREY,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              margin: '0 0 6px',
            }}
          >
            Video Prompt
          </p>
          <p
            style={{
              fontSize: 13,
              color: DARK,
              margin: 0,
              lineHeight: 1.6,
              background: '#F9FAFB',
              borderRadius: 8,
              padding: '10px 12px',
            }}
          >
            {scene.video_prompt}
          </p>
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            <Detail label="Reference image" value={`Image ${scene.reference_image_index}`} />
            {scene.text_overlay && <Detail label="Text overlay" value={`"${scene.text_overlay}"`} />}
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          color: GREY,
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: 12.5, color: DARK, margin: '2px 0 0', fontWeight: 600 }}>{value}</p>
    </div>
  );
}
