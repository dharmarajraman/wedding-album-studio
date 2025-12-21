import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas as FabricCanvas, FabricImage, Rect, util } from 'fabric';
import { PhotoFrame, Photo, Album, getCanvasDimensions, getGutterPixels } from '@/types/album';
import { getPhotoBlob } from '@/lib/storage';

interface SpreadCanvasProps {
  album: Album;
  frames: PhotoFrame[];
  photos: Photo[];
  selectedFrameId: string | null;
  onSelectFrame: (frameId: string | null) => void;
  onUpdateFrame: (frameId: string, updates: Partial<PhotoFrame>) => void;
  zoom: number;
  showGutter: boolean;
  activeTool: 'select' | 'pan';
}

export function SpreadCanvas({
  album,
  frames,
  photos,
  selectedFrameId,
  onSelectFrame,
  onUpdateFrame,
  zoom,
  showGutter,
  activeTool,
}: SpreadCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<Map<string, string>>(new Map());

  const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions(album);
  const gutterWidth = getGutterPixels(album);

  // Scale canvas to fit in viewport
  const displayScale = Math.min(
    ((containerRef.current?.clientWidth || 800) - 80) / canvasWidth,
    ((containerRef.current?.clientHeight || 600) - 80) / canvasHeight,
    0.5 // Max scale to prevent huge canvas
  );

  const displayWidth = canvasWidth * displayScale * zoom;
  const displayHeight = canvasHeight * displayScale * zoom;

  // Load photo blobs
  useEffect(() => {
    const loadPhotos = async () => {
      const urls = new Map<string, string>();
      for (const photo of photos) {
        try {
          const blob = await getPhotoBlob(photo.id);
          if (blob) {
            urls.set(photo.id, URL.createObjectURL(blob));
          }
        } catch (error) {
          console.error('Failed to load photo:', photo.id, error);
        }
      }
      setPhotoUrls(urls);
    };
    loadPhotos();

    return () => {
      photoUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [photos]);

  // Initialize Fabric canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: displayWidth,
      height: displayHeight,
      backgroundColor: '#ffffff',
      selection: activeTool === 'select',
    });

    canvas.setZoom(displayScale * zoom);
    fabricRef.current = canvas;
    setIsLoaded(true);

    // Event handlers
    canvas.on('selection:created', (e) => {
      const selected = e.selected?.[0] as any;
      if (selected && selected.data?.frameId) {
        onSelectFrame(selected.data.frameId);
      }
    });

    canvas.on('selection:cleared', () => {
      onSelectFrame(null);
    });

    canvas.on('object:modified', (e) => {
      const obj = e.target as any;
      if (obj && obj.data?.frameId) {
        onUpdateFrame(obj.data.frameId, {
          x: obj.left || 0,
          y: obj.top || 0,
          width: (obj.width || 100) * (obj.scaleX || 1),
          height: (obj.height || 100) * (obj.scaleY || 1),
          rotation: obj.angle || 0,
        });
      }
    });

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, [displayWidth, displayHeight, displayScale, zoom]);

  // Sync frames to canvas
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !isLoaded) return;

    // Clear canvas
    canvas.clear();
    canvas.backgroundColor = '#ffffff';

    // Draw gutter zone
    if (showGutter && album.gutter.enabled && gutterWidth > 0) {
      const gutterRect = new Rect({
        left: (canvasWidth - gutterWidth) / 2,
        top: 0,
        width: gutterWidth,
        height: canvasHeight,
        fill: 'rgba(239, 68, 68, 0.1)',
        stroke: 'rgba(239, 68, 68, 0.4)',
        strokeWidth: 1,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
      });
      canvas.add(gutterRect);
    }

    // Add frames with images
    frames.forEach(async (frame) => {
      const photoUrl = photoUrls.get(frame.photoId);
      
      if (photoUrl) {
        try {
          const img = await FabricImage.fromURL(photoUrl, { crossOrigin: 'anonymous' });
          
          // Calculate scale to fill frame
          const imgAspect = img.width! / img.height!;
          const frameAspect = frame.width / frame.height;
          
          let scale: number;
          if (imgAspect > frameAspect) {
            scale = frame.height / img.height!;
          } else {
            scale = frame.width / img.width!;
          }
          
          img.set({
            left: frame.x,
            top: frame.y,
            scaleX: scale * frame.imageScale,
            scaleY: scale * frame.imageScale,
            angle: frame.rotation,
            clipPath: new Rect({
              left: frame.x,
              top: frame.y,
              width: frame.width,
              height: frame.height,
              absolutePositioned: true,
            }),
            data: { frameId: frame.id },
            selectable: !frame.locked && activeTool === 'select',
            hasControls: !frame.locked,
            lockMovementX: frame.locked,
            lockMovementY: frame.locked,
          });

          // Apply filters for adjustments
          if (frame.brightness !== 0 || frame.contrast !== 0) {
            // Apply CSS filters as Fabric.js filters would require more complex setup
            img.set({
              opacity: 1 + frame.brightness / 200,
            });
          }

          canvas.add(img);
          
          if (frame.id === selectedFrameId) {
            canvas.setActiveObject(img);
          }
        } catch (error) {
          console.error('Failed to load image:', frame.photoId, error);
          // Add placeholder rect
          const placeholder = new Rect({
            left: frame.x,
            top: frame.y,
            width: frame.width,
            height: frame.height,
            fill: '#2a2a3a',
            stroke: '#3a3a4a',
            strokeWidth: 2,
            angle: frame.rotation,
            data: { frameId: frame.id },
            selectable: !frame.locked && activeTool === 'select',
          });
          canvas.add(placeholder);
        }
      } else {
        // Placeholder for frames without images
        const placeholder = new Rect({
          left: frame.x,
          top: frame.y,
          width: frame.width,
          height: frame.height,
          fill: '#2a2a3a',
          stroke: '#3a3a4a',
          strokeWidth: 2,
          strokeDashArray: [10, 5],
          angle: frame.rotation,
          data: { frameId: frame.id },
          selectable: !frame.locked && activeTool === 'select',
        });
        canvas.add(placeholder);
      }
    });

    canvas.renderAll();
  }, [frames, photoUrls, isLoaded, selectedFrameId, showGutter, album, activeTool]);

  // Update zoom
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    
    canvas.setZoom(displayScale * zoom);
    canvas.setDimensions({
      width: displayWidth,
      height: displayHeight,
    });
    canvas.renderAll();
  }, [zoom, displayScale, displayWidth, displayHeight]);

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-auto bg-canvas-bg workspace-grid flex items-center justify-center p-10"
    >
      <div 
        className="relative shadow-lg border border-canvas-border rounded-sm"
        style={{ width: displayWidth, height: displayHeight }}
      >
        <canvas ref={canvasRef} />
        
        {/* Canvas info overlay */}
        <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs text-muted-foreground">
          {canvasWidth} × {canvasHeight}px @ {album.dpi} DPI
        </div>
      </div>
    </div>
  );
}
