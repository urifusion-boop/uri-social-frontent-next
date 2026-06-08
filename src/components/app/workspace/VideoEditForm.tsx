'use client';

import { useRef, useState } from 'react';
import { SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { Box, Checkbox, CircularProgress, FormControlLabel, LinearProgress, Typography } from '@mui/material';
import { FaInstagram, FaTiktok, FaFacebook } from 'react-icons/fa';

const ACCEPTED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const MAX_MB = 200;

const MUSIC_MOODS = ['upbeat', 'ambient', 'dramatic', 'playful', 'afrobeats', 'lo-fi'];

const PLATFORMS = [
  { key: 'instagram_reels', label: 'Instagram', icon: <FaInstagram size={14} color="#E1306C" /> },
  { key: 'tiktok', label: 'TikTok', icon: <FaTiktok size={14} color="#010101" /> },
  { key: 'facebook_reels', label: 'Facebook', icon: <FaFacebook size={14} color="#1877F2" /> },
];

interface Enhancements {
  stabilise: boolean;
  colour_grade: boolean;
  crop_916: boolean;
  add_intro: boolean;
  add_outro: boolean;
  add_music: boolean;
  music_mood: string;
  add_text_overlays: boolean;
  headline_text: string;
  cta_text: string;
  smart_trim: boolean;
}

interface VideoEditFormProps {
  onEditComplete: () => void;
}

export default function VideoEditForm({ onEditComplete }: VideoEditFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [platform, setPlatform] = useState('instagram_reels');
  const [enhancements, setEnhancements] = useState<Enhancements>({
    stabilise: true,
    colour_grade: true,
    crop_916: true,
    add_intro: true,
    add_outro: true,
    add_music: true,
    music_mood: 'upbeat',
    add_text_overlays: true,
    headline_text: '',
    cta_text: '',
    smart_trim: true,
  });

  const [phase, setPhase] = useState<'idle' | 'uploading' | 'processing' | 'done' | 'failed'>('idle');
  const [progress, setProgress] = useState(0);
  const [resultVideoUrl, setResultVideoUrl] = useState<string | null>(null);
  const [editsApplied, setEditsApplied] = useState<string[]>([]);

  const toggle = (key: keyof Enhancements) =>
    setEnhancements((prev) => ({ ...prev, [key]: !prev[key as keyof Enhancements] }));

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) return 'Only MP4, MOV, and WebM are supported.';
    if (file.size > MAX_MB * 1024 * 1024) return `File is too large. Maximum size is ${MAX_MB}MB.`;
    return null;
  };

  const handleFile = (file: File) => {
    const err = validateFile(file);
    if (err) {
      ToastService.showToast(err, ToastTypeEnum.Error);
      return;
    }
    setVideoFile(file);
    setPhase('idle');
    setResultVideoUrl(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const startPolling = (jobId: string) => {
    setPhase('processing');
    pollRef.current = setInterval(async () => {
      try {
        const res = await SocialMediaAgentService.getVideoEditJob(jobId);
        if (!res.status || !res.responseData) return;
        const job = res.responseData;

        if (job.progress !== undefined) setProgress(job.progress);

        if (job.status === 'complete') {
          clearInterval(pollRef.current!);
          setResultVideoUrl(job.edited_video_url ?? null);
          setEditsApplied(job.edits_applied ?? []);
          setPhase('done');
          onEditComplete();
        } else if (job.status === 'failed') {
          clearInterval(pollRef.current!);
          setPhase('failed');
          ToastService.showToast(job.error ?? 'Video editing failed. Please try again.', ToastTypeEnum.Error);
        }
      } catch {
        // transient network error — keep polling
      }
    }, 3000);
  };

  const handleSubmit = async () => {
    if (!videoFile) return;
    setPhase('uploading');
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('platform', platform);
      formData.append('enhancements', JSON.stringify(enhancements));

      const res = await SocialMediaAgentService.submitVideoEdit(formData);
      if (!res.status || !res.responseData) throw new Error(res.responseMessage ?? 'Upload failed');
      startPolling(res.responseData.job_id);
    } catch (err: unknown) {
      setPhase('failed');
      const message = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      ToastService.showToast(message, ToastTypeEnum.Error);
    }
  };

  const reset = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setVideoFile(null);
    setPhase('idle');
    setProgress(0);
    setResultVideoUrl(null);
    setEditsApplied([]);
  };

  const isProcessing = phase === 'uploading' || phase === 'processing';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Upload zone */}
      <Box
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        sx={{
          border: `2px dashed ${isDragging ? '#CD1B78' : videoFile ? '#CD1B78' : '#D1D5DB'}`,
          borderRadius: '12px',
          background: isDragging ? 'rgba(205,27,120,0.04)' : videoFile ? 'rgba(205,27,120,0.02)' : '#FAFAFA',
          p: 3,
          textAlign: 'center',
          cursor: isProcessing ? 'default' : 'pointer',
          transition: 'all 0.15s',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = '';
          }}
        />
        {videoFile ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
            <span style={{ fontSize: 20 }}>🎬</span>
            <Box sx={{ textAlign: 'left' }}>
              <Typography fontSize="13px" fontWeight={600} color="#111">
                {videoFile.name}
              </Typography>
              <Typography fontSize="11px" color="#6B7280">
                {(videoFile.size / 1024 / 1024).toFixed(1)} MB · Click to change
              </Typography>
            </Box>
          </Box>
        ) : (
          <>
            <Typography fontSize="28px" mb={0.5}>
              📹
            </Typography>
            <Typography fontSize="13px" fontWeight={600} color="#374151">
              Drop your video here or click to upload
            </Typography>
            <Typography fontSize="11px" color="#9CA3AF" mt={0.5}>
              MP4, MOV, or WebM · Max {MAX_MB}MB · 5 seconds – 3 minutes
            </Typography>
          </>
        )}
      </Box>

      {/* Platform selector */}
      <Box>
        <Typography fontSize="11px" fontWeight={700} color="#6B7280" letterSpacing={0.8} mb={1}>
          TARGET PLATFORM
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {PLATFORMS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPlatform(p.key)}
              disabled={isProcessing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 8,
                border: platform === p.key ? '1.5px solid #CD1B78' : '1.5px solid #E5E7EB',
                background: platform === p.key ? 'rgba(205,27,120,0.06)' : '#fff',
                cursor: isProcessing ? 'default' : 'pointer',
                fontSize: 13,
                fontWeight: platform === p.key ? 600 : 400,
                color: platform === p.key ? '#CD1B78' : '#374151',
                transition: 'all 0.15s',
              }}
            >
              {p.icon}
              {p.label}
            </button>
          ))}
        </Box>
      </Box>

      {/* Enhancements */}
      <Box>
        <Typography fontSize="11px" fontWeight={700} color="#6B7280" letterSpacing={0.8} mb={1}>
          ENHANCEMENTS
        </Typography>
        <Box
          sx={{
            border: '1px solid #F3E8FF',
            borderRadius: '12px',
            p: 2,
            background: 'linear-gradient(135deg, #FFFFFF 0%, #FEFCFF 100%)',
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
          }}
        >
          {(
            [
              { key: 'stabilise', label: 'Stabilise footage' },
              { key: 'colour_grade', label: 'Colour grade to match brand style' },
              { key: 'crop_916', label: 'Crop to 9:16 for Reels/TikTok' },
              { key: 'add_intro', label: 'Add branded intro (1.5s)' },
              { key: 'add_outro', label: 'Add branded outro with CTA (2s)' },
              { key: 'smart_trim', label: 'Smart trim to best moments' },
            ] as { key: keyof Enhancements; label: string }[]
          ).map(({ key, label }) => (
            <FormControlLabel
              key={key}
              control={
                <Checkbox
                  checked={enhancements[key] as boolean}
                  onChange={() => toggle(key)}
                  disabled={isProcessing}
                  size="small"
                  sx={{ color: '#CD1B78', '&.Mui-checked': { color: '#CD1B78' }, py: 0.5 }}
                />
              }
              label={
                <Typography fontSize="13px" color="#374151">
                  {label}
                </Typography>
              }
            />
          ))}

          {/* Music toggle + mood */}
          <FormControlLabel
            control={
              <Checkbox
                checked={enhancements.add_music}
                onChange={() => toggle('add_music')}
                disabled={isProcessing}
                size="small"
                sx={{ color: '#CD1B78', '&.Mui-checked': { color: '#CD1B78' }, py: 0.5 }}
              />
            }
            label={
              <Typography fontSize="13px" color="#374151">
                Add background music
              </Typography>
            }
          />
          {enhancements.add_music && (
            <Box sx={{ ml: 4, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
              <Typography fontSize="12px" color="#6B7280">
                Mood:
              </Typography>
              {MUSIC_MOODS.map((mood) => (
                <button
                  key={mood}
                  onClick={() => setEnhancements((prev) => ({ ...prev, music_mood: mood }))}
                  disabled={isProcessing}
                  style={{
                    padding: '2px 10px',
                    borderRadius: 20,
                    border: enhancements.music_mood === mood ? '1.5px solid #CD1B78' : '1.5px solid #E5E7EB',
                    background: enhancements.music_mood === mood ? 'rgba(205,27,120,0.08)' : '#fff',
                    color: enhancements.music_mood === mood ? '#CD1B78' : '#6B7280',
                    fontSize: 11,
                    fontWeight: enhancements.music_mood === mood ? 600 : 400,
                    cursor: isProcessing ? 'default' : 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {mood}
                </button>
              ))}
            </Box>
          )}

          {/* Text overlays toggle + inputs */}
          <FormControlLabel
            control={
              <Checkbox
                checked={enhancements.add_text_overlays}
                onChange={() => toggle('add_text_overlays')}
                disabled={isProcessing}
                size="small"
                sx={{ color: '#CD1B78', '&.Mui-checked': { color: '#CD1B78' }, py: 0.5 }}
              />
            }
            label={
              <Typography fontSize="13px" color="#374151">
                Add text overlays
              </Typography>
            }
          />
          {enhancements.add_text_overlays && (
            <Box sx={{ ml: 4, display: 'flex', flexDirection: 'column', gap: 1, mb: 0.5 }}>
              <input
                placeholder="Headline (e.g. Fresh Jollof Rice — ₦2,500)"
                value={enhancements.headline_text}
                onChange={(e) => setEnhancements((prev) => ({ ...prev, headline_text: e.target.value }))}
                disabled={isProcessing}
                maxLength={60}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #E5E7EB',
                  fontSize: 12,
                  color: '#111',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
              <input
                placeholder="CTA (e.g. Order on WhatsApp · Link in bio)"
                value={enhancements.cta_text}
                onChange={(e) => setEnhancements((prev) => ({ ...prev, cta_text: e.target.value }))}
                disabled={isProcessing}
                maxLength={60}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #E5E7EB',
                  fontSize: 12,
                  color: '#111',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
            </Box>
          )}
        </Box>
      </Box>

      {/* Progress */}
      {isProcessing && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CircularProgress size={16} sx={{ color: '#CD1B78' }} />
            <Typography fontSize="13px" color="#374151">
              {phase === 'uploading' ? 'Uploading your video…' : 'Jane is editing your footage…'}
            </Typography>
          </Box>
          {phase === 'processing' && progress > 0 && (
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                borderRadius: 4,
                height: 4,
                backgroundColor: '#F3E8FF',
                '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #CD1B78, #A01560)' },
              }}
            />
          )}
          {phase === 'processing' && (
            <Typography fontSize="11px" color="#9CA3AF">
              Stabilising · colour grading · adding your branding · about 30 seconds
            </Typography>
          )}
        </Box>
      )}

      {/* Result */}
      {phase === 'done' && resultVideoUrl && (
        <Box
          sx={{
            border: '1px solid #D1FAE5',
            borderRadius: '12px',
            p: 2,
            background: '#F0FDF4',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span style={{ fontSize: 16 }}>✅</span>
            <Typography fontSize="13px" fontWeight={600} color="#065F46">
              Your Reel is ready — check the Drafts tab
            </Typography>
          </Box>
          {editsApplied.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {editsApplied.map((edit) => (
                <Box
                  key={edit}
                  sx={{ px: 1, py: 0.25, borderRadius: 20, background: '#D1FAE5', fontSize: 11, color: '#065F46' }}
                >
                  {edit}
                </Box>
              ))}
            </Box>
          )}
          <video
            src={resultVideoUrl}
            controls
            playsInline
            style={{ width: '50%', aspectRatio: '9/16', borderRadius: 8, background: '#000' }}
          />
          <button
            onClick={reset}
            style={{
              alignSelf: 'flex-start',
              padding: '6px 14px',
              borderRadius: 8,
              border: '1.5px solid #E5E7EB',
              background: '#fff',
              fontSize: 12,
              color: '#374151',
              cursor: 'pointer',
            }}
          >
            Edit another video
          </button>
        </Box>
      )}

      {/* Submit button */}
      {phase !== 'done' && (
        <button
          onClick={handleSubmit}
          disabled={!videoFile || isProcessing}
          style={{
            padding: '12px 24px',
            borderRadius: 10,
            border: 'none',
            background: !videoFile || isProcessing ? '#E5E7EB' : 'linear-gradient(135deg, #CD1B78 0%, #A01560 100%)',
            color: !videoFile || isProcessing ? '#9CA3AF' : '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: !videoFile || isProcessing ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.15s',
          }}
        >
          {isProcessing ? (
            <>
              <CircularProgress size={14} sx={{ color: '#9CA3AF' }} />
              Processing…
            </>
          ) : (
            '🎬 Edit My Video'
          )}
        </button>
      )}
    </Box>
  );
}
