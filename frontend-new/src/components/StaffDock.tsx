import { Settings, Image, Layout, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface StaffDockProps {
  onOpenSettings: () => void;
  onOpenGallery: () => void;
  onOpenDesigns: () => void;
  onOpenChecklist: () => void;
  galleryPhotoCount?: number;
  className?: string;
}

export default function StaffDock({
  onOpenSettings,
  onOpenGallery,
  onOpenDesigns,
  onOpenChecklist,
  galleryPhotoCount = 0,
  className = '',
}: StaffDockProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={`fixed right-6 top-1/2 -translate-y-1/2 z-50 ${className}`}
        data-mode="staff"
      >
        <div className="flex flex-col gap-3 bg-black/90 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-2xl">
          {/* Settings */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onOpenSettings}
                variant="ghost"
                size="icon"
                className="w-14 h-14 rounded-xl hover:bg-white/10 hover:scale-110 transition-all duration-200 group"
                aria-label="Configuración"
              >
                <Settings className="w-7 h-7 text-white group-hover:rotate-90 transition-transform duration-300" />
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
        </div>
      </div>
    </TooltipProvider>
  );
}
