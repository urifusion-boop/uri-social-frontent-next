'use client';

/**
 * Canvas Editor Main Component
 *
 * Full-screen canvas editor with Konva.js for editing layered documents
 */

import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer as KonvaLayer, Image as KonvaImage, Text as KonvaText, Transformer } from 'react-konva';
import Konva from 'konva';
import { useCanvasEditor } from './hooks/useCanvasEditor';
import { Layer, TextLayer, BackgroundLayer, BrandAssetLayer } from '@/src/types/canvas.types';
import { CircularProgress, Box } from '@mui/material';
import CanvasToolbar from './CanvasToolbar';
import CanvasLayerPanel from './CanvasLayerPanel';
import CanvasPropertyPanel from './CanvasPropertyPanel';

interface CanvasEditorProps {
  draftId: string;
  onClose: () => void;
  onSave?: (imageUrl: string) => void;
}

const CanvasEditor: React.FC<CanvasEditorProps> = ({ draftId, onClose, onSave }) => {
  const {
    document,
    selectedLayerId,
    loading,
    error,
    updateLayer,
    selectLayer,
    undo,
    redo,
    canUndo,
    canRedo,
    deleteLayer,
    toggleLayerVisibility,
    renderDocument,
    isRendering,
  } = useCanvasEditor(draftId);

  const [images, setImages] = useState<Record<string, HTMLImageElement>>({});
  const stageRef = useRef<Konva.Stage | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const [selectedNode, setSelectedNode] = useState<Konva.Node | null>(null);

  /**
   * Load images for background and brand assets
   */
  useEffect(() => {
    if (!document) return;

    const loadImages = async () => {
      const imagePromises = document.layers
        .filter((layer) => layer.type === 'ai_generated_background' || layer.type === 'brand_asset')
        .map((layer) => {
          return new Promise<{ id: string; image: HTMLImageElement }>((resolve) => {
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve({ id: layer.id, image: img });
            img.onerror = () => resolve({ id: layer.id, image: img }); // Resolve even on error
            img.src = (layer as BackgroundLayer | BrandAssetLayer).url;
          });
        });

      const loadedImages = await Promise.all(imagePromises);
      const imageMap: Record<string, HTMLImageElement> = {};
      loadedImages.forEach(({ id, image }) => {
        imageMap[id] = image;
      });
      setImages(imageMap);
    };

    loadImages();
  }, [document]);

  /**
   * Attach transformer to selected node
   */
  useEffect(() => {
    if (!transformerRef.current || !selectedNode) return;

    transformerRef.current.nodes([selectedNode]);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedNode]);

  /**
   * Handle layer click
   */
  const handleLayerClick = (layer: Layer, node: Konva.Node) => {
    // Allow selecting locked layers (user can view properties and unlock them)
    // But prevent dragging/transforming (handled by draggable prop)
    selectLayer(layer.id);

    // Only attach transformer to unlocked layers
    if (!layer.locked) {
      setSelectedNode(node);
    } else {
      setSelectedNode(null);
    }
  };

  /**
   * Handle drag end - update layer position
   */
  const handleDragEnd = async (layer: Layer, e: Konva.KonvaEventObject<DragEvent>) => {
    await updateLayer(layer.id, {
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  /**
   * Handle transform end - update layer size/rotation
   */
  const handleTransformEnd = async (layer: Layer, e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale and apply to width/height
    node.scaleX(1);
    node.scaleY(1);

    await updateLayer(layer.id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
      rotation: node.rotation(),
    });
  };

  /**
   * Handle background click - deselect
   */
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (e.target === e.target.getStage()) {
      selectLayer(null);
      setSelectedNode(null);
    }
  };

  /**
   * Render text layer
   */
  const renderTextLayer = (layer: TextLayer) => {
    return (
      <KonvaText
        key={layer.id}
        id={layer.id}
        text={layer.content}
        x={layer.x || 0}
        y={layer.y || 0}
        fontSize={layer.font_size}
        fontFamily={layer.font_family}
        fill={layer.color}
        fontStyle={layer.font_weight && layer.font_weight > 400 ? 'bold' : 'normal'}
        align={layer.align || 'left'}
        width={layer.width}
        draggable={!layer.locked}
        visible={layer.visible}
        onClick={(e) => handleLayerClick(layer, e.target)}
        onTap={(e) => handleLayerClick(layer, e.target)}
        onDragEnd={(e) => handleDragEnd(layer, e)}
        onTransformEnd={(e) => handleTransformEnd(layer, e)}
      />
    );
  };

  /**
   * Render background layer
   */
  const renderBackgroundLayer = (layer: BackgroundLayer) => {
    const image = images[layer.id];
    if (!image) return null;

    return (
      <KonvaImage
        key={layer.id}
        id={layer.id}
        image={image}
        x={layer.x || 0}
        y={layer.y || 0}
        width={layer.width || document?.canvas.width || 1080}
        height={layer.height || document?.canvas.height || 1080}
        draggable={!layer.locked}
        visible={layer.visible}
        onClick={(e) => handleLayerClick(layer, e.target)}
        onTap={(e) => handleLayerClick(layer, e.target)}
        onDragEnd={(e) => handleDragEnd(layer, e)}
      />
    );
  };

  /**
   * Render brand asset layer
   */
  const renderBrandAssetLayer = (layer: BrandAssetLayer) => {
    const image = images[layer.id];
    if (!image) return null;

    return (
      <KonvaImage
        key={layer.id}
        id={layer.id}
        image={image}
        x={layer.x || 0}
        y={layer.y || 0}
        width={layer.width || 100}
        height={layer.height || 100}
        draggable={!layer.locked}
        visible={layer.visible}
        onClick={(e) => handleLayerClick(layer, e.target)}
        onTap={(e) => handleLayerClick(layer, e.target)}
        onDragEnd={(e) => handleDragEnd(layer, e)}
        onTransformEnd={(e) => handleTransformEnd(layer, e)}
      />
    );
  };

  /**
   * Render layer based on type
   */
  const renderLayer = (layer: Layer) => {
    switch (layer.type) {
      case 'text':
        return renderTextLayer(layer as TextLayer);
      case 'ai_generated_background':
        return renderBackgroundLayer(layer as BackgroundLayer);
      case 'brand_asset':
        return renderBrandAssetLayer(layer as BrandAssetLayer);
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#1a1a1a',
        }}
      >
        <CircularProgress sx={{ color: '#CD1B78' }} />
      </Box>
    );
  }

  if (error || !document) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#1a1a1a',
          color: 'white',
          gap: 2,
        }}
      >
        <p>❌ {error || 'Failed to load canvas document'}</p>
        <button
          onClick={onClose}
          style={{
            padding: '10px 20px',
            backgroundColor: '#CD1B78',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      </Box>
    );
  }

  const canvasWidth = document.canvas.width;
  const canvasHeight = document.canvas.height;

  // Sort layers by z-index (bottom to top)
  const sortedLayers = [...document.layers].sort((a, b) => a.z_index - b.z_index);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#2a2a2a',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Toolbar */}
      <CanvasToolbar
        onClose={onClose}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onRender={renderDocument}
        isRendering={isRendering}
        onSave={onSave}
        draftId={draftId}
      />

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Property Panel (Left) */}
        <CanvasPropertyPanel selectedLayerId={selectedLayerId} document={document} onUpdateLayer={updateLayer} />

        {/* Canvas Area (Center) */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1a1a1a',
            overflow: 'auto',
            padding: '40px',
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <Stage
              width={canvasWidth}
              height={canvasHeight}
              ref={stageRef}
              onClick={handleStageClick}
              onTap={handleStageClick}
            >
              <KonvaLayer>
                {sortedLayers.map((layer) => renderLayer(layer))}

                {/* Transformer for selected layer */}
                {selectedNode && (
                  <Transformer
                    ref={transformerRef}
                    boundBoxFunc={(oldBox, newBox) => {
                      // Limit resize
                      if (newBox.width < 5 || newBox.height < 5) {
                        return oldBox;
                      }
                      return newBox;
                    }}
                  />
                )}
              </KonvaLayer>
            </Stage>
          </div>
        </div>

        {/* Layer Panel (Right) */}
        <CanvasLayerPanel
          document={document}
          selectedLayerId={selectedLayerId}
          onSelectLayer={selectLayer}
          onDeleteLayer={deleteLayer}
          onToggleVisibility={toggleLayerVisibility}
          onUpdateLayer={updateLayer}
        />
      </div>
    </div>
  );
};

export default CanvasEditor;
