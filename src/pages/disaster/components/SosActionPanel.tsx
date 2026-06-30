import { Edit3, Phone, ChevronRight } from 'lucide-react';
import type { SosRequest } from '../../../types';

interface SosActionPanelProps {
  sos: SosRequest;
  isUpdatingStatus: boolean;
  setIsUpdatingStatus: (u: boolean) => void;
  selectedNewStatus: string;
  setSelectedNewStatus: (s: string) => void;
  resolutionNotes: string;
  setResolutionNotes: (n: string) => void;
  isPending: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  handleCallPhone: (phone?: string) => void;
  onAssignTeam?: () => void;
  isAssigningTeam?: boolean;
}

export default function SosActionPanel({
  sos,
  isUpdatingStatus,
  setIsUpdatingStatus,
  selectedNewStatus,
  setSelectedNewStatus,
  resolutionNotes,
  setResolutionNotes,
  isPending,
  handleSubmit,
  handleCallPhone,
  onAssignTeam,
  isAssigningTeam,
}: SosActionPanelProps) {
  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 overflow-hidden">
      {/* Section header */}
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
        <div className="w-0.5 h-4 bg-blue-500 rounded-full flex-shrink-0" />
        <span className="text-xs font-bold uppercase tracking-widest text-gray-700 dark:text-gray-200">
          Hành động
        </span>
      </div>

      <div className="px-5 py-4">
        {isUpdatingStatus ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="block text-xs font-normal text-gray-500 dark:text-gray-400">
                Trạng thái mới <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={selectedNewStatus}
                onChange={(e) => setSelectedNewStatus(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal"
              >
                <option value="">-- Chọn trạng thái --</option>
                <option value="DISPATCHED">Đang di chuyển</option>
                <option value="ON_SITE">Đã tiếp cận hiện trường</option>
                <option value="RESOLVED">Hoàn thành</option>
                <option value="CANCELLED">Hủy bỏ</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-normal text-gray-500 dark:text-gray-400">
                Ghi chú / Lý do
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Nhập ghi chú..."
                rows={2}
                className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsUpdatingStatus(false)}
                className="px-4 py-2 text-sm font-normal border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 text-sm font-normal bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-60"
              >
                Cập nhật
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap gap-3">
            {!sos.assignedTeamId &&
              sos.status !== 'RESOLVED' &&
              sos.status !== 'CANCELLED' &&
              onAssignTeam && (
                <button
                  type="button"
                  onClick={onAssignTeam}
                  disabled={isAssigningTeam}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-bold shadow cursor-pointer disabled:opacity-60"
                >
                  <span>
                    {sos.status === 'PENDING_SPECIALIST'
                      ? 'Điều phối lại (Thử lại)'
                      : 'Kích hoạt Điều phối v6'}
                  </span>
                  <ChevronRight size={14} />
                </button>
              )}

            <button
              type="button"
              onClick={() => {
                setSelectedNewStatus(sos.status);
                setIsUpdatingStatus(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-normal"
            >
              <Edit3 size={14} className="text-gray-400" />
              <span>Cập nhật trạng thái</span>
              <ChevronRight size={14} className="text-gray-400" />
            </button>

            <button
              type="button"
              onClick={() => handleCallPhone(sos.requesterPhone || undefined)}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-normal"
            >
              <Phone size={14} className="text-gray-400" />
              <span>Liên hệ người gửi</span>
              <ChevronRight size={14} className="text-gray-400" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
