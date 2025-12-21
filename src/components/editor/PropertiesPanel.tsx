import { PhotoFrame } from '@/types/album';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Lock, 
  Unlock, 
  Trash2, 
  RotateCcw, 
  ArrowUp, 
  ArrowDown,
  Sun,
  Contrast,
  Thermometer,
  Palette,
} from 'lucide-react';

interface PropertiesPanelProps {
  selectedFrame: PhotoFrame | null;
  onUpdateFrame: (updates: Partial<PhotoFrame>) => void;
  onDeleteFrame: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  canvasWidth: number;
  canvasHeight: number;
}

export function PropertiesPanel({
  selectedFrame,
  onUpdateFrame,
  onDeleteFrame,
  onBringForward,
  onSendBackward,
  canvasWidth,
  canvasHeight,
}: PropertiesPanelProps) {
  if (!selectedFrame) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Select a photo frame to edit its properties
        </p>
      </div>
    );
  }

  const resetAdjustments = () => {
    onUpdateFrame({
      brightness: 0,
      contrast: 0,
      temperature: 0,
      vibrance: 0,
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-border">
        <h3 className="text-sm font-medium text-foreground">Properties</h3>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-6">
        {/* Position & Size */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Transform
          </h4>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">X</Label>
              <Input
                type="number"
                value={Math.round(selectedFrame.x)}
                onChange={(e) => onUpdateFrame({ x: parseInt(e.target.value) || 0 })}
                className="h-8 text-xs bg-surface-2"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Y</Label>
              <Input
                type="number"
                value={Math.round(selectedFrame.y)}
                onChange={(e) => onUpdateFrame({ y: parseInt(e.target.value) || 0 })}
                className="h-8 text-xs bg-surface-2"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Width</Label>
              <Input
                type="number"
                value={Math.round(selectedFrame.width)}
                onChange={(e) => onUpdateFrame({ width: parseInt(e.target.value) || 100 })}
                className="h-8 text-xs bg-surface-2"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Height</Label>
              <Input
                type="number"
                value={Math.round(selectedFrame.height)}
                onChange={(e) => onUpdateFrame({ height: parseInt(e.target.value) || 100 })}
                className="h-8 text-xs bg-surface-2"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Rotation</Label>
            <div className="flex items-center gap-2">
              <Slider
                value={[selectedFrame.rotation]}
                onValueChange={([v]) => onUpdateFrame({ rotation: v })}
                min={-180}
                max={180}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-10 text-right">
                {selectedFrame.rotation}°
              </span>
            </div>
          </div>
        </div>

        <Separator className="bg-border" />

        {/* Layer Controls */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Layer
          </h4>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onBringForward}
              className="flex-1 gap-1"
            >
              <ArrowUp className="w-3 h-3" />
              Forward
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onSendBackward}
              className="flex-1 gap-1"
            >
              <ArrowDown className="w-3 h-3" />
              Backward
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onUpdateFrame({ locked: !selectedFrame.locked })}
            className="w-full gap-2"
          >
            {selectedFrame.locked ? (
              <>
                <Lock className="w-3 h-3" />
                Locked
              </>
            ) : (
              <>
                <Unlock className="w-3 h-3" />
                Unlocked
              </>
            )}
          </Button>
        </div>

        <Separator className="bg-border" />

        {/* Image Adjustments */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Adjustments
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetAdjustments}
              className="h-6 px-2 text-xs"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sun className="w-3.5 h-3.5 text-muted-foreground" />
                <Label className="text-xs flex-1">Brightness</Label>
                <span className="text-xs text-muted-foreground w-8 text-right">
                  {selectedFrame.brightness}
                </span>
              </div>
              <Slider
                value={[selectedFrame.brightness]}
                onValueChange={([v]) => onUpdateFrame({ brightness: v })}
                min={-100}
                max={100}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Contrast className="w-3.5 h-3.5 text-muted-foreground" />
                <Label className="text-xs flex-1">Contrast</Label>
                <span className="text-xs text-muted-foreground w-8 text-right">
                  {selectedFrame.contrast}
                </span>
              </div>
              <Slider
                value={[selectedFrame.contrast]}
                onValueChange={([v]) => onUpdateFrame({ contrast: v })}
                min={-100}
                max={100}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Thermometer className="w-3.5 h-3.5 text-muted-foreground" />
                <Label className="text-xs flex-1">Temperature</Label>
                <span className="text-xs text-muted-foreground w-8 text-right">
                  {selectedFrame.temperature}
                </span>
              </div>
              <Slider
                value={[selectedFrame.temperature]}
                onValueChange={([v]) => onUpdateFrame({ temperature: v })}
                min={-100}
                max={100}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 text-muted-foreground" />
                <Label className="text-xs flex-1">Vibrance</Label>
                <span className="text-xs text-muted-foreground w-8 text-right">
                  {selectedFrame.vibrance}
                </span>
              </div>
              <Slider
                value={[selectedFrame.vibrance]}
                onValueChange={([v]) => onUpdateFrame({ vibrance: v })}
                min={-100}
                max={100}
                step={1}
              />
            </div>
          </div>
        </div>

        <Separator className="bg-border" />

        {/* Delete */}
        <Button
          variant="destructive"
          size="sm"
          onClick={onDeleteFrame}
          className="w-full gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete Frame
        </Button>
      </div>
    </div>
  );
}
