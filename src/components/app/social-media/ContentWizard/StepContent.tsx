'use client';

import { Box, Typography } from '@mui/material';
import { MdEdit, MdUpload } from 'react-icons/md';
import StepBrief from './StepBrief';
import StepUploadBrief from './StepUploadBrief';
import { ContentSource, ContentWizardState } from './useContentWizardState';

const PINK = '#CD1B78';

const SOURCES: Array<{ key: ContentSource; icon: React.ReactNode; label: string; subtitle: string }> = [
  {
    key: 'prompt',
    icon: <MdEdit size={15} />,
    label: 'Write a prompt',
    subtitle: 'Describe it — AI writes and designs the post',
  },
  {
    key: 'upload',
    icon: <MdUpload size={15} />,
    label: 'Upload your own',
    subtitle: 'Use your own photo or video — AI just writes the caption',
  },
];

export default function StepContent({ wizard }: { wizard: ContentWizardState }) {
  return (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.25, mb: 3 }}>
        {SOURCES.map((s) => {
          const active = wizard.contentSource === s.key;
          return (
            <Box
              key={s.key}
              onClick={() => wizard.setContentSource(s.key)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                border: '1.5px solid',
                borderColor: active ? PINK : '#E5E7EB',
                borderRadius: '12px',
                p: 1.5,
                cursor: 'pointer',
                background: active ? '#FDF2F8' : '#fff',
                transition: 'all 0.15s',
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '9px',
                  flexShrink: 0,
                  background: active ? PINK : '#F3F4F6',
                  color: active ? '#fff' : '#9CA3AF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {s.icon}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography fontSize="13px" fontWeight={700} color="#111827">
                  {s.label}
                </Typography>
                <Typography fontSize="11px" color="#6B7280" sx={{ lineHeight: 1.3 }}>
                  {s.subtitle}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>

      {wizard.contentSource === 'prompt' ? <StepBrief wizard={wizard} /> : <StepUploadBrief wizard={wizard} />}
    </Box>
  );
}
