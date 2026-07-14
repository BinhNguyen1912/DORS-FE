import { useState, useEffect } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import type { AdministrativeUnit } from '../../../types';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  areaFilter: string;
  setAreaFilter: (v: string) => void;
  verifFilter: string;
  setVerifFilter: (v: string) => void;
  supportFilter: string;
  setSupportFilter: (v: string) => void;
  adminUnits: AdministrativeUnit[];
  onClear: () => void;
}

export default function FilterModal({
  isOpen,
  onClose,
  areaFilter,
  setAreaFilter,
  verifFilter,
  setVerifFilter,
  supportFilter,
  setSupportFilter,
  adminUnits,
  onClear,
}: FilterModalProps) {
  const [tempArea, setTempArea] = useState(areaFilter);
  const [tempVerif, setTempVerif] = useState(verifFilter);
  const [tempSupport, setTempSupport] = useState(supportFilter);

  useEffect(() => {
    if (isOpen) {
      setTempArea(areaFilter);
      setTempVerif(verifFilter);
      setTempSupport(supportFilter);
    }
  }, [isOpen, areaFilter, verifFilter, supportFilter]);

  if (!isOpen) return null;

  const handleApply = () => {
    setAreaFilter(tempArea);
    setVerifFilter(tempVerif);
    setSupportFilter(tempSupport);
    onClose();
  };

  const handleClear = () => {
    setTempArea('');
    setTempVerif('');
    setTempSupport('');
    onClear();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 select-none">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700/60 text-left flex flex-col font-sans">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <SlidersHorizontal size={14} className="text-blue-500" />
            Bộ lọc nâng cao
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs font-semibold leading-relaxed">
          {/* Area filter */}
          <div className="space-y-1">
            <label className="text-gray-500 dark:text-gray-400">Khu vực (Phường/Xã)</label>
            <select
              value={tempArea}
              onChange={(e) => setTempArea(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-bold"
            >
              <option value="">Tất cả khu vực</option>
              {adminUnits.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* Verification status */}
          <div className="space-y-1">
            <label className="text-gray-500 dark:text-gray-400">Trạng thái xác minh</label>
            <select
              value={tempVerif}
              onChange={(e) => setTempVerif(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-bold"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="verified">Đã xác minh</option>
              <option value="unverified">Chưa xác minh</option>
            </select>
          </div>

          {/* Support status */}
          <div className="space-y-1">
            <label className="text-gray-500 dark:text-gray-400">Tình trạng hỗ trợ</label>
            <select
              value={tempSupport}
              onChange={(e) => setTempSupport(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-bold"
            >
              <option value="">Tất cả tình trạng</option>
              <option value="normal">Bình thường</option>
              <option value="needs_help">Cần hỗ trợ</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between gap-3 select-none">
          <button
            onClick={handleClear}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl font-bold transition-all cursor-pointer bg-transparent"
          >
            Xóa lọc
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-gray-750 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-xl font-bold transition-all cursor-pointer bg-transparent"
            >
              Hủy
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all cursor-pointer shadow-sm"
            >
              Áp dụng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
