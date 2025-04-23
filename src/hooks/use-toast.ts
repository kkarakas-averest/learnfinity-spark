
import { useState, useEffect, useCallback } from 'react';
import { toast as toastFunction } from '@/components/ui/toast';

export type ToastProps = {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'destructive';
};

export const toast = toastFunction;

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = useCallback((props: ToastProps) => {
    const id = Date.now().toString();
    setToasts((prevToasts) => [...prevToasts, { ...props, id }]);
    toastFunction({ ...props });
    return id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const error = useCallback((title: string, description?: string) => {
    return showToast({
      title,
      description,
      variant: 'destructive',
    });
  }, [showToast]);

  const success = useCallback((title: string, description?: string) => {
    return showToast({
      title,
      description,
      variant: 'default',
    });
  }, [showToast]);

  return {
    toasts,
    showToast,
    dismissToast,
    error,
    success,
  };
}
