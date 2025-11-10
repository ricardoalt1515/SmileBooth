import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Printer, Wifi, RefreshCw, Calendar, LayoutTemplate, AlertTriangle } from 'lucide-react';
import type { EventPreset } from '../types/preset';
import type { DeviceStatus } from './OperationalHUD';
import { LAYOUT_LABELS } from '../types/template';

interface HardwareChecklistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: {
    cameraStatus: DeviceStatus;
    printerStatus: DeviceStatus;
    backendStatus: DeviceStatus;
    cameraDetails?: string;
    printerDetails?: string;
    backendDetails?: string;
  };
  onRefresh: () => void;
  activeEvent?: EventPreset | null;
}

const STATUS_STYLES: Record<DeviceStatus, { label: string; badge: string; icon: string }> = {
  ok: {
    label: 'Listo',
    badge: 'bg-green-500/15 text-green-300 border border-green-500/40',
    icon: 'text-green-400',
  },
  error: {
    label: 'Revisar',
    badge: 'bg-red-500/15 text-red-300 border border-red-500/40',
    icon: 'text-red-400',
  },
  reconnecting: {
    label: 'Reconectando',
    badge: 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/40',
    icon: 'text-yellow-400',
  },
  unknown: {
    label: 'Sin verificar',
    badge: 'bg-gray-500/15 text-gray-300 border border-gray-500/40',
    icon: 'text-gray-400',
  },
};

const getTemplateLayoutLabel = (layout?: string | null) =>
  layout ? LAYOUT_LABELS[layout as keyof typeof LAYOUT_LABELS] ?? null : null;

export default function HardwareChecklistDialog({
  open,
  onOpenChange,
  status,
  onRefresh,
  activeEvent,
}: HardwareChecklistDialogProps) {
  const statusItems = [
    {
      id: 'camera',
      label: 'Cámara detectada',
      icon: Camera,
      status: status.cameraStatus,
      details: status.cameraDetails ?? 'Sin verificación reciente',
    },
    {
      id: 'printer',
      label: 'Impresora lista',
      icon: Printer,
      status: status.printerStatus,
      details: status.printerDetails ?? 'Sin verificación reciente',
    },
    {
      id: 'backend',
      label: 'Backend conectado',
      icon: Wifi,
      status: status.backendStatus,
      details: status.backendDetails ?? 'Sin verificación reciente',
    },
  ];

  const templateLayout = getTemplateLayoutLabel(activeEvent?.template_layout);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Checklist Operativo</DialogTitle>
          <DialogDescription>
            Verifica cámara, impresora y backend antes de iniciar un evento. Refresca para validar cambios.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {statusItems.map((item) => {
              const meta = STATUS_STYLES[item.status];
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-border/60 bg-muted/30 p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-lg bg-background/40 flex items-center justify-center ${meta.icon}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge className={meta.badge}>{meta.label}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.details}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="h-px w-full bg-border/60" />

          <div className="rounded-xl border border-border/60 bg-muted/20 p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              <LayoutTemplate className="w-4 h-4" />
              Evento activo
            </div>
            {activeEvent ? (
              <div className="space-y-2">
                <p className="text-lg font-bold">{activeEvent.name}</p>
                {activeEvent.event_date && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {new Date(activeEvent.event_date).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                )}
                {activeEvent.template_name ? (
                  <div className="text-sm text-muted-foreground">
                    Template: <span className="font-medium text-foreground">{activeEvent.template_name}</span>
                    {templateLayout ? ` • ${templateLayout}` : ''}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                    No hay template asignado
                  </div>
                )}
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="rounded-lg bg-background/40 p-3">
                    <p className="text-2xl font-bold text-primary">{activeEvent.photos_to_take}</p>
                    <p className="text-muted-foreground">Fotos</p>
                  </div>
                  <div className="rounded-lg bg-background/40 p-3">
                    <p className="text-2xl font-bold text-primary">{activeEvent.countdown_seconds}s</p>
                    <p className="text-muted-foreground">Countdown</p>
                  </div>
                  <div className="rounded-lg bg-background/40 p-3">
                    <p className="text-2xl font-bold text-primary">{activeEvent.auto_reset_seconds}s</p>
                    <p className="text-muted-foreground">Auto-reset</p>
                  </div>
                </div>
                {activeEvent.notes && (
                  <p className="text-sm text-muted-foreground border border-dashed border-border rounded-lg p-3 bg-background/30">
                    {activeEvent.notes}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay un evento activo. Activa uno en la pestaña de Configuración &gt; Eventos.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Button variant="ghost" className="gap-2" onClick={onRefresh}>
              <RefreshCw className="w-4 h-4" />
              Re-ejecutar verificación
            </Button>
            <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
