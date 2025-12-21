import { useRef, useCallback } from 'react';
import { Photo } from '@/types/album';
import { Upload, Image as ImageIcon, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface PhotoGalleryProps {
  photos: Photo[];
  selectedPhotoIds: string[];
  onSelectPhoto: (photoId: string, multiSelect?: boolean) => void;
  onUploadPhotos: (files: FileList) => void;
  isUploading: boolean;
  uploadProgress: number;
}

export function PhotoGallery({
  photos,
  selectedPhotoIds,
  onSelectPhoto,
  onUploadPhotos,
  isUploading,
  uploadProgress,
}: PhotoGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      onUploadPhotos(e.dataTransfer.files);
    }
  }, [onUploadPhotos]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-foreground">Photos</h3>
          <span className="text-xs text-muted-foreground">{photos.length}</span>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full gap-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload className="w-4 h-4" />
          {isUploading ? `Uploading ${uploadProgress}%` : 'Upload Photos'}
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && onUploadPhotos(e.target.files)}
        />
      </div>

      {/* Progress Bar */}
      {isUploading && (
        <div className="px-3 py-2 bg-surface-2">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Photo Grid */}
      <ScrollArea className="flex-1">
        <div 
          className="p-3"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {photos.length === 0 ? (
            <div 
              className="border-2 border-dashed border-border rounded-lg p-8 text-center"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <ImageIcon className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-1">Drop photos here</p>
              <p className="text-xs text-muted-foreground/70">or click Upload Photos</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo) => {
                const isSelected = selectedPhotoIds.includes(photo.id);
                return (
                  <div
                    key={photo.id}
                    className={cn(
                      "relative aspect-square rounded-md overflow-hidden cursor-pointer group",
                      "border-2 transition-all duration-150",
                      isSelected 
                        ? "border-primary ring-2 ring-primary/30" 
                        : "border-transparent hover:border-muted-foreground/30"
                    )}
                    onClick={(e) => onSelectPhoto(photo.id, e.shiftKey || e.ctrlKey || e.metaKey)}
                  >
                    <img
                      src={photo.thumbnailUrl}
                      alt={photo.filename}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    
                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-xs text-foreground font-medium truncate px-2">
                        {photo.filename}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Selection Info */}
      {selectedPhotoIds.length > 0 && (
        <div className="p-3 border-t border-border bg-surface-2">
          <p className="text-xs text-muted-foreground">
            {selectedPhotoIds.length} photo{selectedPhotoIds.length !== 1 ? 's' : ''} selected
          </p>
        </div>
      )}
    </div>
  );
}
