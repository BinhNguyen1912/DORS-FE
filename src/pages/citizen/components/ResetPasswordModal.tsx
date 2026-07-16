import { useState, useEffect } from 'react';
import { X, Loader2, SlidersHorizontal } from 'lucide-react';
import type { User } from '../../../types';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  citizen: User | null;
  onSubmit: (newPass: string) => void;
  isLoading: boolean;
}

export default function ResetPasswordModal({
  isOpen,
  onClose,
  citizen,
  onSubmit,
  isLoading,
}: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [method, setMethod] = useState<'SMS' | 'EMAIL'>('SMS');

  useEffect(() => {
    if (isOpen) {
      setNewPassword(Math.floor(100000 + Math.random() * 900000).toString()); // Random 6 digit default
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
          <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Đặt lại mật khẩu</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs font-semibold leading-relaxed">
          {/* Info banner */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 p-3.5 rounded-xl flex items-start gap-2.5">
            <SlidersHorizontal size={15} className="text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-blue-700 dark:text-blue-400 font-medium">
              Hệ thống sẽ gửi mật khẩu mới tới số điện thoại hoặc email của người dân.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-gray-500 dark:text-gray-400">Người nhận</label>
            <p className="font-bold text-gray-900 dark:text-white text-sm">
              {citizen.fullName} - {citizen.phone}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-gray-500 dark:text-gray-400">Mật khẩu mới</label>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-bold text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-gray-500 dark:text-gray-400 block mb-1">Phương thức nhận</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer font-bold">
                <input
                  type="radio"
                  name="pwd_method"
                  checked={method === 'SMS'}
                  onChange={() => setMethod('SMS')}
                  className="accent-blue-600"
                />
                Gửi qua SMS
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-bold">
                <input
                  type="radio"
                  name="pwd_method"
                  checked={method === 'EMAIL'}
                  onChange={() => setMethod('EMAIL')}
                  className="accent-blue-600"
                  disabled={!citizen.email}
                />
                Gửi qua Email
              </label>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 select-none">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-gray-750 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-xl font-bold transition-all cursor-pointer shadow-sm"
          >
            Hủy
          </button>
          <button
            onClick={() => onSubmit(newPassword)}
            disabled={isLoading || !newPassword.trim()}
            className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-60"
          >
            {isLoading && <Loader2 className="animate-spin" size={13} />}
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
