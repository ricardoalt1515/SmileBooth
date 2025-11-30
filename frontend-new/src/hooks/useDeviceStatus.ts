import { useState, useEffect, useCallback } from 'react';
import photoboothAPI from '../services/api';
import type { DeviceStatus } from '../components/OperationalHUD';

interface DeviceStatusState {
  cameraStatus: DeviceStatus;
  printerStatus: DeviceStatus;
  backendStatus: DeviceStatus;
  cameraDetails: string;
  printerDetails: string;
  backendDetails: string;
  lastPrintJobError: string | null;
  lastPrintJobId: string | null;
  failedPrintJobs: number;
}

interface UseDeviceStatusOptions {
  enabled?: boolean;
}

export function useDeviceStatus(options: UseDeviceStatusOptions = {}) {
  const { enabled = true } = options;
  const [status, setStatus] = useState<DeviceStatusState>({
    cameraStatus: 'unknown',
    printerStatus: 'unknown',
    backendStatus: 'unknown',
    cameraDetails: 'Verificando...',
    printerDetails: 'Verificando...',
    backendDetails: 'Verificando...',
    lastPrintJobError: null,
    lastPrintJobId: null,
    failedPrintJobs: 0,
  });

  // Use useCallback ONCE for the main check function, with NO dependencies
  // This function is stable and won't cause re-renders
  const checkAllDevices = useCallback(async () => {
    try {
      const data = await photoboothAPI.fullHealth({ includeCamera: true });

      const cameraStatus: DeviceStatus = data.camera?.status === 'ok'
        ? 'ok'
        : data.camera?.status === 'error'
          ? 'error'
          : 'unknown';

      const printerStatus: DeviceStatus = data.printer?.status === 'ok'
        ? 'ok'
        : data.printer?.status === 'error'
          ? 'error'
          : 'unknown';

      const backendStatus: DeviceStatus = data.backend?.status === 'ok'
        ? 'ok'
        : 'error';

      setStatus((prev) => ({
        ...prev,
        cameraStatus,
        cameraDetails: data.camera?.message || (cameraStatus === 'ok' ? 'Cámara lista (renderer)' : 'Estado de cámara desconocido'),
        printerStatus,
        printerDetails: data.printer?.message || (printerStatus === 'ok' ? 'Impresora lista' : 'Error al detectar impresora'),
        backendStatus,
        backendDetails: data.backend?.message || (backendStatus === 'ok' ? 'Conectado' : 'Backend no responde'),
        lastPrintJobError: data.print_queue?.last_failed?.error || null,
        lastPrintJobId: data.print_queue?.last_failed?.job_id || null,
        failedPrintJobs: data.print_queue?.failed_jobs ?? 0,
      }));
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        backendStatus: 'error',
        backendDetails: 'Error al obtener estado de backend',
        printerStatus: prev.printerStatus === 'unknown' ? 'error' : prev.printerStatus,
        printerDetails: prev.printerDetails === 'Verificando...'
          ? 'Error al obtener estado de impresora'
          : prev.printerDetails,
      }));
    }
  }, []); // Empty dependency array - function is stable

  // Check inicial + polling cada 60 segundos (increased from 30s)
  useEffect(() => {
    if (!enabled) {
      return;
    }

    checkAllDevices();

    const interval = setInterval(() => {
      checkAllDevices();
    }, 60000); // 60s

    return () => clearInterval(interval);
  }, [enabled, checkAllDevices]);

  return {
    ...status,
    refresh: () => (enabled ? checkAllDevices() : Promise.resolve()),
    pollingEnabled: enabled,
  };
}
