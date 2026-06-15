import { useToastStore } from '../../stores/toast.store';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 w-full max-w-[340px] pointer-events-none">
      {toasts.map((toast) => {
        let borderClass = 'border-blue-100 dark:border-blue-900/30';
        
        if (toast.type === 'success') {
          borderClass = 'border-emerald-100 dark:border-emerald-900/30';
        } else if (toast.type === 'error') {
          borderClass = 'border-rose-100 dark:border-rose-900/30';
        } else if (toast.type === 'warning') {
          borderClass = 'border-amber-100 dark:border-amber-900/30';
        }

        return (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 p-3 rounded-xl border shadow-md bg-white/95 dark:bg-gray-850/95 backdrop-blur-sm transition-all duration-300 animate-in slide-in-from-right fade-in-20",
              borderClass
            )}
          >
            <div className="flex-1 min-w-0 pt-0.5 text-left">
              <p className="text-xs font-medium text-gray-900 dark:text-white leading-normal break-words">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex-shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
