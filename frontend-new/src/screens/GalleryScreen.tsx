import { useState, useEffect } from 'react';
import { X, Download, Trash2, Image as ImageIcon, Calendar, Camera, Folder } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useToastContext } from '../contexts/ToastContext';
import photoboothAPI, { API_BASE_URL } from '../services/api';
import GalleryPhotoDialog from '../components/GalleryPhotoDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface Photo {
  id: string;
  filename: string;
  path: string;
  url: string;
  thumbnail_url?: string | null;
  session_id: string;
  timestamp: string;
  size_bytes: number;
}

interface Stats {
  total_sessions: number;
  total_photos: number;
  latest_session: string | null;
  total_size_mb: number;
}

type SessionBlock = {
  session_id: string;
  photos: Photo[];
  strip_url?: string | null;
  full_strip_url?: string | null;
  created_at?: string | null;
};

export default function GalleryScreen() {
  const { setCurrentScreen } = useAppStore();
  const toast = useToastContext();

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [sessions, setSessions] = useState<SessionBlock[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [activePresetName, setActivePresetName] = useState<string | null>(null);

  // Cargar fotos al montar
  useEffect(() => {
    handleRefresh();
  }, []);

  // Hotkey ESC para cerrar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedPhoto) {
          setSelectedPhoto(null);
        } else {
          handleBack();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto]);

  const loadGallery = async () => {
    setIsLoading(true);
    try {
      const sessionData = await photoboothAPI.gallery.list();

      const normalizedSessions: SessionBlock[] = sessionData.map((session) => ({
        session_id: session.session_id,
        photos: session.photos.map((photo: Photo) => ({
          ...photo,
          url: `${API_BASE_URL}${photo.url}`,
          thumbnail_url: photo.thumbnail_url ? `${API_BASE_URL}${photo.thumbnail_url}` : undefined,
        })),
        strip_url: session.strip_url ? `${API_BASE_URL}${session.strip_url}` : null,
        full_strip_url: session.full_strip_url ? `${API_BASE_URL}${session.full_strip_url}` : null,
        created_at: session.created_at,
      }));

      const flatPhotos = normalizedSessions.flatMap((session) => session.photos);

      // Calcular tamaño total en MB a partir de los bytes de cada foto
      const totalBytes = flatPhotos.reduce((acc, photo) => acc + (photo.size_bytes || 0), 0);
      const totalSizeMb = Math.round((totalBytes / (1024 * 1024)) * 100) / 100;

      setPhotos(flatPhotos);
      setSessions(normalizedSessions);
      setStats({
        total_sessions: normalizedSessions.length,
        total_photos: flatPhotos.length,
        // Usar created_at de la sesión más reciente para mostrar fecha/hora
        latest_session: normalizedSessions[0]?.created_at ?? null,
        total_size_mb: totalSizeMb,
      });
    } catch (error) {
      console.error('Error loading gallery:', error);
      toast.error('Error al cargar galería');
    } finally {
      setIsLoading(false);
    }
  };

  const loadActivePreset = async () => {
    try {
      const data = await photoboothAPI.presets.list();
      if (data.active_preset) {
        setActivePresetId(data.active_preset.id);
        setActivePresetName(data.active_preset.name);
      } else {
        setActivePresetId(null);
        setActivePresetName(null);
      }
    } catch (error) {
      console.error('Error loading active preset:', error);
    }
  };

  const handleRefresh = () => {
    void loadGallery();
    void loadActivePreset();
  };

  const handleExportZip = async () => {
    if (photos.length === 0) {
      toast.warning('No hay fotos para exportar');
      return;
    }

    setIsExporting(true);
    try {
      await photoboothAPI.gallery.exportZip();
      toast.success('ZIP del evento descargado');
    } catch (error) {
      console.error('Error exporting event ZIP:', error);
      toast.error('Error al exportar evento');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSession = async (sessionId: string) => {
    try {
      await photoboothAPI.gallery.exportSessionZip(sessionId);
      toast.success(`ZIP de sesión ${sessionId} descargado`);
    } catch (error) {
      console.error('Error exportando sesión:', error);
      toast.error('No se pudo exportar la sesión');
    }
  };

  const handleClearAll = async () => {
    try {
      const result = await photoboothAPI.gallery.clearAll();
      toast.success(`${result.deleted_count} fotos eliminadas`);
      loadGallery();
    } catch (error) {
      console.error('Error clearing gallery:', error);
      toast.error('Error al limpiar galería');
    }
  };

  const handlePrintPhoto = async (photo: { url: string; session_id?: string; filename?: string; path?: string }) => {
    if (!photo) return;

    try {
      setIsPrinting(true);

      // 1) Intentar reimpresión de la tira completa usando la sesión
      if (photo.session_id) {
        try {
          const response = await photoboothAPI.sessions.reprint(photo.session_id, {
            copies: 1,
            file_path: photo.path || photo.url.replace(API_BASE_URL, ''),
          });
          console.log('✅ Reimpresión por sesión desde galería:', response);
          toast.success('Reimpresión enviada para la sesión');
          return;
        } catch (sessionError) {
          console.warn('⚠️ Error en reimpresión por sesión, usando impresión directa:', sessionError);
        }
      }

      // 2) Fallback: imprimir directamente la foto mostrada
      const filePath = photo.path || photo.url.replace(API_BASE_URL, '');
      const result = await photoboothAPI.print.queue({
        file_path: filePath,
        copies: 1,
      });
      console.log('✅ Impresión directa desde galería:', result);
      toast.success('Impresión enviada');
    } catch (error) {
      console.error('❌ Error al imprimir desde galería:', error);
      toast.error('Error al enviar a imprimir');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleViewStrip = async (photo: { session_id?: string }) => {
    if (!photo.session_id) {
      toast.warning('No se encontró la sesión asociada a esta foto');
      return;
    }

    try {
      const record = await photoboothAPI.sessions.get(photo.session_id);

      if (!record || !record.strip_path) {
        toast.warning('Esta sesión no tiene tira guardada');
        return;
      }

      const stripUrl = `${API_BASE_URL}${record.strip_path}`;
      window.open(stripUrl, '_blank');
    } catch (error) {
      console.error('Error al cargar tira de sesión:', error);
      toast.error('Error al mostrar la tira de la sesión');
    }
  };

  const handleBack = () => {
    setCurrentScreen('capture');
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('es-MX', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 relative overflow-hidden">
      {/* Animated gradient mesh background */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{ background: 'var(--gradient-mesh)' }}
      />

      {/* Header */}
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Camera className="w-10 h-10 text-[#ff0080]" />
            <div>
              <h1 className="text-4xl font-bold">Galería del Evento</h1>
              <p className="text-gray-400 mt-1">Todas las fotos capturadas hoy</p>
            </div>
          </div>

          <button
            onClick={handleBack}
            className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-300 group"
            aria-label="Cerrar galería"
            title="Cerrar (ESC)"
          >
            <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Stats Cards - Enhanced with animations */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="glass rounded-xl p-6 border border-white/10 group hover:border-blue-400/50 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up stagger-1">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-400/20 rounded-lg group-hover:scale-110 transition-transform">
                    <Calendar className="w-5 h-5 text-blue-400" />
                  </div>
                  <p className="text-sm text-white/60 font-medium">Sesiones</p>
                </div>
              </div>
              <p className="text-4xl font-bold">{stats.total_sessions}</p>
            </div>

            <div className="glass rounded-xl p-6 border border-white/10 group hover:border-green-400/50 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up stagger-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-400/20 rounded-lg group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-5 h-5 text-green-400" />
                  </div>
                  <p className="text-sm text-white/60 font-medium">Fotos</p>
                </div>
              </div>
              <p className="text-4xl font-bold">{stats.total_photos}</p>
            </div>

            <div className="glass rounded-xl p-6 border border-white/10 group hover:border-purple-400/50 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up stagger-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-400/20 rounded-lg group-hover:scale-110 transition-transform">
                    <Download className="w-5 h-5 text-purple-400" />
                  </div>
                  <p className="text-sm text-white/60 font-medium">Tamaño</p>
                </div>
              </div>
              <p className="text-4xl font-bold">{stats.total_size_mb} MB</p>
            </div>

            <div className="glass rounded-xl p-6 border border-white/10 group hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up stagger-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/20 rounded-lg group-hover:scale-110 transition-transform">
                    <Camera className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-sm text-white/60 font-medium">Última</p>
                </div>
              </div>
              <p className="text-lg font-bold truncate">
                {stats.latest_session ? formatTimestamp(stats.latest_session) : 'N/A'}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 mb-8 items-center">

          {/* Fin de evento: flujo guiado para staff */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={isExporting || photos.length === 0}
                className="flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-[#ff0080] to-[#ff8c00] text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5" />
                {isExporting ? 'Exportando...' : 'Cerrar evento y exportar ZIP'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-black/95 border-gray-700 text-white max-w-lg">
              <AlertDialogHeader>
                <AlertDialogTitle>Cerrar evento y exportar fotos</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-300">
                  Este paso genera un archivo ZIP con todas las fotos del evento y lo descarga en esta computadora.
                  {' '}No borra ninguna foto de la galería. Úsalo al terminar el evento para guardar una copia para el cliente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-transparent border-gray-600 text-white hover:bg-white/10">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleExportZip}
                  className="bg-[#ff0080] hover:bg-[#ff0080]/80 text-white"
                >
                  {isExporting ? 'Exportando...' : 'Sí, exportar ZIP del evento'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Export rápido sin confirmación */}
          <button
            onClick={handleExportZip}
            disabled={isExporting || photos.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-[#ff0080] hover:bg-[#ff0080]/80 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            {isExporting ? 'Exportando...' : 'Exportar ZIP rápido'}
          </button>

          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-all"
          >
            🔄 Actualizar
          </button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={photos.length === 0}
                className="ml-auto"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Limpiar Todo
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-black/95 border-gray-700 text-white">
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar todas las fotos?</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-400">
                  Esta acción eliminará permanentemente {stats?.total_photos} fotos de {stats?.total_sessions} sesiones.
                  Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-transparent border-gray-600 text-white hover:bg-white/10">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearAll}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Sí, Eliminar Todo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        </div>

        {/* Photos grouped by session */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-[#ff0080] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-xl text-gray-400">Cargando galería...</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <ImageIcon className="w-24 h-24 text-gray-600 mb-4" />
            <p className="text-2xl text-gray-400 mb-2">No hay fotos aún</p>
            <p className="text-gray-500">Las fotos capturadas aparecerán aquí</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sessions.map((session) => (
              <div key={session.session_id} className="bg-white/5 rounded-2xl border border-white/10 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Folder className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-white/60">Sesión</p>
                    <p className="text-lg font-semibold">{session.session_id}</p>
                  </div>
                  <span className="ml-auto text-sm text-white/60">{session.photos.length} foto(s)</span>
                  <button
                    onClick={() => handleExportSession(session.session_id)}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-sm flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    ZIP sesión
                  </button>
                </div>
                {(session.strip_url || session.full_strip_url) && (
                  <div className="flex items-center gap-3 mb-3 text-sm text-white/70">
                    {session.strip_url && (
                      <a
                        href={session.strip_url}
                        target="_blank"
                        rel="noreferrer"
                        className="underline hover:text-white"
                      >
                        Ver strip
                      </a>
                    )}
                    {session.full_strip_url && (
                      <a
                        href={session.full_strip_url}
                        target="_blank"
                        rel="noreferrer"
                        className="underline hover:text-white"
                      >
                        Ver full_strip
                      </a>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-6 gap-4">
                  {session.photos.map((photo, index) => (
                    <div
                      key={photo.id}
                      onClick={() => setSelectedPhoto(photo)}
                      className="aspect-square rounded-xl overflow-hidden cursor-pointer group relative animate-scale-in"
                      style={{ animationDelay: `${(index % 12) * 0.05}s` }}
                    >
                      <img
                        src={photo.thumbnail_url || photo.url}
                        alt={photo.filename}
                        className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110 group-hover:brightness-75"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div
                        className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-primary transition-all duration-300 pointer-events-none"
                        style={{
                          boxShadow: '0 0 0 0 var(--primary)',
                          transition: 'box-shadow 0.3s, border-color 0.3s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = 'var(--shadow-glow-magenta)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = '0 0 0 0 var(--primary)';
                        }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-3 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-10">
                        <p className="text-xs font-medium truncate">
                          {formatTimestamp(photo.timestamp)}
                        </p>
                        <p className="text-[10px] text-white/60 truncate">
                          {photo.filename}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Hint */}
        <p className="text-center text-sm text-gray-500 mt-8">
          Click en una foto para verla en grande • <kbd className="px-2 py-1 bg-gray-800 rounded">ESC</kbd> para cerrar
        </p>
      </div>

      {/* Gallery Photo Dialog */}
      <GalleryPhotoDialog
        photo={selectedPhoto}
        allPhotos={photos}
        open={!!selectedPhoto}
        onOpenChange={(open) => !open && setSelectedPhoto(null)}
        onDelete={async (photo) => {
          try {
            if (!photo.session_id || !photo.filename) {
              toast.error('No se puede identificar la foto a eliminar');
              return;
            }

            const result = await photoboothAPI.gallery.deletePhoto(
              photo.session_id,
              photo.filename,
            );

            if (result.success) {
              toast.success('Foto eliminada de la galería');
              setSelectedPhoto(null);
              await loadGallery();
            } else {
              toast.error(result.message || 'Error al eliminar foto');
            }
          } catch (error) {
            console.error('Error deleting photo:', error);
            toast.error('Error al eliminar foto');
          }
        }}
        onDownload={(photo) => {
          const link = document.createElement('a');
          link.href = photo.url;
          link.download = photo.filename || 'photo.jpg';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success('Descargando foto...');
        }}
        onPrint={(photo) => {
          if (!isPrinting) {
            void handlePrintPhoto(photo);
          }
        }}
        onShare={(_photo) => {
          toast.info('Función de compartir próximamente');
        }}
        onViewStrip={(photo) => {
          void handleViewStrip(photo);
        }}
      />
    </div>
  );
}
