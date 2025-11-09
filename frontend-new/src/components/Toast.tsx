import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type: ToastType;
  message: string;
  duration?: number;
  onClose: () => void;
}

const Toast = ({ type, message, duration = 3000, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-6 h-6" />,
    error: <XCircle className="w-6 h-6" />,
    warning: <AlertCircle className="w-6 h-6" />,
    info: <Info className="w-6 h-6" />,
  };

  const styles = {
    success: 'bg-green-600 border-green-500 text-white',
    error: 'bg-red-600 border-red-500 text-white',
    warning: 'bg-yellow-600 border-yellow-500 text-black',
    info: 'bg-blue-600 border-blue-500 text-white',
  };

  return (
    <div
      className={`fixed top-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-lg border-2 shadow-2xl animate-fade-in ${styles[type]}`}
      role="alert"
    >
      {icons[type]}
      <span className="text-lg font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-4 text-2xl font-bold opacity-70 hover:opacity-100"
        aria-label="Cerrar"
      >
        ×
      </button>
    </div>
  );
};

export default Toast;
