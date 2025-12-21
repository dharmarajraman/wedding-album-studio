import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { PRESET_SIZES, AlbumSize, Album } from '@/types/album';
import { saveAlbum } from '@/lib/storage';
import { toast } from 'sonner';

interface CreateAlbumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateAlbumDialog({ open, onOpenChange }: CreateAlbumDialogProps) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(PRESET_SIZES[0].id);
  const [useCustomSize, setUseCustomSize] = useState(false);
  const [customWidth, setCustomWidth] = useState('24');
  const [customHeight, setCustomHeight] = useState('12');
  const [dpi, setDpi] = useState('300');
  const [gutterEnabled, setGutterEnabled] = useState(true);
  const [gutterWidth, setGutterWidth] = useState('0.25');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Please enter an album name');
      return;
    }

    setIsCreating(true);

    try {
      const size: AlbumSize = useCustomSize
        ? {
            id: 'custom',
            name: `${customHeight}×${customWidth}"`,
            width: parseFloat(customWidth),
            height: parseFloat(customHeight),
            isPreset: false,
          }
        : PRESET_SIZES.find(p => p.id === selectedPreset)!;

      const album: Album = {
        id: uuidv4(),
        name: name.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        size,
        dpi: parseInt(dpi) || 300,
        gutter: {
          enabled: gutterEnabled,
          widthInches: parseFloat(gutterWidth) || 0.25,
        },
        spreadIds: [],
      };

      await saveAlbum(album);
      toast.success('Album created successfully!');
      onOpenChange(false);
      navigate(`/album/${album.id}`);
    } catch (error) {
      console.error('Failed to create album:', error);
      toast.error('Failed to create album');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create New Album</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Configure your album settings. You can change these later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Album Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Album Name</Label>
            <Input
              id="name"
              placeholder="e.g., Sarah & John Wedding"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-surface-2 border-border"
            />
          </div>

          {/* Size Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Album Size</Label>
              <div className="flex items-center gap-2">
                <Label htmlFor="custom-size" className="text-sm text-muted-foreground">
                  Custom
                </Label>
                <Switch
                  id="custom-size"
                  checked={useCustomSize}
                  onCheckedChange={setUseCustomSize}
                />
              </div>
            </div>

            {!useCustomSize ? (
              <RadioGroup value={selectedPreset} onValueChange={setSelectedPreset}>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_SIZES.map((size) => (
                    <div key={size.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={size.id} id={size.id} />
                      <Label htmlFor={size.id} className="cursor-pointer text-sm">
                        {size.name}
                        <span className="text-muted-foreground ml-1">
                          ({size.height}×{size.width})
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-width">Width (inches)</Label>
                  <Input
                    id="custom-width"
                    type="number"
                    min="6"
                    max="48"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(e.target.value)}
                    className="bg-surface-2 border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-height">Height (inches)</Label>
                  <Input
                    id="custom-height"
                    type="number"
                    min="6"
                    max="48"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(e.target.value)}
                    className="bg-surface-2 border-border"
                  />
                </div>
              </div>
            )}
          </div>

          {/* DPI */}
          <div className="space-y-2">
            <Label htmlFor="dpi">Resolution (DPI)</Label>
            <Input
              id="dpi"
              type="number"
              min="72"
              max="600"
              value={dpi}
              onChange={(e) => setDpi(e.target.value)}
              className="bg-surface-2 border-border w-32"
            />
            <p className="text-xs text-muted-foreground">
              300 DPI recommended for print. Canvas will be{' '}
              {useCustomSize 
                ? `${Math.round(parseFloat(customWidth) * parseInt(dpi))}×${Math.round(parseFloat(customHeight) * parseInt(dpi))}`
                : `${Math.round(PRESET_SIZES.find(p => p.id === selectedPreset)!.width * parseInt(dpi))}×${Math.round(PRESET_SIZES.find(p => p.id === selectedPreset)!.height * parseInt(dpi))}`
              } pixels.
            </p>
          </div>

          {/* Gutter Settings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Center Fold / Gutter</Label>
                <p className="text-xs text-muted-foreground">
                  Add a safe zone at the center of spreads
                </p>
              </div>
              <Switch
                checked={gutterEnabled}
                onCheckedChange={setGutterEnabled}
              />
            </div>

            {gutterEnabled && (
              <div className="space-y-2">
                <Label htmlFor="gutter-width">Gutter Width (inches)</Label>
                <Input
                  id="gutter-width"
                  type="number"
                  min="0.1"
                  max="2"
                  step="0.05"
                  value={gutterWidth}
                  onChange={(e) => setGutterWidth(e.target.value)}
                  className="bg-surface-2 border-border w-32"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create Album'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
