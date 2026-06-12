'use client';

/**
 * Canvas Editor Toolbar
 *
 * Top toolbar with undo/redo, export, and close buttons
 */

import React, { useState } from 'react';
import { IconButton, Tooltip, CircularProgress, Menu, MenuItem } from '@mui/material';
import { MdUndo, MdRedo, MdClose, MdDownload, MdSave } from 'react-icons/md';
import { RenderResponse } from '@/src/api/CanvasEditorService';

interface CanvasToolbarProps {
  onClose: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onRender: (aspectRatio: '1:1' | '9:16' | '4:5' | '16:9') => Promise<RenderResponse>;
  isRendering: boolean;
  onSave?: (imageUrl: string) => void;
  draftId: string;
}

const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  onClose,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onRender,
  isRendering,
  onSave,
  draftId,
}) => {
  const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);

  const handleExport = async (aspectRatio: '1:1' | '9:16' | '4:5' | '16:9') => {
    setExportAnchor(null);
    try {
      const result = await onRender(aspectRatio);

      // Download the image
      const link = document.createElement('a');
      link.href = result.image_url;
      link.download = `canvas-${draftId}-${aspectRatio}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleSave = async () => {
    try {
      const result = await onRender('1:1');
      if (onSave) {
        onSave(result.image_url);
      }
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  return (
    <div
      style={{
        height: '64px',
        backgroundColor: '#1a1a1a',
        borderBottom: '1px solid #3a3a3a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
      }}
    >
      {/* Left: Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h2
          style={{
            margin: 0,
            color: 'white',
            fontSize: '18px',
            fontWeight: 600,
            fontFamily: 'var(--wf,sans-serif)',
          }}
        >
          Canvas Editor
        </h2>
        <span
          style={{
            fontSize: '12px',
            color: '#888',
            backgroundColor: '#2a2a2a',
            padding: '4px 12px',
            borderRadius: '12px',
          }}
        >
          Beta
        </span>
      </div>

      {/* Center: Undo/Redo */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <Tooltip title="Undo (Ctrl+Z)">
          <span>
            <IconButton
              onClick={onUndo}
              disabled={!canUndo}
              sx={{
                color: canUndo ? 'white' : '#555',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
              }}
            >
              <MdUndo size={22} />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Redo (Ctrl+Y)">
          <span>
            <IconButton
              onClick={onRedo}
              disabled={!canRedo}
              sx={{
                color: canRedo ? 'white' : '#555',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
              }}
            >
              <MdRedo size={22} />
            </IconButton>
          </span>
        </Tooltip>
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        {onSave && (
          <Tooltip title="Save as Draft Image">
            <IconButton
              onClick={handleSave}
              disabled={isRendering}
              sx={{
                color: '#4CAF50',
                '&:hover': { backgroundColor: 'rgba(76,175,80,0.1)' },
              }}
            >
              {isRendering ? <CircularProgress size={22} sx={{ color: '#4CAF50' }} /> : <MdSave size={22} />}
            </IconButton>
          </Tooltip>
        )}

        <Tooltip title="Export">
          <IconButton
            onClick={(e) => setExportAnchor(e.currentTarget)}
            disabled={isRendering}
            sx={{
              color: '#2196F3',
              '&:hover': { backgroundColor: 'rgba(33,150,243,0.1)' },
            }}
          >
            {isRendering ? <CircularProgress size={22} sx={{ color: '#2196F3' }} /> : <MdDownload size={22} />}
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={exportAnchor}
          open={Boolean(exportAnchor)}
          onClose={() => setExportAnchor(null)}
          PaperProps={{
            sx: {
              backgroundColor: '#2a2a2a',
              color: 'white',
              minWidth: '200px',
            },
          }}
        >
          <MenuItem
            onClick={() => handleExport('1:1')}
            sx={{ '&:hover': { backgroundColor: '#3a3a3a' } }}
          >
            📱 Square (1:1) - Instagram/Facebook
          </MenuItem>
          <MenuItem
            onClick={() => handleExport('9:16')}
            sx={{ '&:hover': { backgroundColor: '#3a3a3a' } }}
          >
            📲 Story (9:16) - Instagram/Facebook
          </MenuItem>
          <MenuItem
            onClick={() => handleExport('4:5')}
            sx={{ '&:hover': { backgroundColor: '#3a3a3a' } }}
          >
            🖼️ Portrait (4:5) - Instagram
          </MenuItem>
          <MenuItem
            onClick={() => handleExport('16:9')}
            sx={{ '&:hover': { backgroundColor: '#3a3a3a' } }}
          >
            🖥️ Landscape (16:9) - YouTube/LinkedIn
          </MenuItem>
        </Menu>

        <div style={{ width: '1px', height: '32px', backgroundColor: '#3a3a3a', margin: '0 8px' }} />

        <Tooltip title="Close">
          <IconButton
            onClick={onClose}
            sx={{
              color: '#f44336',
              '&:hover': { backgroundColor: 'rgba(244,67,54,0.1)' },
            }}
          >
            <MdClose size={24} />
          </IconButton>
        </Tooltip>
      </div>
    </div>
  );
};

export default CanvasToolbar;
