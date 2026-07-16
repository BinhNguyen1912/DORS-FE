import React, { useState } from 'react';
import { Check, Trash2 } from 'lucide-react';
import type { NotificationItem } from '../../../stores/notification.store';
import { cn } from '../../../lib/utils';
import ConfirmModal from '../../../components/common/ConfirmModal';

interface NotificationDetailProps {
  selectedNotif: NotificationItem | null;
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function NotificationDetail({
  selectedNotif,
  onMarkAsRead,
  onDelete
}: NotificationDetailProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'Khẩn cấp';
      case 'HIGH': return 'Quan trọng';
      case 'MEDIUM': return 'Trung bình';
      case 'LOW': return 'Thấp';
      default: return 'Trung bình';
    }
  };

  if (!selectedNotif) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 text-center space-y-2 font-normal">
        <span className="text-4xl">🔔</span>
        <span className="text-xs text-black font-semibold">Chọn một thông báo</span>
        <span className="text-[10px] text-black/60 max-w-[200px]">Bấm vào danh sách bên trái để xem thông tin chi tiết</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-normal">
      {/* Detail Header Control */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
        <span className="font-semibold text-xs text-black uppercase tracking-wider">
          Chi tiết thông báo
        </span>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setIsConfirmOpen(true)}
            className="p-1 hover:bg-slate-100 text-red-500 rounded transition-all cursor-pointer"
            title="Xóa thông báo"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Badges / Category Tags */}
      <div className="flex gap-1.5">
        <span className={cn(
          "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border",
          selectedNotif.type === 'SOS' && "bg-red-50 border-red-200 text-red-700",
          selectedNotif.type === 'RESCUE' && "bg-purple-50 border-purple-200 text-purple-700",
          selectedNotif.type === 'FLOOD' && "bg-emerald-50 border-emerald-200 text-emerald-700",
          selectedNotif.type === 'SYSTEM' && "bg-blue-50 border-blue-200 text-blue-700",
          selectedNotif.type === 'HELP' && "bg-amber-50 border-amber-200 text-amber-700"
        )}>
          {selectedNotif.type}
        </span>
        <span className={cn(
          "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border",
          selectedNotif.priority === 'CRITICAL' && "bg-red-100 border-red-300 text-red-800",
          selectedNotif.priority === 'HIGH' && "bg-orange-100 border-orange-300 text-orange-800",
          selectedNotif.priority === 'MEDIUM' && "bg-blue-100 border-blue-300 text-blue-800",
          selectedNotif.priority === 'LOW' && "bg-slate-100 border-slate-300 text-slate-800"
        )}>
          {getPriorityLabel(selectedNotif.priority)}
        </span>
      </div>

      {/* Title & Time */}
      <div className="space-y-1">
        <h2 className="font-bold text-lg text-black leading-tight">
          {selectedNotif.title}
        </h2>
        <div className="flex items-center gap-1.5 text-[10px] text-black/60">
          <span>🕒 {selectedNotif.time}</span>
          <span>•</span>
          <span>{selectedNotif.createdAt ? new Date(selectedNotif.createdAt).toLocaleDateString('vi-VN') : '01/06/2026'}</span>
        </div>
      </div>

      {/* Subtitle / Description Summary */}
      <div 
        className="text-black/85 text-xs font-normal leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-150 text-left"
        dangerouslySetInnerHTML={{ __html: selectedNotif.content }}
      />

      {/* Card Meta Grid (Địa điểm, Mức độ ưu tiên, v.v.) */}
      {selectedNotif.meta && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5 text-xs">
          {Object.entries(selectedNotif.meta).map(([key, val]) => (
            <div key={key} className="flex justify-between items-center gap-4 border-b border-slate-100 last:border-b-0 pb-1.5 last:pb-0">
              <span className="text-[10px] text-black/60 uppercase tracking-wider font-semibold">{key}</span>
              <span className={cn(
                "font-medium text-black text-right",
                val === 'Khẩn cấp' && "text-red-655 font-bold"
              )}>
                {val}
              </span>
            </div>
          ))}
        </div>
      )}



      {/* Mark as read action */}
      <div className="pt-4 border-t border-slate-100">
        <button
          type="button"
          disabled={selectedNotif.isRead}
          onClick={() => onMarkAsRead(selectedNotif.id)}
          className={cn(
            "w-full py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer font-semibold",
            selectedNotif.isRead 
              ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white shadow"
          )}
        >
          <Check size={14} />
          <span>{selectedNotif.isRead ? 'Đã đọc' : 'Đánh dấu đã đọc'}</span>
        </button>
      </div>

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => onDelete(selectedNotif.id)}
        title="Xóa thông báo"
        content="Bạn có chắc chắn muốn xóa thông báo này? Hành động này sẽ loại bỏ hoàn toàn thông báo khỏi tài khoản của bạn."
      />
    </div>
  );
}
