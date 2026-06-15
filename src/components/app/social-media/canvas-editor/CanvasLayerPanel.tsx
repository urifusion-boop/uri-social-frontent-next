'use client';

/**
 * Canvas Layer Panel
 *
 * Right sidebar showing all layers with visibility toggle and delete
 */

import React from 'react';
import { LayeredDocument, Layer } from '@/src/types/canvas.types';
import { IconButton, Tooltip } from '@mui/material';
import {
  MdVisibility,
  MdVisibilityOff,
  MdDelete,
  MdLock,
  MdLockOpen,
  MdImage,
  MdTextFields,
  MdBrush,
} from 'react-icons/md';

interface CanvasLayerPanelProps {
  document: LayeredDocument;
  selectedLayerId: string | null;
  onSelectLayer: (layerId: string) => void;
  onDeleteLayer: (layerId: string) => void;
  onToggleVisibility: (layerId: string) => void;
  onUpdateLayer: (layerId: string, updates: Partial<Layer>) => Promise<void>;
}

const CanvasLayerPanel: React.FC<CanvasLayerPanelProps> = ({
  document,
  selectedLayerId,
  onSelectLayer,
  onDeleteLayer,
  onToggleVisibility,
  onUpdateLayer,
}) => {
  const getLayerIcon = (layer: Layer) => {
    switch (layer.type) {
      case 'text':
        return <MdTextFields size={18} />;
      case 'ai_generated_background':
        return <MdImage size={18} />;
      case 'brand_asset':
        return <MdBrush size={18} />;
      default:
        return <MdImage size={18} />;
    }
  };

  const getLayerName = (layer: Layer) => {
    switch (layer.type) {
      case 'text':
        return (layer as { content?: string }).content?.substring(0, 20) || 'Text Layer';
      case 'ai_generated_background':
        return 'Background';
      case 'brand_asset':
        return (layer as { asset_type?: string }).asset_type === 'logo' ? 'Logo' : 'Brand Asset';
      default:
        return 'Layer';
    }
  };

  // Sort layers by z-index (top to bottom in UI, reverse of canvas)
  const sortedLayers = [...document.layers].sort((a, b) => b.z_index - a.z_index);

  return (
    <div
      style={{
        width: '280px',
        backgroundColor: '#1a1a1a',
        borderLeft: '1px solid #3a3a3a',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #3a3a3a',
        }}
      >
        <h3
          style={{
            margin: 0,
            color: 'white',
            fontSize: '14px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Layers ({document.layers.length})
        </h3>
      </div>

      {/* Layer List */}
      <div style={{ flex: 1, padding: '8px' }}>
        {sortedLayers.map((layer) => {
          const isSelected = layer.id === selectedLayerId;

          return (
            <div
              key={layer.id}
              onClick={() => onSelectLayer(layer.id)}
              style={{
                padding: '12px',
                marginBottom: '4px',
                backgroundColor: isSelected ? 'rgba(205, 27, 120, 0.15)' : '#2a2a2a',
                border: isSelected ? '1px solid #CD1B78' : '1px solid #3a3a3a',
                borderRadius: '8px',
                cursor: layer.locked ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s',
                opacity: layer.visible ? 1 : 0.5,
              }}
              onMouseEnter={(e) => {
                if (!layer.locked && !isSelected) {
                  e.currentTarget.style.backgroundColor = '#333';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#2a2a2a';
                }
              }}
            >
              {/* Layer Icon */}
              <div style={{ color: '#CD1B78', display: 'flex', alignItems: 'center' }}>{getLayerIcon(layer)}</div>

              {/* Layer Name */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {getLayerName(layer)}
                </div>
                {layer.locked && (
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#888',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginTop: '2px',
                    }}
                  >
                    <MdLock size={12} />
                    Locked
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '4px' }}>
                {/* Lock/Unlock Toggle */}
                {layer.locked && (
                  <Tooltip title="Unlock Layer">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateLayer(layer.id, { locked: false });
                      }}
                      sx={{ color: '#ffa726', '&:hover': { backgroundColor: 'rgba(255,167,38,0.1)' } }}
                    >
                      <MdLockOpen size={16} />
                    </IconButton>
                  </Tooltip>
                )}

                {/* Visibility Toggle */}
                <Tooltip title={layer.visible ? 'Hide Layer' : 'Show Layer'}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVisibility(layer.id);
                    }}
                    sx={{ color: layer.visible ? 'white' : '#555' }}
                  >
                    {layer.visible ? <MdVisibility size={16} /> : <MdVisibilityOff size={16} />}
                  </IconButton>
                </Tooltip>

                {/* Delete Button */}
                {!layer.locked && (
                  <Tooltip title="Delete Layer">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Delete layer "${getLayerName(layer)}"?`)) {
                          onDeleteLayer(layer.id);
                        }
                      }}
                      sx={{ color: '#f44336', '&:hover': { backgroundColor: 'rgba(244,67,54,0.1)' } }}
                    >
                      <MdDelete size={16} />
                    </IconButton>
                  </Tooltip>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Help Text */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid #3a3a3a',
          fontSize: '12px',
          color: '#888',
          lineHeight: '1.5',
        }}
      >
        💡 <strong>Tip:</strong> Click layers to select, drag to reposition, and use corners to resize.
      </div>
    </div>
  );
};

export default CanvasLayerPanel;
