import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Album } from '@/types/album';
import { getAllAlbums, deleteAlbum } from '@/lib/storage';
import { AlbumCard } from '@/components/album/AlbumCard';
import { CreateAlbumDialog } from '@/components/album/CreateAlbumDialog';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Dashboard() {
  const navigate = useNavigate();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [albumToDelete, setAlbumToDelete] = useState<Album | null>(null);

  useEffect(() => {
    loadAlbums();
  }, []);

  const loadAlbums = async () => {
    try {
      const loadedAlbums = await getAllAlbums();
      setAlbums(loadedAlbums);
    } catch (error) {
      console.error('Failed to load albums:', error);
      toast.error('Failed to load albums');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAlbum = async () => {
    if (!albumToDelete) return;

    try {
      await deleteAlbum(albumToDelete.id);
      setAlbums(prev => prev.filter(a => a.id !== albumToDelete.id));
      toast.success('Album deleted');
    } catch (error) {
      console.error('Failed to delete album:', error);
      toast.error('Failed to delete album');
    } finally {
      setAlbumToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface-1">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Smart Album Studio</h1>
                <p className="text-sm text-muted-foreground">Professional Wedding Album Designer</p>
              </div>
            </div>

            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              New Album
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-muted-foreground">Loading albums...</div>
          </div>
        ) : albums.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="w-20 h-20 rounded-2xl bg-surface-2 flex items-center justify-center mb-6">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">Create Your First Album</h2>
            <p className="text-muted-foreground max-w-md mb-8">
              Design stunning wedding albums with smart auto-layouts, precise editing tools, 
              and high-resolution exports ready for print.
            </p>
            <Button size="lg" onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="w-5 h-5" />
              Create Album
            </Button>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl">
              <FeatureCard
                title="Smart Layouts"
                description="Auto-arrange photos into beautiful spreads with one click"
              />
              <FeatureCard
                title="Precise Control"
                description="Drag, resize, and fine-tune every element exactly how you want"
              />
              <FeatureCard
                title="Print Ready"
                description="Export at 300 DPI for stunning print quality"
              />
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-medium text-foreground">Your Albums</h2>
              <p className="text-sm text-muted-foreground">{albums.length} album{albums.length !== 1 ? 's' : ''}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {albums.map((album) => (
                <AlbumCard
                  key={album.id}
                  album={album}
                  onClick={() => navigate(`/album/${album.id}`)}
                  onDelete={() => setAlbumToDelete(album)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      <CreateAlbumDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
      />

      <AlertDialog open={!!albumToDelete} onOpenChange={() => setAlbumToDelete(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Album</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{albumToDelete?.name}"? This action cannot be undone 
              and all spreads and photos will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAlbum} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-4 rounded-lg bg-surface-2 border border-border">
      <h3 className="font-medium text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
