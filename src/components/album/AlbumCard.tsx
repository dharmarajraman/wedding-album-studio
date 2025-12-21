import { Album } from '@/types/album';
import { formatDistanceToNow } from 'date-fns';
import { MoreHorizontal, Trash2, FolderOpen, Calendar, Maximize } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AlbumCardProps {
  album: Album;
  onClick: () => void;
  onDelete: () => void;
}

export function AlbumCard({ album, onClick, onDelete }: AlbumCardProps) {
  const canvasPixels = `${album.size.width * album.dpi} × ${album.size.height * album.dpi}`;
  
  return (
    <Card 
      className="group bg-card border-border hover:border-primary/50 transition-all duration-200 cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      {/* Thumbnail Area */}
      <div className="aspect-[16/9] bg-surface-2 relative overflow-hidden">
        {album.coverImageUrl ? (
          <img 
            src={album.coverImageUrl} 
            alt={album.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <FolderOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
              <span className="text-xs text-muted-foreground">No spreads yet</span>
            </div>
          </div>
        )}
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground truncate">{album.name}</h3>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Maximize className="w-3 h-3" />
                {album.size.name}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDistanceToNow(new Date(album.updatedAt), { addSuffix: true })}
              </span>
            </div>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {canvasPixels}px @ {album.dpi} DPI
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border">
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
