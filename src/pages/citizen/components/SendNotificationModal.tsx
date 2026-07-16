import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { User } from '../../../types';

interface SendNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  citizen: User | null;
  onSubmit: (title: string, body: string, type: string) => void;
  isLoading: boolean;
}

export default function SendNotificationModal({
  isOpen,
  onClose,
  citizen,
  onSubmit,
  isLoading,
}: SendNotificationModalProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('sos_alert');
  const [useSms, setUseSms] = useState(true);
  const [useEmail, setUseEmail] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle('Thông báo khẩn cấp');
      setBody('');
      setType('sos_alert');
      setUseSms(true);
      setUseEmail(false);
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
          <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Gửi thông báo</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs font-semibold leading-relaxed">
          <div className="space-y-1">
            <label className="text-gray-500 dark:text-gray-400">Người nhận</label>
            <p className="font-bold text-gray-900 dark:text-white text-sm">
              {citizen.fullName} - {citizen.phone}
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-gray-500 dark:text-gray-400">Tiêu đề thông báo *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-gray-500 dark:text-gray-400">Nội dung thông báo *</label>
              <span className="text-[10px] text-gray-400 font-medium">{body.length}/500</span>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, 500))}
              placeholder="Nhập nội dung thông báo..."
              rows={4}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-gray-500 dark:text-gray-400">Loại tin nhắn</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="sos_alert">SOS Alert</option>
                <option value="rescue_assigned">Điều phối cứu trợ</option>
                <option value="system_alert">Hệ thống</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-gray-500 dark:text-gray-400 block mb-1">Phương thức gửi</label>
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={useSms}
                    onChange={(e) => setUseSms(e.target.checked)}
                    className="accent-blue-600"
                  />
                  SMS
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={useEmail}
                    onChange={(e) => setUseEmail(e.target.checked)}
                    className="accent-blue-600"
                    disabled={!citizen.email}
                  />
                  Email
                </label>
              </div>
            </div>
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
            onClick={() => onSubmit(title, body, type)}
            disabled={isLoading || !title.trim() || !body.trim()}
            className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-60"
          >
            {isLoading && <Loader2 className="animate-spin" size={13} />}
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
}
