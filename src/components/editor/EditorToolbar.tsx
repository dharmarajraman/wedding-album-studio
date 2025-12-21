import { 
  MousePointer2, 
  Move, 
  Grid3X3, 
  Wand2, 
  Download, 
  ZoomIn, 
  ZoomOut,
  RotateCcw,
  Maximize,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Toggle } from '@/components/ui/toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type EditorTool = 'select' | 'pan';

interface EditorToolbarProps {
  activeTool: EditorTool;
  onToolChange: (tool: EditorTool) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onZoomFit: () => void;
  showGutter: boolean;
  onToggleGutter: () => void;
  onAutoLayout: () => void;
  onExport: () => void;
  hasSelectedPhotos: boolean;
}

export function EditorToolbar({
  activeTool,
  onToolChange,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onZoomFit,
  showGutter,
  onToggleGutter,
  onAutoLayout,
  onExport,
  hasSelectedPhotos,
}: EditorToolbarProps) {
  return (
    <div className="h-12 bg-surface-1 border-b border-border flex items-center px-3 gap-2">
      {/* Tool Selection */}
      <div className="flex items-center gap-1 bg-surface-2 rounded-md p-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                activeTool === 'select' && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
              onClick={() => onToolChange('select')}
            >
              <MousePointer2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Select (V)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                activeTool === 'pan' && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
              onClick={() => onToolChange('pan')}
            >
              <Move className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Pan (H)</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom Out</TooltipContent>
        </Tooltip>

        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 px-2 min-w-[60px] text-xs font-medium"
          onClick={onZoomReset}
        >
          {Math.round(zoom * 100)}%
        </Button>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom In</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onZoomFit}>
              <Maximize className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Fit to Screen</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* View Options */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Toggle
            pressed={showGutter}
            onPressedChange={onToggleGutter}
            size="sm"
            className="h-8 gap-1 data-[state=on]:bg-gutter-zone/20 data-[state=on]:text-gutter-zone"
          >
            {showGutter ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            Gutter
          </Toggle>
        </TooltipTrigger>
        <TooltipContent>Toggle Gutter Zone Visibility</TooltipContent>
      </Tooltip>

      <div className="flex-1" />

      {/* Actions */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-2"
            onClick={onAutoLayout}
            disabled={!hasSelectedPhotos}
          >
            <Wand2 className="w-4 h-4" />
            Auto Layout
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {hasSelectedPhotos 
            ? 'Auto-arrange selected photos into spreads' 
            : 'Select photos first to use auto-layout'}
        </TooltipContent>
      </Tooltip>

      <Button size="sm" className="h-8 gap-2" onClick={onExport}>
        <Download className="w-4 h-4" />
        Export
      </Button>
    </div>
  );
}
