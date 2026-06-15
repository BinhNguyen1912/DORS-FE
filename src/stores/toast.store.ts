import { create } from 'zustand';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface ToastState {
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (type, message, duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, type, message }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

export const toast = {
  success: (message: string, duration?: number) =>
    useToastStore.getState().addToast('success', message, duration),
  error: (message: string, duration?: number) =>
    useToastStore.getState().addToast('error', message, duration),
  info: (message: string, duration?: number) =>
    useToastStore.getState().addToast('info', message, duration),
  warning: (message: string, duration?: number) =>
    useToastStore.getState().addToast('warning', message, duration),
  
  api: (responseOrError: any, defaultSuccessMessage?: string) => {
    // 1. Check if it's an error
    const isError =
      responseOrError instanceof Error ||
      (responseOrError &&
        (responseOrError.isAxiosError || responseOrError.response || responseOrError.stack));

    if (isError) {
      let errorMessage = 'Đã xảy ra lỗi hệ thống';
      if (responseOrError.response?.data) {
        const data = responseOrError.response.data;
        errorMessage = data.message || data.error || errorMessage;
      } else if (responseOrError.message) {
        errorMessage = responseOrError.message;
      } else if (typeof responseOrError === 'string') {
        errorMessage = responseOrError;
      }
      toast.error(errorMessage);
      return;
    }

    // 2. Otherwise treat as a success response or standard response structure
    if (responseOrError) {
      // If it's Axios response status check: { status, data: { message, data } }
      if (responseOrError.status >= 200 && responseOrError.status < 300) {
        const message = responseOrError.data?.message || defaultSuccessMessage;
        if (message) {
          toast.success(message);
        }
        return;
      }

      // If it is a raw api response object that might have success: boolean
      if (typeof responseOrError === 'object') {
        if ('success' in responseOrError && responseOrError.success === false) {
          const message = responseOrError.message || 'Đã xảy ra lỗi';
          toast.error(message);
          return;
        }
        const message = responseOrError.message || defaultSuccessMessage;
        if (message) {
          toast.success(message);
        }
        return;
      }
    }

    if (defaultSuccessMessage) {
      toast.success(defaultSuccessMessage);
    }
  },
};
