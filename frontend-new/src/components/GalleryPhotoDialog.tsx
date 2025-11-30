import { useState, useEffect } from 'react';
import { Download, Printer, Share2, Trash2, ChevronLeft, ChevronRight, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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

interface Photo {
  url: string;
  session_id?: string;
  timestamp?: string;
  [key: string]: any;
}

interface GalleryPhotoDialogProps {
  photo: Photo | null;
  allPhotos: Photo[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (photo: Photo) => void;
  onDownload?: (photo: Photo) => void;
  onPrint?: (photo: Photo) => void;
  onShare?: (photo: Photo) => void;
  onViewStrip?: (photo: Photo) => void;
}

export default function GalleryPhotoDialog({
  photo,
  allPhotos,
  open,
  onOpenChange,
  onDelete,
  onDownload,
  onPrint,
  onShare,
  onViewStrip,
}: GalleryPhotoDialogProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Sincronizar el índice actual cuando cambia la foto seleccionada o la lista de fotos
  useEffect(() => {
    if (!photo || !allPhotos || allPhotos.length === 0) {
      return;
    }

    const index = allPhotos.findIndex((p) => p.url === photo.url);
    if (index !== -1) {
      setCurrentIndex(index);
    } else {
      // Si no se encuentra (p. ej. después de una recarga), hacer fallback al inicio
      setCurrentIndex(0);
    }
  }, [photo, allPhotos]);

  const currentPhoto = allPhotos[currentIndex] || photo;

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < allPhotos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleDelete = () => {
    if (currentPhoto && onDelete) {
      onDelete(currentPhoto);
      setShowDeleteDialog(false);
      onOpenChange(false);
    }
  };

  if (!currentPhoto) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl glass border-white/10 text-white p-0" showCloseButton={true}>
          {/* Header */}
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl">
              Foto {currentIndex + 1} de {allPhotos.length}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Vista detallada de la foto de la galería. Usa las flechas para navegar entre fotos.
            </DialogDescription>
            {currentPhoto.session_id && (
              <p className="text-sm text-gray-400">
                Sesión: {currentPhoto.session_id} • {currentPhoto.timestamp || 'Sin fecha'}
              </p>
            )}
          </DialogHeader>

          {/* Image */}
          <div className="relative flex items-center justify-center bg-black p-6">
            {/* Previous Button */}
            {currentIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 text-white z-10"
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
            )}

            {/* Photo */}
            <img
              src={currentPhoto.url}
              alt={`Foto ${currentIndex + 1}`}
              className="max-h-[60vh] max-w-full object-contain rounded-lg"
            />

            {/* Next Button */}
            {currentIndex < allPhotos.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 text-white z-10"
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center gap-3 p-6 pt-0">
            {onDownload && (
              <Button
                onClick={() => onDownload(currentPhoto)}
                variant="outline"
                className="bg-transparent border-gray-600 text-white hover:bg-white/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar
              </Button>
            )}

            {onPrint && (
              <Button
                onClick={() => onPrint(currentPhoto)}
                className="bg-[#ff0080] hover:bg-[#ff0080]/90 text-white"
              >
                <Printer className="w-4 h-4 mr-2" />
                Reimprimir
              </Button>
            )}

            {onViewStrip && currentPhoto.session_id && (
              <Button
                onClick={() => onViewStrip(currentPhoto)}
                variant="outline"
                className="bg-transparent border-gray-600 text-white hover:bg-white/10"
              >
                <Image className="w-4 h-4 mr-2" />
                Ver tira de sesión
              </Button>
            )}

            {onShare && (
              <Button
                onClick={() => onShare(currentPhoto)}
                variant="outline"
                className="bg-transparent border-gray-600 text-white hover:bg-white/10"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Compartir
              </Button>
            )}

            {onDelete && (
              <Button
                onClick={() => setShowDeleteDialog(true)}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-black/95 border-gray-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar foto?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Esta acción no se puede deshacer. La foto será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-gray-600 text-white hover:bg-white/10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Sí, Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
