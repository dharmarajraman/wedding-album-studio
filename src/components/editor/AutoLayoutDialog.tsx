import { useState } from 'react';
import { Album, Spread, Photo, getCanvasDimensions, getGutterPixels } from '@/types/album';
import { LAYOUT_TEMPLATES, generateFramesForLayout } from '@/lib/layouts';
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
import { Slider } from '@/components/ui/slider';

interface AutoLayoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPhotos: Photo[];
  album: Album;
  onApplyLayout: (frames: { photoId: string; frameData: any }[]) => void;
}

export function AutoLayoutDialog({
  open,
  onOpenChange,
  selectedPhotos,
  album,
  onApplyLayout,
}: AutoLayoutDialogProps) {
  const [photosPerSpread, setPhotosPerSpread] = useState(
    Math.min(selectedPhotos.length, 4)
  );
  const [selectedTemplate, setSelectedTemplate] = useState(
    LAYOUT_TEMPLATES.find(t => t.photoCount === photosPerSpread)?.id || LAYOUT_TEMPLATES[0].id
  );

  const applicableTemplates = LAYOUT_TEMPLATES.filter(
    t => t.photoCount <= selectedPhotos.length
  );

  const spreadsCount = Math.ceil(selectedPhotos.length / photosPerSpread);

  const handleApply = () => {
    const { width, height } = getCanvasDimensions(album);
    const gutterWidth = getGutterPixels(album);
    const margin = Math.round(album.dpi * 0.2);

    const template = LAYOUT_TEMPLATES.find(t => t.id === selectedTemplate);
    if (!template) return;

    const frames = generateFramesForLayout(
      template,
      selectedPhotos.slice(0, template.photoCount),
      width,
      height,
      gutterWidth,
      margin
    );

    const result = frames.map((frame, index) => ({
      photoId: selectedPhotos[index]?.id || '',
      frameData: frame,
    }));

    onApplyLayout(result);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle>Smart Auto Layout</DialogTitle>
          <DialogDescription>
            Automatically arrange {selectedPhotos.length} selected photos into spreads
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Photos per spread */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Photos per spread</Label>
              <span className="text-sm text-muted-foreground">{photosPerSpread}</span>
            </div>
            <Slider
              value={[photosPerSpread]}
              onValueChange={([v]) => {
                setPhotosPerSpread(v);
                // Update template to match
                const matching = LAYOUT_TEMPLATES.find(t => t.photoCount === v);
                if (matching) setSelectedTemplate(matching.id);
              }}
              min={1}
              max={Math.min(6, selectedPhotos.length)}
              step={1}
            />
            <p className="text-xs text-muted-foreground">
              This will create {spreadsCount} spread{spreadsCount !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Layout Template */}
          <div className="space-y-3">
            <Label>Layout Template</Label>
            <RadioGroup value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <div className="grid grid-cols-2 gap-2">
                {applicableTemplates.map((template) => (
                  <div key={template.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={template.id} id={template.id} />
                    <Label htmlFor={template.id} className="cursor-pointer text-sm">
                      {template.name}
                      <span className="text-muted-foreground ml-1">
                        ({template.photoCount} photos)
                      </span>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Preview info */}
          <div className="bg-surface-2 rounded-lg p-4">
            <h4 className="text-sm font-medium mb-2">Layout Preview</h4>
            <div 
              className="bg-surface-3 rounded relative"
              style={{ aspectRatio: `${album.size.width / album.size.height}` }}
            >
              {/* Gutter indicator */}
              {album.gutter.enabled && (
                <div 
                  className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 bg-gutter-warning/20 border-x border-dashed border-gutter-warning/40"
                  style={{ width: `${(album.gutter.widthInches / album.size.width) * 100}%` }}
                />
              )}
              
              {/* Template preview placeholder frames */}
              {LAYOUT_TEMPLATES.find(t => t.id === selectedTemplate)?.generateFrames(
                100, 100 * (album.size.height / album.size.width), 
                (album.gutter.widthInches / album.size.width) * 100,
                5
              ).map((frame, i) => (
                <div
                  key={i}
                  className="absolute bg-primary/30 rounded-sm"
                  style={{
                    left: `${frame.x}%`,
                    top: `${frame.y}%`,
                    width: `${frame.width}%`,
                    height: `${frame.height}%`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply}>
            Apply Layout
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
