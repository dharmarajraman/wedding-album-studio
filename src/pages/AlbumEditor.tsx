import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Album, Spread, Photo, PhotoFrame, getCanvasDimensions, getGutterPixels } from '@/types/album';
import { 
  getAlbum, 
  saveAlbum, 
  getAlbumSpreads, 
  saveSpread, 
  deleteSpread,
  getAlbumPhotos, 
  savePhoto, 
  getPhotoBlob,
  createThumbnail,
  getImageDimensions,
} from '@/lib/storage';
import { generateFramesForLayout, LAYOUT_TEMPLATES } from '@/lib/layouts';
import { PhotoGallery } from '@/components/editor/PhotoGallery';
import { SpreadPanel } from '@/components/editor/SpreadPanel';
import { PropertiesPanel } from '@/components/editor/PropertiesPanel';
import { EditorToolbar, EditorTool } from '@/components/editor/EditorToolbar';
import { AutoLayoutDialog } from '@/components/editor/AutoLayoutDialog';
import { ExportDialog } from '@/components/editor/ExportDialog';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AlbumEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [album, setAlbum] = useState<Album | null>(null);
  const [spreads, setSpreads] = useState<Spread[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Map<string, string>>(new Map());
  
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  
  const [activeTool, setActiveTool] = useState<EditorTool>('select');
  const [zoom, setZoom] = useState(1);
  const [showGutter, setShowGutter] = useState(true);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [showAutoLayout, setShowAutoLayout] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load album data
  useEffect(() => {
    if (!id) return;
    
    const loadData = async () => {
      try {
        const loadedAlbum = await getAlbum(id);
        if (!loadedAlbum) {
          toast.error('Album not found');
          navigate('/');
          return;
        }
        setAlbum(loadedAlbum);
        
        const loadedSpreads = await getAlbumSpreads(id);
        setSpreads(loadedSpreads);
        
        const loadedPhotos = await getAlbumPhotos(id);
        setPhotos(loadedPhotos);
        
        // Load photo URLs
        const urls = new Map<string, string>();
        for (const photo of loadedPhotos) {
          const blob = await getPhotoBlob(photo.id);
          if (blob) urls.set(photo.id, URL.createObjectURL(blob));
        }
        setPhotoUrls(urls);
      } catch (error) {
        console.error('Failed to load album:', error);
        toast.error('Failed to load album');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [id, navigate]);

  // Upload photos
  const handleUploadPhotos = useCallback(async (files: FileList) => {
    if (!album) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      try {
        const photoId = uuidv4();
        const thumbnail = await createThumbnail(file);
        const dimensions = await getImageDimensions(file);
        
        const photo: Photo = {
          id: photoId,
          albumId: album.id,
          filename: file.name,
          width: dimensions.width,
          height: dimensions.height,
          thumbnailUrl: thumbnail,
          createdAt: new Date().toISOString(),
        };
        
        await savePhoto(photo, file);
        setPhotos(prev => [...prev, photo]);
        
        const url = URL.createObjectURL(file);
        setPhotoUrls(prev => new Map(prev).set(photoId, url));
        
        setUploadProgress(((i + 1) / fileArray.length) * 100);
      } catch (error) {
        console.error('Failed to upload photo:', file.name, error);
      }
    }
    
    toast.success(`Uploaded ${fileArray.length} photos`);
    setIsUploading(false);
  }, [album]);

  // Select photo
  const handleSelectPhoto = useCallback((photoId: string, multiSelect?: boolean) => {
    setSelectedPhotoIds(prev => {
      if (multiSelect) {
        return prev.includes(photoId) 
          ? prev.filter(id => id !== photoId)
          : [...prev, photoId];
      }
      return prev.includes(photoId) && prev.length === 1 ? [] : [photoId];
    });
  }, []);

  // Add spread
  const handleAddSpread = useCallback(async () => {
    if (!album) return;
    
    const spread: Spread = {
      id: uuidv4(),
      albumId: album.id,
      orderIndex: spreads.length,
      frames: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await saveSpread(spread);
    setSpreads(prev => [...prev, spread]);
    setCurrentSpreadIndex(spreads.length);
  }, [album, spreads.length]);

  // Delete spread
  const handleDeleteSpread = useCallback(async (index: number) => {
    const spread = spreads[index];
    await deleteSpread(spread.id);
    setSpreads(prev => prev.filter((_, i) => i !== index));
    if (currentSpreadIndex >= spreads.length - 1) {
      setCurrentSpreadIndex(Math.max(0, spreads.length - 2));
    }
  }, [spreads, currentSpreadIndex]);

  // Update frame
  const handleUpdateFrame = useCallback((updates: Partial<PhotoFrame>) => {
    if (!selectedFrameId) return;
    
    setSpreads(prev => prev.map((spread, i) => {
      if (i !== currentSpreadIndex) return spread;
      return {
        ...spread,
        frames: spread.frames.map(frame => 
          frame.id === selectedFrameId ? { ...frame, ...updates } : frame
        ),
      };
    }));
  }, [selectedFrameId, currentSpreadIndex]);

  // Apply auto layout
  const handleApplyLayout = useCallback(async (frames: { photoId: string; frameData: any }[]) => {
    if (!album) return;
    
    const newSpread: Spread = {
      id: uuidv4(),
      albumId: album.id,
      orderIndex: spreads.length,
      frames: frames.map(f => ({ ...f.frameData, id: uuidv4(), photoId: f.photoId })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await saveSpread(newSpread);
    setSpreads(prev => [...prev, newSpread]);
    setCurrentSpreadIndex(spreads.length);
    setSelectedPhotoIds([]);
    toast.success('Layout applied!');
  }, [album, spreads.length]);

  const currentSpread = spreads[currentSpreadIndex];
  const selectedFrame = currentSpread?.frames.find(f => f.id === selectedFrameId) || null;
  const canvasSize = album ? getCanvasDimensions(album) : { width: 0, height: 0 };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading album...</div>
      </div>
    );
  }

  if (!album) return null;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-border bg-surface-1 flex items-center px-4 gap-4 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <span className="font-medium">{album.name}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {album.size.name} @ {album.dpi} DPI
        </span>
      </header>

      {/* Toolbar */}
      <EditorToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        zoom={zoom}
        onZoomIn={() => setZoom(z => Math.min(z * 1.2, 3))}
        onZoomOut={() => setZoom(z => Math.max(z / 1.2, 0.1))}
        onZoomReset={() => setZoom(1)}
        onZoomFit={() => setZoom(0.5)}
        showGutter={showGutter}
        onToggleGutter={() => setShowGutter(!showGutter)}
        onAutoLayout={() => setShowAutoLayout(true)}
        onExport={() => setShowExport(true)}
        hasSelectedPhotos={selectedPhotoIds.length > 0}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className="w-64 border-r border-border bg-surface-1 shrink-0">
          <Tabs defaultValue="photos" className="h-full flex flex-col">
            <TabsList className="w-full rounded-none border-b border-border bg-transparent h-10">
              <TabsTrigger value="photos" className="flex-1 rounded-none data-[state=active]:bg-surface-2">Photos</TabsTrigger>
              <TabsTrigger value="spreads" className="flex-1 rounded-none data-[state=active]:bg-surface-2">Spreads</TabsTrigger>
            </TabsList>
            <TabsContent value="photos" className="flex-1 m-0 overflow-hidden">
              <PhotoGallery
                photos={photos}
                selectedPhotoIds={selectedPhotoIds}
                onSelectPhoto={handleSelectPhoto}
                onUploadPhotos={handleUploadPhotos}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
              />
            </TabsContent>
            <TabsContent value="spreads" className="flex-1 m-0 overflow-hidden">
              <SpreadPanel
                spreads={spreads}
                currentSpreadIndex={currentSpreadIndex}
                album={album}
                onSelectSpread={setCurrentSpreadIndex}
                onAddSpread={handleAddSpread}
                onDuplicateSpread={() => {}}
                onDeleteSpread={handleDeleteSpread}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-canvas-bg workspace-grid flex items-center justify-center overflow-auto">
          {spreads.length === 0 ? (
            <div className="text-center">
              <p className="text-muted-foreground mb-4">No spreads yet</p>
              <Button onClick={handleAddSpread}>Add First Spread</Button>
            </div>
          ) : (
            <div 
              className="bg-white shadow-lg"
              style={{
                width: canvasSize.width * 0.15 * zoom,
                height: canvasSize.height * 0.15 * zoom,
                position: 'relative',
              }}
            >
              {album.gutter.enabled && showGutter && (
                <div 
                  className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 bg-gutter-warning/20 border-x border-dashed border-gutter-warning/50"
                  style={{ width: `${(album.gutter.widthInches / album.size.width) * 100}%` }}
                />
              )}
              {currentSpread?.frames.map(frame => {
                const photoUrl = photoUrls.get(frame.photoId);
                return (
                  <div
                    key={frame.id}
                    className={`absolute overflow-hidden cursor-move ${selectedFrameId === frame.id ? 'ring-2 ring-primary' : ''}`}
                    style={{
                      left: `${(frame.x / canvasSize.width) * 100}%`,
                      top: `${(frame.y / canvasSize.height) * 100}%`,
                      width: `${(frame.width / canvasSize.width) * 100}%`,
                      height: `${(frame.height / canvasSize.height) * 100}%`,
                    }}
                    onClick={() => setSelectedFrameId(frame.id)}
                  >
                    {photoUrl ? (
                      <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="w-64 border-l border-border bg-surface-1 shrink-0">
          <PropertiesPanel
            selectedFrame={selectedFrame}
            onUpdateFrame={handleUpdateFrame}
            onDeleteFrame={() => {
              if (!selectedFrameId) return;
              setSpreads(prev => prev.map((spread, i) => 
                i !== currentSpreadIndex ? spread : {
                  ...spread,
                  frames: spread.frames.filter(f => f.id !== selectedFrameId)
                }
              ));
              setSelectedFrameId(null);
            }}
            onBringForward={() => {}}
            onSendBackward={() => {}}
            canvasWidth={canvasSize.width}
            canvasHeight={canvasSize.height}
          />
        </div>
      </div>

      {/* Dialogs */}
      <AutoLayoutDialog
        open={showAutoLayout}
        onOpenChange={setShowAutoLayout}
        selectedPhotos={photos.filter(p => selectedPhotoIds.includes(p.id))}
        album={album}
        onApplyLayout={handleApplyLayout}
      />

      <ExportDialog
        open={showExport}
        onOpenChange={setShowExport}
        album={album}
        spreads={spreads}
        currentSpreadIndex={currentSpreadIndex}
        photoUrls={photoUrls}
      />
    </div>
  );
}
