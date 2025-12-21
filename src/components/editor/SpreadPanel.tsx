import { Spread, Album } from '@/types/album';
import { Plus, Copy, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface SpreadPanelProps {
  spreads: Spread[];
  currentSpreadIndex: number;
  album: Album;
  onSelectSpread: (index: number) => void;
  onAddSpread: () => void;
  onDuplicateSpread: (index: number) => void;
  onDeleteSpread: (index: number) => void;
}

export function SpreadPanel({
  spreads,
  currentSpreadIndex,
  album,
  onSelectSpread,
  onAddSpread,
  onDuplicateSpread,
  onDeleteSpread,
}: SpreadPanelProps) {
  const aspectRatio = album.size.width / album.size.height;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-foreground">Spreads</h3>
          <span className="text-xs text-muted-foreground">{spreads.length}</span>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full gap-2"
          onClick={onAddSpread}
        >
          <Plus className="w-4 h-4" />
          Add Spread
        </Button>
      </div>

      {/* Spread List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {spreads.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-2">No spreads yet</p>
              <p className="text-xs text-muted-foreground/70">
                Add a spread to start designing
              </p>
            </div>
          ) : (
            spreads.map((spread, index) => (
              <div
                key={spread.id}
                className={cn(
                  "group relative rounded-md overflow-hidden cursor-pointer",
                  "border-2 transition-all duration-150",
                  index === currentSpreadIndex
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border hover:border-muted-foreground/30"
                )}
                onClick={() => onSelectSpread(index)}
              >
                {/* Spread Preview */}
                <div 
                  className="bg-surface-2 relative"
                  style={{ aspectRatio: `${aspectRatio}` }}
                >
                  {/* Center fold indicator */}
                  {album.gutter.enabled && (
                    <div 
                      className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 bg-gutter-warning/20 border-x border-dashed border-gutter-warning/40"
                      style={{ width: `${(album.gutter.widthInches / album.size.width) * 100}%` }}
                    />
                  )}
                  
                  {/* Frame indicators */}
                  {spread.frames.map((frame) => (
                    <div
                      key={frame.id}
                      className="absolute bg-primary/30 rounded-sm"
                      style={{
                        left: `${(frame.x / (album.size.width * album.dpi)) * 100}%`,
                        top: `${(frame.y / (album.size.height * album.dpi)) * 100}%`,
                        width: `${(frame.width / (album.size.width * album.dpi)) * 100}%`,
                        height: `${(frame.height / (album.size.height * album.dpi)) * 100}%`,
                      }}
                    />
                  ))}
                  
                  {/* Spread number */}
                  <div className="absolute bottom-1 right-1 bg-background/80 px-1.5 py-0.5 rounded text-xs font-medium">
                    {index + 1}
                  </div>
                </div>

                {/* Actions */}
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateSpread(index);
                    }}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  {spreads.length > 1 && (
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSpread(index);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Navigation */}
      {spreads.length > 0 && (
        <div className="p-3 border-t border-border bg-surface-2">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={currentSpreadIndex === 0}
              onClick={() => onSelectSpread(currentSpreadIndex - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <span className="text-sm text-muted-foreground">
              {currentSpreadIndex + 1} / {spreads.length}
            </span>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={currentSpreadIndex === spreads.length - 1}
              onClick={() => onSelectSpread(currentSpreadIndex + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
