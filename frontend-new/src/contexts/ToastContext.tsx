import { createContext, useContext, ReactNode } from 'react';
import { useToast } from '../hooks/useToast';
import type { ToastType } from '../components/Toast';

interface ToastContextType {
  showToast: (type: ToastType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const toast = useToast();

  return (
    <ToastContext.Provider
      value={{
        showToast: toast.showToast,
        success: toast.success,
        error: toast.error,
        warning: toast.warning,
        info: toast.info,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within ToastProvider');
  }
  return context;
};
