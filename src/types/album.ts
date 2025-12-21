// Album Studio Core Types

export interface AlbumSize {
  id: string;
  name: string;
  width: number; // inches
  height: number; // inches
  isPreset: boolean;
}

export const PRESET_SIZES: AlbumSize[] = [
  { id: '12x36', name: '12×36"', width: 36, height: 12, isPreset: true },
  { id: '12x30', name: '12×30"', width: 30, height: 12, isPreset: true },
  { id: '12x24', name: '12×24"', width: 24, height: 12, isPreset: true },
  { id: '12x18', name: '12×18"', width: 18, height: 12, isPreset: true },
  { id: '10x30', name: '10×30"', width: 30, height: 10, isPreset: true },
];

export interface GutterSettings {
  enabled: boolean;
  widthInches: number;
}

export interface Album {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  size: AlbumSize;
  dpi: number;
  gutter: GutterSettings;
  spreadIds: string[];
  coverImageUrl?: string;
}

export interface PhotoFrame {
  id: string;
  photoId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  imageOffsetX: number;
  imageOffsetY: number;
  imageScale: number;
  locked: boolean;
  zIndex: number;
  // Non-destructive adjustments
  brightness: number;
  contrast: number;
  temperature: number;
  vibrance: number;
}

export interface Spread {
  id: string;
  albumId: string;
  orderIndex: number;
  frames: PhotoFrame[];
  createdAt: string;
  updatedAt: string;
}

export interface Photo {
  id: string;
  albumId: string;
  filename: string;
  width: number;
  height: number;
  thumbnailUrl: string; // base64 data URL for thumbnail
  createdAt: string;
}

// Layout Templates
export interface LayoutTemplate {
  id: string;
  name: string;
  photoCount: number;
  frames: Omit<PhotoFrame, 'id' | 'photoId' | 'brightness' | 'contrast' | 'temperature' | 'vibrance'>[];
}

// Utility functions
export function inchesToPixels(inches: number, dpi: number): number {
  return Math.round(inches * dpi);
}

export function pixelsToInches(pixels: number, dpi: number): number {
  return pixels / dpi;
}

export function getCanvasDimensions(album: Album): { width: number; height: number } {
  return {
    width: inchesToPixels(album.size.width, album.dpi),
    height: inchesToPixels(album.size.height, album.dpi),
  };
}

export function getGutterPixels(album: Album): number {
  if (!album.gutter.enabled) return 0;
  return inchesToPixels(album.gutter.widthInches, album.dpi);
}

export function createDefaultPhotoFrame(photoId: string): PhotoFrame {
  return {
    id: '',
    photoId,
    x: 100,
    y: 100,
    width: 400,
    height: 300,
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
  };
}
