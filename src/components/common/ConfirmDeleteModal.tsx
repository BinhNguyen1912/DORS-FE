import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  title?: string;
  message?: string;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  title = 'Xác nhận xóa',
  message = 'Bạn có chắc chắn muốn thực hiện hành động này?',
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Box */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 dark:border-gray-700 text-left transform transition-all scale-100">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-red-50 dark:bg-red-950/30 text-red-500 rounded-xl flex-shrink-0">
            <AlertTriangle size={22} />
          </div>
          <div className="space-y-1.5 flex-1">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
              {title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2.5 mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl font-bold text-xs shadow-sm transition-all"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            {isLoading && <Loader2 className="animate-spin" size={12} />}
            Xác nhận xóa
          </button>
        </div>
      </div>
    </div>
  );
}
