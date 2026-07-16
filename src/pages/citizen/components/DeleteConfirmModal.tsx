import { useState, useEffect } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import type { User } from '../../../types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  citizen: User | null;
  onConfirm: () => void;
  isLoading: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  citizen,
  onConfirm,
  isLoading,
}: DeleteConfirmModalProps) {
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
    }
  }, [isOpen]);

  if (!isOpen || !citizen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Content */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700/60 text-left flex flex-col font-sans">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider text-red-505">Xác nhận xóa</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs font-semibold leading-relaxed">
          {/* Warning banner */}
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 p-3.5 rounded-xl flex items-start gap-2.5">
            <AlertTriangle size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-red-700 dark:text-red-400 font-bold">
              Bạn có chắc chắn muốn xóa người dân này? Hành động này không thể hoàn tác.
            </p>
          </div>

          <div className="p-3 border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900/30 rounded-xl">
            <p className="font-bold text-gray-900 dark:text-white text-sm">{citizen.fullName}</p>
            <p className="text-[10px] text-gray-400 font-mono font-semibold mt-1">SĐT: {citizen.phone} - CCCD: {citizen.nationalId}</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-gray-500 dark:text-gray-400">Nhập "XÓA" để xác nhận</label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder='Nhập "XÓA"'
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500 text-center font-bold"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 select-none">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-gray-750 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-xl font-bold transition-all cursor-pointer shadow-sm bg-transparent"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading || confirmText !== 'XÓA'}
            className="flex items-center gap-1.5 px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all cursor-pointer shadow-sm disabled:bg-red-600 disabled:text-white disabled:opacity-50"
          >
            {isLoading && <Loader2 className="animate-spin" size={13} />}
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}
