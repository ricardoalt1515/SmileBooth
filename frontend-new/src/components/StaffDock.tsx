import { Settings, Image, Layout, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
interface StaffDockProps {
  onOpenSettings: () => void;
  onOpenGallery: () => void;
  onOpenDesigns: () => void;
  onOpenChecklist: () => void;
  onRetryPrint?: () => void;
  hasPrintError?: boolean;
  galleryPhotoCount?: number;
  className?: string;
  failedPrintJobs?: number;
}

export default function StaffDock({
  onOpenSettings,
  onOpenGallery,
  onOpenDesigns,
  onOpenChecklist,
  onRetryPrint,
  hasPrintError = false,
  galleryPhotoCount = 0,
  failedPrintJobs = 0,
  className = '',
}: StaffDockProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={`fixed right-6 top-1/2 -translate-y-1/2 z-50 animate-slide-in-blur ${className}`}
        data-mode="staff"
      >
        <div className="flex flex-col gap-3 glass p-3 rounded-2xl border border-white/10 relative">
          {/* Gradient glow accent */}
          <div
            className="absolute inset-0 rounded-2xl opacity-30 blur-xl -z-10"
            style={{
              background: 'radial-gradient(circle at center, var(--primary) 0%, transparent 70%)',
            }}
          />
          {/* Settings */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onOpenSettings}
                variant="ghost"
                size="icon"
                className="w-14 h-14 rounded-xl hover:bg-primary/20 hover:scale-110 transition-all duration-200 group relative overflow-hidden"
                aria-label="Configuración"
              >
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-200" />
                <Settings className="w-7 h-7 text-white/80 group-hover:text-white group-hover:rotate-90 transition-all duration-300 relative z-10" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-black/95 border-white/20">
              <p className="font-medium">Configuración</p>
              <p className="text-xs text-gray-400">Ctrl+Shift+S</p>
            </TooltipContent>
          </Tooltip>

          {/* Gallery */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onOpenGallery}
                variant="ghost"
                size="icon"
                className="w-14 h-14 rounded-xl hover:bg-white/10 hover:scale-110 transition-all duration-200 group relative"
                aria-label="Galería"
              >
                <Image className="w-7 h-7 text-white group-hover:scale-110 transition-transform duration-200" />
                {galleryPhotoCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs bg-[#ff0080] hover:bg-[#ff0080] border-2 border-black"
                  >
                    {galleryPhotoCount > 99 ? '99+' : galleryPhotoCount}
                  </Badge>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-black/95 border-white/20">
              <p className="font-medium">Galería</p>
              <p className="text-xs text-gray-400">Ctrl+G</p>
              {galleryPhotoCount > 0 && (
                <p className="text-xs text-[#ff0080] font-semibold mt-1">
                  {galleryPhotoCount} foto{galleryPhotoCount !== 1 ? 's' : ''} nueva{galleryPhotoCount !== 1 ? 's' : ''}
                </p>
              )}
            </TooltipContent>
          </Tooltip>

          {/* Designs */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onOpenDesigns}
                variant="ghost"
                size="icon"
                className="w-14 h-14 rounded-xl hover:bg-white/10 hover:scale-110 transition-all duration-200 group"
                aria-label="Diseños"
              >
                <Layout className="w-7 h-7 text-white group-hover:scale-110 transition-transform duration-200" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-black/95 border-white/20">
              <p className="font-medium">Diseños</p>
              <p className="text-xs text-gray-400">Plantillas activas</p>
            </TooltipContent>
          </Tooltip>

          {/* Hardware Checklist */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onOpenChecklist}
                variant="ghost"
                size="icon"
                className="w-14 h-14 rounded-xl hover:bg-white/10 hover:scale-110 transition-all duration-200 group"
                aria-label="Checklist"
              >
                <CheckCircle className="w-7 h-7 text-white group-hover:scale-110 transition-transform duration-200" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-black/95 border-white/20">
              <p className="font-medium">Hardware Checklist</p>
              <p className="text-xs text-gray-400">Estado del sistema</p>
            </TooltipContent>
          </Tooltip>

          {/* Retry last print if error */}
          {onRetryPrint && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onRetryPrint}
                  variant="ghost"
                  size="icon"
                  className={`w-14 h-14 rounded-xl hover:bg-white/10 hover:scale-110 transition-all duration-200 group ${
                    hasPrintError ? 'ring-2 ring-red-500/80' : ''
                  }`}
                  aria-label="Reintentar impresión fallida"
                >
                  <Printer className={`w-7 h-7 ${hasPrintError ? 'text-red-400' : 'text-white'}`} />
                  {failedPrintJobs > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] bg-red-500 border-2 border-black"
                    >
                      {failedPrintJobs > 9 ? '9+' : failedPrintJobs}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="bg-black/95 border-white/20">
                <p className="font-medium">Reintentar impresión</p>
                <p className="text-xs text-gray-400">
                  {failedPrintJobs > 0 ? 'Trabajos fallidos pendientes' : 'Sin fallos pendientes'}
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
