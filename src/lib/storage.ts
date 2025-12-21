// IndexedDB Storage for Smart Album Studio
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Album, Spread, Photo } from '@/types/album';

interface AlbumStudioDB extends DBSchema {
  albums: {
    key: string;
    value: Album;
    indexes: { 'by-updated': string };
  };
  spreads: {
    key: string;
    value: Spread;
    indexes: { 'by-album': string; 'by-order': [string, number] };
  };
  photos: {
    key: string;
    value: Photo;
    indexes: { 'by-album': string };
  };
  photoBlobs: {
    key: string;
    value: {
      id: string;
      blob: Blob;
    };
  };
}

const DB_NAME = 'smart-album-studio';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<AlbumStudioDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<AlbumStudioDB>> {
  if (dbInstance) return dbInstance;
  
  dbInstance = await openDB<AlbumStudioDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Albums store
      const albumStore = db.createObjectStore('albums', { keyPath: 'id' });
      albumStore.createIndex('by-updated', 'updatedAt');
      
      // Spreads store
      const spreadStore = db.createObjectStore('spreads', { keyPath: 'id' });
      spreadStore.createIndex('by-album', 'albumId');
      spreadStore.createIndex('by-order', ['albumId', 'orderIndex']);
      
      // Photos store (metadata only)
      const photoStore = db.createObjectStore('photos', { keyPath: 'id' });
      photoStore.createIndex('by-album', 'albumId');
      
      // Photo blobs store (actual image data)
      db.createObjectStore('photoBlobs', { keyPath: 'id' });
    },
  });
  
  return dbInstance;
}

// Album operations
export async function saveAlbum(album: Album): Promise<void> {
  const db = await getDB();
  await db.put('albums', { ...album, updatedAt: new Date().toISOString() });
}

export async function getAlbum(id: string): Promise<Album | undefined> {
  const db = await getDB();
  return db.get('albums', id);
}

export async function getAllAlbums(): Promise<Album[]> {
  const db = await getDB();
  const albums = await db.getAllFromIndex('albums', 'by-updated');
  return albums.reverse(); // Most recent first
}

export async function deleteAlbum(id: string): Promise<void> {
  const db = await getDB();
  
  // Delete all spreads for this album
  const spreads = await db.getAllFromIndex('spreads', 'by-album', id);
  for (const spread of spreads) {
    await db.delete('spreads', spread.id);
  }
  
  // Delete all photos for this album
  const photos = await db.getAllFromIndex('photos', 'by-album', id);
  for (const photo of photos) {
    await db.delete('photos', photo.id);
    await db.delete('photoBlobs', photo.id);
  }
  
  // Delete the album
  await db.delete('albums', id);
}

// Spread operations
export async function saveSpread(spread: Spread): Promise<void> {
  const db = await getDB();
  await db.put('spreads', { ...spread, updatedAt: new Date().toISOString() });
}

export async function getSpread(id: string): Promise<Spread | undefined> {
  const db = await getDB();
  return db.get('spreads', id);
}

export async function getAlbumSpreads(albumId: string): Promise<Spread[]> {
  const db = await getDB();
  const spreads = await db.getAllFromIndex('spreads', 'by-album', albumId);
  return spreads.sort((a, b) => a.orderIndex - b.orderIndex);
}

export async function deleteSpread(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('spreads', id);
}

// Photo operations
export async function savePhoto(photo: Photo, blob: Blob): Promise<void> {
  const db = await getDB();
  await db.put('photos', photo);
  await db.put('photoBlobs', { id: photo.id, blob });
}

export async function getPhoto(id: string): Promise<Photo | undefined> {
  const db = await getDB();
  return db.get('photos', id);
}

export async function getPhotoBlob(id: string): Promise<Blob | undefined> {
  const db = await getDB();
  const record = await db.get('photoBlobs', id);
  return record?.blob;
}

export async function getAlbumPhotos(albumId: string): Promise<Photo[]> {
  const db = await getDB();
  return db.getAllFromIndex('photos', 'by-album', albumId);
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('photos', id);
  await db.delete('photoBlobs', id);
}

// Utility to create thumbnail from image
export async function createThumbnail(file: File, maxSize: number = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Get image dimensions from file
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
