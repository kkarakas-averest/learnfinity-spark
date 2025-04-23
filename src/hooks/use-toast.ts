
import { useState, useEffect, useCallback } from 'react';
import * as ToastPrimitives from "@radix-ui/react-toast";
import {
  ToastActionElement,
  ToastProps as ShadcnToastProps
} from '@/components/ui/toast';

export type ToastProps = ShadcnToastProps & {
  id?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'destructive';
};

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 1000000;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

const toasts: Map<string, ToastProps> = new Map();

const listeners: Array<(toasts: Map<string, ToastProps>) => void> = [];

function emitChange() {
  listeners.forEach((listener) => {
    listener(toasts);
  });
}

export function toast(props: ToastProps) {
  const id = props.id || genId();
  const timeoutId = setTimeout(() => {
    dismissToast(id);
  }, TOAST_REMOVE_DELAY);

  toasts.set(id, { ...props, id });
  emitChange();

  return id;
}

export function dismissToast(id: string) {
  toasts.delete(id);
  emitChange();
}

export function useToast() {
  const [toastState, setToastState] = useState<Map<string, ToastProps>>(new Map());

  useEffect(() => {
    const listener = (newToasts: Map<string, ToastProps>) => {
      setToastState(new Map(newToasts));
    };

    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  const showToast = useCallback((props: ToastProps) => {
    return toast(props);
  }, []);

  const dismissToastById = useCallback((id: string) => {
    dismissToast(id);
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
    toast: showToast,
    toasts: Array.from(toastState.values()),
    showToast,
    dismissToast: dismissToastById,
    error,
    success,
  };
}
