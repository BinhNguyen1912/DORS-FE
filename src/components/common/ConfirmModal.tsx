import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  content: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  content,
  confirmText = 'Xác nhận xóa',
  cancelText = 'Hủy bỏ',
  variant = 'danger'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left font-sans">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            {variant === 'danger' && (
              <div className="p-1 rounded-lg bg-red-50 text-red-500">
                <AlertTriangle size={16} />
              </div>
            )}
            <span className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
              {title}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 rounded-lg transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5">
          <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-normal">
            {content}
          </p>
        </div>

        {/* Modal Actions */}
        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            {cancelText}
          </button>
          
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow-sm cursor-pointer",
              variant === 'danger' && "bg-red-600 hover:bg-red-700 text-white",
              variant === 'warning' && "bg-amber-500 hover:bg-amber-600 text-white",
              variant === 'info' && "bg-blue-600 hover:bg-blue-700 text-white"
            )}
          >
            {confirmText}
          </button>
        </div>

      </div>
    </div>
  );
}
