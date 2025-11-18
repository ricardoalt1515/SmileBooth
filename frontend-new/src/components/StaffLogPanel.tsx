import { useEffect, useMemo, useState, useCallback } from 'react';
import { useAppStore, AppLog, PrintJob } from '../store/useAppStore';
import photoboothAPI from '../services/api';
import { useToastContext } from '../contexts/ToastContext';

const LEVEL_COLOR: Record<AppLog['level'], string> = {
  info: 'text-blue-200',
  warning: 'text-amber-200',
  error: 'text-red-200',
};

const LEVEL_LABEL: Record<AppLog['level'], string> = {
  info: 'INFO',
  warning: 'WARN',
  error: 'ERROR',
};

const PANEL_MAX_HEIGHT = '18rem';

export default function StaffLogPanel() {
  const { logs, clearLogs } = useAppStore();
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);
  const toast = useToastContext();

  const loadJobs = useCallback(async () => {
    try {
      const data = await photoboothAPI.print.listJobs();
      setJobs(data.slice(0, 5)); // mostrar últimos 5
    } catch (error) {
      // Silencio: el panel de logs no debe mostrar errores de polling
    }
  }, []);

  useEffect(() => {
    void loadJobs();

    const interval = setInterval(loadJobs, 15000);
    return () => clearInterval(interval);
  }, [loadJobs]);

  const formattedLogs = useMemo(
    () =>
      logs.map((entry) => ({
        ...entry,
        formattedTime: new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      })),
    [logs],
  );

  if (formattedLogs.length === 0) {
    return null;
  }

  return (
    <div className="fixed left-6 bottom-6 z-50 w-96 max-w-[90vw] space-y-3">
      <div className="backdrop-blur-xl bg-black/70 border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="text-sm text-white/70 font-semibold uppercase tracking-wide">Panel Operativo</div>
          <button
            type="button"
            className="text-xs text-white/60 hover:text-white transition-colors"
            onClick={clearLogs}
          >
            Limpiar
          </button>
        </div>
        <div
          className="px-4 py-3 space-y-2 overflow-y-auto"
          style={{ maxHeight: PANEL_MAX_HEIGHT }}
        >
          {formattedLogs.map((entry) => (
            <div
              key={entry.id}
              className="flex gap-3 text-sm text-white/80 bg-white/5 rounded-lg px-3 py-2 border border-white/5"
            >
              <div className={`text-xs font-semibold ${LEVEL_COLOR[entry.level]}`}>
                {LEVEL_LABEL[entry.level]}
              </div>
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-white font-medium">{entry.message}</span>
                  <span className="text-[11px] text-white/50 whitespace-nowrap">{entry.formattedTime}</span>
                </div>
                {entry.source ? (
                  <div className="text-[11px] text-white/50 uppercase tracking-wide">
                    {entry.source}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
      {jobs.length > 0 && (
        <div className="backdrop-blur-xl bg-black/70 border border-white/10 rounded-2xl shadow-2xl">
          <div className="px-4 py-3 border-b border-white/10 text-sm text-white/70 font-semibold uppercase tracking-wide">
            Trabajos de impresión
          </div>
          <div className="px-4 py-3 space-y-2 max-h-40 overflow-y-auto">
              {jobs.map((job) => (
                <div
                  key={job.job_id}
                  className="text-xs text-white/80 bg-white/5 rounded-lg px-3 py-2 border border-white/5"
                >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{job.status.toUpperCase()}</span>
                  <span className="text-[11px] text-white/50">
                    {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-[11px] text-white/60">
                  {job.copies} copia(s) • {job.printer_name || 'Predeterminada'}
                </div>
                  <div className="text-[11px] text-white/60 truncate">{job.file_path}</div>
                  {job.error && (
                    <div className="text-[11px] text-red-400 mt-1 truncate">Error: {job.error}</div>
                  )}
                  {job.status !== 'sent' && (
                    <button
                      type="button"
                      disabled={isRetrying}
                      onClick={async () => {
                        setIsRetrying(true);
                        try {
                          await photoboothAPI.print.retryJob(job.job_id);
                          toast.success('Reintento enviado');
                          await loadJobs();
                        } catch (error) {
                          toast.error('No se pudo reintentar el trabajo');
                        } finally {
                          setIsRetrying(false);
                        }
                      }}
                      className="mt-2 px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-[11px] disabled:opacity-50"
                    >
                      Reintentar
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
