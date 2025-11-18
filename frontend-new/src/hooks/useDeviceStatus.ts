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

export function useDeviceStatus() {
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

  const checkCameraStatus = useCallback(async () => {
    try {
      // Intentar obtener lista de cámaras
      const cameras = await photoboothAPI.camera.list();
      if (cameras && cameras.length > 0) {
        setStatus((prev) => ({
          ...prev,
          cameraStatus: 'ok',
          cameraDetails: `${cameras.length} cámara(s) detectada(s)`,
        }));
      } else {
        setStatus((prev) => ({
          ...prev,
          cameraStatus: 'error',
          cameraDetails: 'No se detectaron cámaras',
        }));
      }
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        cameraStatus: 'error',
        cameraDetails: 'Error al conectar con cámara',
      }));
    }
  }, []);

  const checkPrinterStatus = useCallback(async () => {
    try {
      // Intentar obtener lista de impresoras
      const response = await photoboothAPI.print.listPrinters();
      if (response && response.printers && response.printers.length > 0) {
        setStatus((prev) => ({
          ...prev,
          printerStatus: 'ok',
          printerDetails: `${response.printers.length} impresora(s) - ${response.default_printer || 'Sin predeterminada'}`,
        }));
      } else {
        setStatus((prev) => ({
          ...prev,
          printerStatus: 'error',
          printerDetails: 'No se detectaron impresoras',
        }));
      }

      // Consultar últimos jobs por si hay fallos recientes
      const jobs = await photoboothAPI.print.listJobs();
      const lastFailed = jobs.find((job: any) => job.status === 'failed');
      const failedCount = jobs.filter((job: any) => job.status === 'failed').length;
      setStatus((prev) => ({
        ...prev,
        lastPrintJobError: lastFailed?.error || null,
        lastPrintJobId: lastFailed?.job_id || null,
        failedPrintJobs: failedCount,
      }));
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        printerStatus: 'error',
        printerDetails: 'Error al conectar con impresora',
        lastPrintJobError: prev.lastPrintJobError,
        lastPrintJobId: prev.lastPrintJobId,
        failedPrintJobs: prev.failedPrintJobs,
      }));
    }
  }, []);

  const checkBackendStatus = useCallback(async () => {
    try {
      // Ping al backend obteniendo settings
      await photoboothAPI.settings.get();
      setStatus((prev) => ({
        ...prev,
        backendStatus: 'ok',
        backendDetails: 'Conectado',
      }));
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        backendStatus: 'error',
        backendDetails: 'Backend no responde',
      }));
    }
  }, []);

  const checkAllDevices = useCallback(async () => {
    await Promise.all([
      checkCameraStatus(),
      checkPrinterStatus(),
      checkBackendStatus(),
    ]);
  }, [checkCameraStatus, checkPrinterStatus, checkBackendStatus]);

  // Check inicial
  useEffect(() => {
    checkAllDevices();
  }, [checkAllDevices]);

  // Polling cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      checkAllDevices();
    }, 30000); // 30s

    return () => clearInterval(interval);
  }, [checkAllDevices]);

  return {
    ...status,
    refresh: checkAllDevices,
  };
}
