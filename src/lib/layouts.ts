// Smart Auto-Layout Engine for Album Spreads
import { v4 as uuidv4 } from 'uuid';
import { PhotoFrame, Photo, Album, getCanvasDimensions, getGutterPixels, createDefaultPhotoFrame } from '@/types/album';

export interface LayoutTemplate {
  id: string;
  name: string;
  photoCount: number;
  // Function that generates frames based on canvas dimensions
  generateFrames: (canvasWidth: number, canvasHeight: number, gutterWidth: number, margin: number) => Omit<PhotoFrame, 'id' | 'photoId'>[];
}

const MARGIN = 60; // Default margin in pixels for preview (will be scaled for actual DPI)
const SPACING = 20; // Spacing between photos

// Layout templates for different photo counts
export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  {
    id: 'single-full',
    name: 'Single Full Bleed',
    photoCount: 1,
    generateFrames: (w, h, gutter) => [{
      x: 0,
      y: 0,
      width: w,
      height: h,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      imageOffsetX: 0,
      imageOffsetY: 0,
      imageScale: 1,
      locked: false,
      zIndex: 0,
      brightness: 0,
      contrast: 0,
      temperature: 0,
      vibrance: 0,
    }],
  },
  {
    id: 'two-side-by-side',
    name: 'Two Side by Side',
    photoCount: 2,
    generateFrames: (w, h, gutter, margin) => {
      const halfWidth = (w - gutter) / 2 - margin;
      const frameHeight = h - margin * 2;
      return [
        {
          x: margin,
          y: margin,
          width: halfWidth - SPACING / 2,
          height: frameHeight,
          rotation: 0, scaleX: 1, scaleY: 1, imageOffsetX: 0, imageOffsetY: 0, imageScale: 1, locked: false, zIndex: 0,
          brightness: 0, contrast: 0, temperature: 0, vibrance: 0,
        },
        {
          x: w / 2 + gutter / 2 + SPACING / 2,
          y: margin,
          width: halfWidth - SPACING / 2,
          height: frameHeight,
          rotation: 0, scaleX: 1, scaleY: 1, imageOffsetX: 0, imageOffsetY: 0, imageScale: 1, locked: false, zIndex: 1,
          brightness: 0, contrast: 0, temperature: 0, vibrance: 0,
        },
      ];
    },
  },
  {
    id: 'three-one-two',
    name: 'One Large + Two Small',
    photoCount: 3,
    generateFrames: (w, h, gutter, margin) => {
      const leftWidth = (w - gutter) / 2 - margin;
      const rightWidth = (w - gutter) / 2 - margin;
      const smallHeight = (h - margin * 2 - SPACING) / 2;
      return [
        {
          x: margin,
          y: margin,
          width: leftWidth - SPACING / 2,
          height: h - margin * 2,
          rotation: 0, scaleX: 1, scaleY: 1, imageOffsetX: 0, imageOffsetY: 0, imageScale: 1, locked: false, zIndex: 0,
          brightness: 0, contrast: 0, temperature: 0, vibrance: 0,
        },
        {
          x: w / 2 + gutter / 2 + SPACING / 2,
          y: margin,
          width: rightWidth - SPACING / 2,
          height: smallHeight,
          rotation: 0, scaleX: 1, scaleY: 1, imageOffsetX: 0, imageOffsetY: 0, imageScale: 1, locked: false, zIndex: 1,
          brightness: 0, contrast: 0, temperature: 0, vibrance: 0,
        },
        {
          x: w / 2 + gutter / 2 + SPACING / 2,
          y: margin + smallHeight + SPACING,
          width: rightWidth - SPACING / 2,
          height: smallHeight,
          rotation: 0, scaleX: 1, scaleY: 1, imageOffsetX: 0, imageOffsetY: 0, imageScale: 1, locked: false, zIndex: 2,
          brightness: 0, contrast: 0, temperature: 0, vibrance: 0,
        },
      ];
    },
  },
  {
    id: 'four-grid',
    name: 'Four Grid',
    photoCount: 4,
    generateFrames: (w, h, gutter, margin) => {
      const halfWidth = (w - gutter) / 2 - margin - SPACING / 2;
      const halfHeight = (h - margin * 2 - SPACING) / 2;
      return [
        {
          x: margin,
          y: margin,
          width: halfWidth / 2 - SPACING / 4,
          height: halfHeight,
          rotation: 0, scaleX: 1, scaleY: 1, imageOffsetX: 0, imageOffsetY: 0, imageScale: 1, locked: false, zIndex: 0,
          brightness: 0, contrast: 0, temperature: 0, vibrance: 0,
        },
        {
          x: margin + halfWidth / 2 + SPACING / 2,
          y: margin,
          width: halfWidth / 2 - SPACING / 4,
          height: halfHeight,
          rotation: 0, scaleX: 1, scaleY: 1, imageOffsetX: 0, imageOffsetY: 0, imageScale: 1, locked: false, zIndex: 1,
          brightness: 0, contrast: 0, temperature: 0, vibrance: 0,
        },
        {
          x: w / 2 + gutter / 2 + SPACING / 2,
          y: margin,
          width: halfWidth / 2 - SPACING / 4,
          height: halfHeight,
          rotation: 0, scaleX: 1, scaleY: 1, imageOffsetX: 0, imageOffsetY: 0, imageScale: 1, locked: false, zIndex: 2,
          brightness: 0, contrast: 0, temperature: 0, vibrance: 0,
        },
        {
          x: w / 2 + gutter / 2 + SPACING / 2 + halfWidth / 2 + SPACING / 2,
          y: margin,
          width: halfWidth / 2 - SPACING / 4,
          height: halfHeight,
          rotation: 0, scaleX: 1, scaleY: 1, imageOffsetX: 0, imageOffsetY: 0, imageScale: 1, locked: false, zIndex: 3,
          brightness: 0, contrast: 0, temperature: 0, vibrance: 0,
        },
      ];
    },
  },
  {
    id: 'six-mosaic',
    name: 'Six Mosaic',
    photoCount: 6,
    generateFrames: (w, h, gutter, margin) => {
      const leftWidth = (w - gutter) / 2 - margin;
      const rightWidth = (w - gutter) / 2 - margin;
      const thirdHeight = (h - margin * 2 - SPACING * 2) / 3;
      const halfHeight = (h - margin * 2 - SPACING) / 2;
      
      return [
        // Left side - 3 stacked
        {
          x: margin,
          y: margin,
          width: leftWidth / 2 - SPACING / 2,
          height: thirdHeight,
          rotation: 0, scaleX: 1, scaleY: 1, imageOffsetX: 0, imageOffsetY: 0, imageScale: 1, locked: false, zIndex: 0,
          brightness: 0, contrast: 0, temperature: 0, vibrance: 0,
        },
        {
          x: margin,
          y: margin + thirdHeight + SPACING,
          width: leftWidth / 2 - SPACING / 2,
          height: thirdHeight,
          rotation: 0, scaleX: 1, scaleY: 1, imageOffsetX: 0, imageOffsetY: 0, imageScale: 1, locked: false, zIndex: 1,
          brightness: 0, contrast: 0, temperature: 0, vibrance: 0,
        },
        {
          x: margin,
          y: margin + thirdHeight * 2 + SPACING * 2,
          width: leftWidth / 2 - SPACING / 2,
          height: thirdHeight,
          rotation: 0, scaleX: 1, scaleY: 1, imageOffsetX: 0, imageOffsetY: 0, imageScale: 1, locked: false, zIndex: 2,
          brightness: 0, contrast: 0, temperature: 0, vibrance: 0,
        },
        // Left side - 1 tall
        {
          x: margin + leftWidth / 2 + SPACING / 2,
          y: margin,
          width: leftWidth / 2 - SPACING,
          height: h - margin * 2,
          rotation: 0, scaleX: 1, scaleY: 1, imageOffsetX: 0, imageOffsetY: 0, imageScale: 1, locked: false, zIndex: 3,
          brightness: 0, contrast: 0, temperature: 0, vibrance: 0,
        },
        // Right side - 2 stacked
        {
          x: w / 2 + gutter / 2 + SPACING / 2,
          y: margin,
          width: rightWidth - SPACING / 2,
          height: halfHeight,
          rotation: 0, scaleX: 1, scaleY: 1, imageOffsetX: 0, imageOffsetY: 0, imageScale: 1, locked: false, zIndex: 4,
          brightness: 0, contrast: 0, temperature: 0, vibrance: 0,
        },
        {
          x: w / 2 + gutter / 2 + SPACING / 2,
          y: margin + halfHeight + SPACING,
          width: rightWidth - SPACING / 2,
          height: halfHeight,
          rotation: 0, scaleX: 1, scaleY: 1, imageOffsetX: 0, imageOffsetY: 0, imageScale: 1, locked: false, zIndex: 5,
          brightness: 0, contrast: 0, temperature: 0, vibrance: 0,
        },
      ];
    },
  },
];

// Get appropriate layout for number of photos
export function getLayoutForPhotoCount(count: number): LayoutTemplate {
  const exact = LAYOUT_TEMPLATES.find(t => t.photoCount === count);
  if (exact) return exact;
  
  // Find closest layout
  const sorted = [...LAYOUT_TEMPLATES].sort((a, b) => 
    Math.abs(a.photoCount - count) - Math.abs(b.photoCount - count)
  );
  return sorted[0];
}

// Generate frames for a layout with actual photos
export function generateFramesForLayout(
  template: LayoutTemplate,
  photos: Photo[],
  canvasWidth: number,
  canvasHeight: number,
  gutterWidth: number,
  margin: number = MARGIN
): PhotoFrame[] {
  const templateFrames = template.generateFrames(canvasWidth, canvasHeight, gutterWidth, margin);
  
  return templateFrames.slice(0, photos.length).map((frame, index) => ({
    ...frame,
    id: uuidv4(),
    photoId: photos[index]?.id || '',
  }));
}

// Auto-generate spreads from selected photos
export function autoGenerateSpreads(
  photos: Photo[],
  photosPerSpread: number,
  album: Album
): { frames: PhotoFrame[] }[] {
  const { width, height } = getCanvasDimensions(album);
  const gutterWidth = getGutterPixels(album);
  const margin = Math.round(album.dpi * 0.2); // 0.2 inch margin
  
  const spreads: { frames: PhotoFrame[] }[] = [];
  
  for (let i = 0; i < photos.length; i += photosPerSpread) {
    const spreadPhotos = photos.slice(i, i + photosPerSpread);
    const template = getLayoutForPhotoCount(spreadPhotos.length);
    const frames = generateFramesForLayout(template, spreadPhotos, width, height, gutterWidth, margin);
    spreads.push({ frames });
  }
  
  return spreads;
}
