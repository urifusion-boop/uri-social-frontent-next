'use client';

/**
 * Canvas Property Panel
 *
 * Left sidebar for editing selected layer properties (text, colors, fonts)
 */

import React, { useState, useEffect } from 'react';
import { LayeredDocument, Layer, TextLayer } from '@/src/types/canvas.types';
import { TextField, Select, MenuItem, Slider } from '@mui/material';
import { HexColorPicker } from 'react-colorful';

interface CanvasPropertyPanelProps {
  selectedLayerId: string | null;
  document: LayeredDocument;
  onUpdateLayer: (layerId: string, updates: Partial<Layer>) => Promise<void>;
}

const CanvasPropertyPanel: React.FC<CanvasPropertyPanelProps> = ({ selectedLayerId, document, onUpdateLayer }) => {
  const selectedLayer = document.layers.find((l) => l.id === selectedLayerId);

  const [textContent, setTextContent] = useState('');
  const [fontSize, setFontSize] = useState(32);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [color, setColor] = useState('#000000');
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Sync local state with selected layer
  useEffect(() => {
    if (selectedLayer && selectedLayer.type === 'text') {
      const textLayer = selectedLayer as TextLayer;
      setTextContent(textLayer.content);
      setFontSize(textLayer.font_size);
      setFontFamily(textLayer.font_family);
      setColor(textLayer.color);
    }
  }, [selectedLayer]);

  if (!selectedLayer) {
    return (
      <div
        style={{
          width: '280px',
          backgroundColor: '#1a1a1a',
          borderRight: '1px solid #3a3a3a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px',
          color: '#888',
          fontSize: '14px',
          textAlign: 'center',
          lineHeight: '1.6',
        }}
      >
        Select a layer to edit its properties
      </div>
    );
  }

  if (selectedLayer.locked) {
    return (
      <div
        style={{
          width: '280px',
          backgroundColor: '#1a1a1a',
          borderRight: '1px solid #3a3a3a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px',
          gap: '20px',
          color: '#888',
          fontSize: '14px',
          textAlign: 'center',
          lineHeight: '1.6',
        }}
      >
        <div>🔒 This layer is locked and cannot be edited</div>
        <button
          onClick={() => onUpdateLayer(selectedLayer.id, { locked: false })}
          style={{
            padding: '12px 24px',
            backgroundColor: '#ffa726',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '14px',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fb8c00')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffa726')}
        >
          🔓 Unlock Layer
        </button>
      </div>
    );
  }

  if (selectedLayer.type !== 'text') {
    return (
      <div
        style={{
          width: '280px',
          backgroundColor: '#1a1a1a',
          borderRight: '1px solid #3a3a3a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px',
          color: '#888',
          fontSize: '14px',
          textAlign: 'center',
          lineHeight: '1.6',
        }}
      >
        Only text layers can be edited here. Use drag & drop to reposition.
      </div>
    );
  }

  const handleTextChange = async (newText: string) => {
    setTextContent(newText);
  };

  const handleTextBlur = async () => {
    if (textContent !== (selectedLayer as TextLayer).content) {
      await onUpdateLayer(selectedLayer.id, { content: textContent });
    }
  };

  const handleFontSizeChange = async (newSize: number) => {
    setFontSize(newSize);
    await onUpdateLayer(selectedLayer.id, { font_size: newSize });
  };

  const handleFontFamilyChange = async (newFont: string) => {
    setFontFamily(newFont);
    await onUpdateLayer(selectedLayer.id, { font_family: newFont });
  };

  const handleColorChange = async (newColor: string) => {
    setColor(newColor);
    await onUpdateLayer(selectedLayer.id, { color: newColor });
  };

  const fonts = [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Georgia',
    'Courier New',
    'Verdana',
    'Trebuchet MS',
    'Impact',
    'Comic Sans MS',
    'Palatino',
  ];

  return (
    <div
      style={{
        width: '280px',
        backgroundColor: '#1a1a1a',
        borderRight: '1px solid #3a3a3a',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        padding: '20px',
        gap: '24px',
      }}
    >
      {/* Header */}
      <div>
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
          Text Properties
        </h3>
      </div>

      {/* Text Content */}
      <div>
        <label style={{ color: '#bbb', fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>
          Content
        </label>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={textContent}
          onChange={(e) => handleTextChange(e.target.value)}
          onBlur={handleTextBlur}
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              color: 'white',
              backgroundColor: '#2a2a2a',
              '& fieldset': { borderColor: '#3a3a3a' },
              '&:hover fieldset': { borderColor: '#CD1B78' },
              '&.Mui-focused fieldset': { borderColor: '#CD1B78' },
            },
          }}
        />
      </div>

      {/* Font Family */}
      <div>
        <label style={{ color: '#bbb', fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>
          Font Family
        </label>
        <Select
          fullWidth
          value={fontFamily}
          onChange={(e) => handleFontFamilyChange(e.target.value)}
          sx={{
            color: 'white',
            backgroundColor: '#2a2a2a',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#3a3a3a' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#CD1B78' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#CD1B78' },
            '& .MuiSvgIcon-root': { color: 'white' },
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                backgroundColor: '#2a2a2a',
                color: 'white',
                '& .MuiMenuItem-root': {
                  '&:hover': { backgroundColor: '#3a3a3a' },
                },
              },
            },
          }}
        >
          {fonts.map((font) => (
            <MenuItem key={font} value={font} style={{ fontFamily: font }}>
              {font}
            </MenuItem>
          ))}
        </Select>
      </div>

      {/* Font Size */}
      <div>
        <label style={{ color: '#bbb', fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>
          Font Size: {fontSize}px
        </label>
        <Slider
          value={fontSize}
          onChange={(e, value) => setFontSize(value as number)}
          onChangeCommitted={(e, value) => handleFontSizeChange(value as number)}
          min={12}
          max={120}
          step={1}
          sx={{
            color: '#CD1B78',
            '& .MuiSlider-thumb': {
              backgroundColor: '#CD1B78',
              '&:hover, &.Mui-focusVisible': { boxShadow: '0 0 0 8px rgba(205, 27, 120, 0.16)' },
            },
            '& .MuiSlider-track': { backgroundColor: '#CD1B78' },
            '& .MuiSlider-rail': { backgroundColor: '#3a3a3a' },
          }}
        />
      </div>

      {/* Color */}
      <div>
        <label style={{ color: '#bbb', fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>
          Color
        </label>
        <div
          onClick={() => setShowColorPicker(!showColorPicker)}
          style={{
            width: '100%',
            height: '44px',
            backgroundColor: color,
            borderRadius: '8px',
            border: '2px solid #3a3a3a',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 600,
            textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            transition: 'border-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#CD1B78')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#3a3a3a')}
        >
          {color.toUpperCase()}
        </div>

        {showColorPicker && (
          <div style={{ marginTop: '12px' }}>
            <HexColorPicker color={color} onChange={handleColorChange} style={{ width: '100%' }} />
          </div>
        )}
      </div>

      {/* Position Info */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: '24px',
          borderTop: '1px solid #3a3a3a',
          fontSize: '12px',
          color: '#888',
        }}
      >
        <div style={{ marginBottom: '8px' }}>
          <strong>Position:</strong> x: {Math.round(selectedLayer.x || 0)}, y: {Math.round(selectedLayer.y || 0)}
        </div>
        {selectedLayer.width && selectedLayer.height && (
          <div>
            <strong>Size:</strong> {Math.round(selectedLayer.width)} × {Math.round(selectedLayer.height)}
          </div>
        )}
      </div>
    </div>
  );
};

export default CanvasPropertyPanel;
