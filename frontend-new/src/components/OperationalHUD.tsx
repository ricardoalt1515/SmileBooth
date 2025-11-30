import { Camera, Printer, Wifi, WifiOff, AlertCircle, RefreshCw } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type DeviceStatus = 'ok' | 'error' | 'reconnecting' | 'unknown';

interface OperationalHUDProps {
  cameraStatus: DeviceStatus;
  printerStatus: DeviceStatus;
  backendStatus: DeviceStatus;
  cameraDetails?: string;
  printerDetails?: string;
  backendDetails?: string;
  lastPrintJobError?: string | null;
  lastPrintJobId?: string | null;
  failedPrintJobs?: number;
  onStatusClick?: (device: 'camera' | 'printer' | 'backend') => void;
  pollingEnabled?: boolean;
  onManualRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function OperationalHUD({
  cameraStatus,
  printerStatus,
  backendStatus,
  cameraDetails,
  printerDetails,
  backendDetails,
  lastPrintJobError,
  failedPrintJobs = 0,
  onStatusClick,
  pollingEnabled = true,
  onManualRefresh,
  isRefreshing = false,
}: OperationalHUDProps) {
  const getStatusColor = (status: DeviceStatus) => {
    switch (status) {
      case 'ok':
        return 'glass border-green-400/30 text-green-400 shadow-lg shadow-green-400/20 hover:border-green-400/50 hover:shadow-green-400/30';
      case 'error':
        return 'glass border-red-400/30 text-red-400 shadow-lg shadow-red-400/20 hover:border-red-400/50 hover:shadow-red-400/30';
      case 'reconnecting':
        return 'glass border-yellow-400/30 text-yellow-400 shadow-lg shadow-yellow-400/20 hover:border-yellow-400/50 hover:shadow-yellow-400/30';
      default:
        return 'glass border-white/20 text-white/60 shadow-lg hover:border-white/30';
    }
  };

  const getStatusText = (status: DeviceStatus) => {
    switch (status) {
      case 'ok':
        return 'OK';
      case 'error':
        return 'Error';
      case 'reconnecting':
        return 'Reconectando...';
      default:
        return 'Desconocido';
    }
  };

  const getStatusIcon = (status: DeviceStatus) => {
    if (status === 'error') return <AlertCircle className="w-3 h-3" />;
    if (status === 'reconnecting') return <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />;
    return null;
  };

  return (
    <div className="fixed top-4 left-4 z-50 flex gap-2" data-mode="staff">
      <TooltipProvider delayDuration={200}>
        {(onManualRefresh || !pollingEnabled) && (
          <div className="flex flex-col gap-1 mr-2">
            {onManualRefresh && (
              <button
                type="button"
                aria-label="Actualizar estado"
                className="glass border-white/20 text-white/80 px-3 py-2 rounded-xl text-xs flex items-center gap-2 hover:border-white/40"
                onClick={onManualRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-3 h-3 transition-transform ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Actualizando…' : 'Actualizar'}
              </button>
            )}
            {!pollingEnabled && (
              <span className="text-[10px] text-amber-200 tracking-wide uppercase">
                Polling apagado
              </span>
            )}
          </div>
        )}

        {/* Camera Status */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onStatusClick?.('camera')}
              className={`flex items-center gap-2 px-3 py-2 rounded-full border backdrop-blur-sm transition-all hover:scale-105 ${getStatusColor(
                cameraStatus
              )}`}
            >
              <Camera className="w-4 h-4" />
              <span className="text-xs font-medium hidden sm:inline">Cámara</span>
              {getStatusIcon(cameraStatus)}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-black/90 text-white border-gray-700">
            <div className="text-xs">
              <p className="font-bold mb-1">Cámara: {getStatusText(cameraStatus)}</p>
              {cameraDetails && <p className="text-gray-400">{cameraDetails}</p>}
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Printer Status */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onStatusClick?.('printer')}
              className={`flex items-center gap-2 px-3 py-2 rounded-full border backdrop-blur-sm transition-all hover:scale-105 ${getStatusColor(
                printerStatus
              )}`}
            >
              <Printer className="w-4 h-4" />
              <span className="text-xs font-medium hidden sm:inline">Impresora</span>
              {getStatusIcon(printerStatus)}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-black/90 text-white border-gray-700">
            <div className="text-xs">
              <p className="font-bold mb-1">Impresora: {getStatusText(printerStatus)}</p>
              {printerDetails && <p className="text-gray-400">{printerDetails}</p>}
              {lastPrintJobError && (
                <p className="text-red-400 mt-1">Último error: {lastPrintJobError}</p>
              )}
              {failedPrintJobs > 0 && (
                <p className="text-amber-300 mt-1">Pendientes por reintentar: {failedPrintJobs}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Backend Status */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onStatusClick?.('backend')}
              className={`flex items-center gap-2 px-3 py-2 rounded-full border backdrop-blur-sm transition-all hover:scale-105 ${getStatusColor(
                backendStatus
              )}`}
            >
              {backendStatus === 'ok' ? (
                <Wifi className="w-4 h-4" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}
              <span className="text-xs font-medium hidden sm:inline">Backend</span>
              {getStatusIcon(backendStatus)}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-black/90 text-white border-gray-700">
            <div className="text-xs">
              <p className="font-bold mb-1">Backend: {getStatusText(backendStatus)}</p>
              {backendDetails && <p className="text-gray-400">{backendDetails}</p>}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
