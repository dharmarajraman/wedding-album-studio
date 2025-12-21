import { useState } from 'react';
import { Album, Spread, getCanvasDimensions } from '@/types/album';
import { getPhotoBlob } from '@/lib/storage';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Download, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  album: Album;
  spreads: Spread[];
  currentSpreadIndex: number;
  photoUrls: Map<string, string>;
}

type ExportFormat = 'png' | 'jpeg';
type ExportScope = 'current' | 'all';

export function ExportDialog({
  open,
  onOpenChange,
  album,
  spreads,
  currentSpreadIndex,
  photoUrls,
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('jpeg');
  const [scope, setScope] = useState<ExportScope>('current');
  const [quality, setQuality] = useState(0.95);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);

  const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions(album);
  const spreadsToExport = scope === 'current' ? 1 : spreads.length;

  const handleExport = async () => {
    setIsExporting(true);
    setProgress(0);
    setCompleted(false);

    const spreadsToProcess = scope === 'current' 
      ? [spreads[currentSpreadIndex]]
      : spreads;

    try {
      for (let i = 0; i < spreadsToProcess.length; i++) {
        const spread = spreadsToProcess[i];
        setProgress(((i) / spreadsToProcess.length) * 100);

        // Create high-res canvas
        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d')!;

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Draw frames
        for (const frame of spread.frames) {
          const photoUrl = photoUrls.get(frame.photoId);
          if (!photoUrl) continue;

          try {
            // Load full-res image from blob
            const blob = await getPhotoBlob(frame.photoId);
            if (!blob) continue;

            const img = await loadImage(URL.createObjectURL(blob));

            ctx.save();
            
            // Create clip path for frame
            ctx.beginPath();
            ctx.rect(frame.x, frame.y, frame.width, frame.height);
            ctx.clip();

            // Calculate scale to fill frame
            const imgAspect = img.width / img.height;
            const frameAspect = frame.width / frame.height;
            
            let scale: number;
            let offsetX = 0;
            let offsetY = 0;
            
            if (imgAspect > frameAspect) {
              scale = frame.height / img.height;
              offsetX = (frame.width - img.width * scale) / 2;
            } else {
              scale = frame.width / img.width;
              offsetY = (frame.height - img.height * scale) / 2;
            }

            // Apply rotation
            if (frame.rotation !== 0) {
              ctx.translate(frame.x + frame.width / 2, frame.y + frame.height / 2);
              ctx.rotate((frame.rotation * Math.PI) / 180);
              ctx.translate(-(frame.x + frame.width / 2), -(frame.y + frame.height / 2));
            }

            // Apply brightness/contrast via filter
            if (frame.brightness !== 0 || frame.contrast !== 0) {
              ctx.filter = `brightness(${1 + frame.brightness / 100}) contrast(${1 + frame.contrast / 100})`;
            }

            // Draw image
            ctx.drawImage(
              img,
              frame.x + offsetX + frame.imageOffsetX,
              frame.y + offsetY + frame.imageOffsetY,
              img.width * scale * frame.imageScale,
              img.height * scale * frame.imageScale
            );

            ctx.restore();
          } catch (error) {
            console.error('Failed to draw frame:', frame.id, error);
          }
        }

        // Export
        const dataUrl = canvas.toDataURL(
          format === 'png' ? 'image/png' : 'image/jpeg',
          format === 'jpeg' ? quality : undefined
        );

        // Download
        const link = document.createElement('a');
        link.download = `${album.name.replace(/[^a-z0-9]/gi, '_')}_spread_${scope === 'current' ? currentSpreadIndex + 1 : i + 1}.${format}`;
        link.href = dataUrl;
        link.click();

        setProgress(((i + 1) / spreadsToProcess.length) * 100);
      }

      setCompleted(true);
      toast.success(`Exported ${spreadsToExport} spread${spreadsToExport !== 1 ? 's' : ''} successfully!`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle>Export Spreads</DialogTitle>
          <DialogDescription>
            Export high-resolution print-ready images
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Export Scope */}
          <div className="space-y-3">
            <Label>What to export</Label>
            <RadioGroup value={scope} onValueChange={(v) => setScope(v as ExportScope)}>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="current" id="current" />
                  <Label htmlFor="current" className="cursor-pointer">
                    Current spread only
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="cursor-pointer">
                    All spreads ({spreads.length})
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Format */}
          <div className="space-y-3">
            <Label>Format</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="jpeg" id="jpeg" />
                  <Label htmlFor="jpeg" className="cursor-pointer">
                    JPEG <span className="text-muted-foreground">(smaller file)</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="png" id="png" />
                  <Label htmlFor="png" className="cursor-pointer">
                    PNG <span className="text-muted-foreground">(lossless)</span>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Resolution Info */}
          <div className="bg-surface-2 rounded-lg p-4">
            <h4 className="text-sm font-medium mb-2">Export Resolution</h4>
            <p className="text-sm text-muted-foreground">
              {canvasWidth} × {canvasHeight} pixels @ {album.dpi} DPI
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Print size: {album.size.width}" × {album.size.height}"
            </p>
          </div>

          {/* Progress */}
          {isExporting && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground text-center">
                Exporting... {Math.round(progress)}%
              </p>
            </div>
          )}

          {/* Completed */}
          {completed && (
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm">Export completed!</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {completed ? 'Close' : 'Cancel'}
          </Button>
          {!completed && (
            <Button onClick={handleExport} disabled={isExporting} className="gap-2">
              <Download className="w-4 h-4" />
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
