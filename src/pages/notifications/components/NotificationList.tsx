import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Bell,
  Users2,
  Droplets,
  Volume2,
  ClipboardList,
  Trash2,
  CheckCircle,
  X
} from 'lucide-react';
import type { NotificationItem } from '../../../stores/notification.store';
import { cn } from '../../../lib/utils';
import ConfirmModal from '../../../components/common/ConfirmModal';
import { toast } from '../../../stores';

const stripHtml = (htmlString: string) => {
  if (!htmlString) return '';
  // Remove HTML tags and decode common entity &nbsp;
  return htmlString.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
};

interface NotificationListProps {
  notifications: NotificationItem[];
  selectedId: number | null;
  activeTab: 'all' | 'unread' | 'important' | 'system';
  onTabChange: (tab: 'all' | 'unread' | 'important' | 'system') => void;
  unreadCount: number;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onDeleteMultiple: (ids: number[]) => void;
  onMarkMultipleAsRead: (ids: number[]) => void;
  filterPriority: string;
  onFilterPriorityChange: (val: string) => void;
  filterType: string;
  onFilterTypeChange: (val: string) => void;
  onMarkAllAsRead: () => void;
}

export default function NotificationList({
  notifications,
  selectedId,
  activeTab,
  onTabChange,
  unreadCount,
  onSelect,
  onDelete,
  onDeleteMultiple,
  onMarkMultipleAsRead,
  filterPriority,
  onFilterPriorityChange,
  filterType,
  onFilterTypeChange,
  onMarkAllAsRead
}: NotificationListProps) {
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    content: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    content: '',
    onConfirm: () => {}
  });

  // Group by dateGroup
  const groupedNotifications: Record<string, NotificationItem[]> = {
    'Hôm nay': [],
    'Hôm qua': [],
    'Cũ hơn': []
  };

  notifications.forEach(n => {
    if (groupedNotifications[n.dateGroup]) {
      groupedNotifications[n.dateGroup].push(n);
    } else {
      groupedNotifications['Cũ hơn'].push(n);
    }
  });

  const handleCheckboxToggle = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisible = () => {
    const visibleIds = notifications.map(n => n.id);
    const allSelected = visibleIds.every(id => selectedIds.includes(id));
    
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một thông báo để xóa.');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: 'Xóa thông báo đã chọn',
      content: `Bạn có chắc chắn muốn xóa ${selectedIds.length} thông báo đã chọn? Hành động này không thể hoàn tác.`,
      onConfirm: () => {
        onDeleteMultiple(selectedIds);
        setSelectedIds([]);
      }
    });
  };

  const handleBulkMarkRead = () => {
    if (selectedIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một thông báo để đánh dấu đã đọc.');
      return;
    }
    onMarkMultipleAsRead(selectedIds);
    setSelectedIds([]);
  };

  const handleDeleteAll = () => {
    const allIds = notifications.map(n => n.id);
    if (allIds.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: 'Xóa toàn bộ thông báo',
      content: 'Bạn có chắc chắn muốn xóa TOÀN BỘ thông báo hiện tại không? Hành động này sẽ làm trống hộp thư của bạn.',
      onConfirm: () => {
        onDeleteMultiple(allIds);
        setSelectedIds([]);
      }
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'SOS':
        return (
          <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-red-655 text-[10px] font-bold shrink-0">
            SOS
          </div>
        );
      case 'RESCUE':
        return (
          <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-650 shrink-0">
            <Users2 size={16} />
          </div>
        );
      case 'FLOOD':
        return (
          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-650 shrink-0">
            <Droplets size={16} />
          </div>
        );
      case 'SYSTEM':
        return (
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-650 shrink-0">
            <Volume2 size={16} />
          </div>
        );
      case 'HELP':
        return (
          <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-655 shrink-0">
            <ClipboardList size={16} />
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-650 shrink-0">
            <Bell size={16} />
          </div>
        );
    }
  };

  const isAllSelected = notifications.length > 0 && notifications.every(n => selectedIds.includes(n.id));

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col text-left">
      {/* Dynamic Header Action Bar */}
      <div className="px-5 py-3.5 border-b border-slate-150 flex items-center justify-between min-h-[57px]">
        {selectedIds.length > 0 ? (
          /* Email-like Bulk Action Bar */
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer font-normal text-xs text-black">
                <input 
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAllVisible}
                  className="rounded text-blue-600 border-slate-350 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span className="font-semibold text-black/70">Đã chọn {selectedIds.length}</span>
              </label>
              <div className="h-4 w-px bg-slate-300 mx-1" />
              
              <button
                onClick={handleBulkMarkRead}
                className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-155 rounded-xl text-xs text-blue-600 transition-all cursor-pointer font-normal"
              >
                <CheckCircle size={13} />
                <span>Đánh dấu đã đọc</span>
              </button>

              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-red-50 rounded-xl text-xs text-red-500 transition-all cursor-pointer font-normal"
              >
                <Trash2 size={13} />
                <span>Xóa mục đã chọn</span>
              </button>
            </div>

            <button
              onClick={() => setSelectedIds([])}
              className="p-1 hover:bg-slate-100 rounded-lg text-black transition-all cursor-pointer"
              title="Hủy chọn"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          /* Standard Action Bar */
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox"
                checked={false}
                onChange={handleSelectAllVisible}
                disabled={notifications.length === 0}
                className="rounded text-blue-600 border-slate-350 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer disabled:opacity-50"
                title="Chọn hàng loạt"
              />
              <span className="font-bold text-base">Thông báo</span>
            </div>
            
            <div className="flex items-center gap-3 text-xs font-normal">
              {/* Filter Popover */}
              <div className="relative">
                <button 
                  onClick={() => setShowFilterPopover(!showFilterPopover)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer text-black"
                >
                  <SlidersHorizontal size={13} />
                  <span>Bộ lọc</span>
                </button>

                {showFilterPopover && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 shadow-lg rounded-xl p-3.5 z-40 space-y-3 text-left">
                    <span className="font-bold text-[10px] text-black uppercase tracking-wider block">Bộ lọc thông báo</span>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-black/60 font-semibold block">Mức độ ưu tiên</label>
                      <select 
                        value={filterPriority}
                        onChange={(e) => onFilterPriorityChange(e.target.value)}
                        className="w-full border border-slate-250 rounded-lg px-2 py-1 text-xs bg-white text-black"
                      >
                        <option value="all">Tất cả mức độ</option>
                        <option value="CRITICAL">Khẩn cấp (SOS)</option>
                        <option value="HIGH">Quan trọng / Cao</option>
                        <option value="MEDIUM">Trung bình</option>
                        <option value="LOW">Thấp / Hệ thống</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-black/60 font-semibold block">Loại thông báo</label>
                      <select 
                        value={filterType}
                        onChange={(e) => onFilterTypeChange(e.target.value)}
                        className="w-full border border-slate-250 rounded-lg px-2 py-1 text-xs bg-white text-black"
                      >
                        <option value="all">Tất cả loại tin</option>
                        <option value="SOS">Yêu cầu SOS</option>
                        <option value="RESCUE">Điều phối cứu trợ</option>
                        <option value="FLOOD">Cảnh báo ngập</option>
                        <option value="SYSTEM">Hệ thống</option>
                        <option value="HELP">Hỗ trợ thường</option>
                      </select>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button 
                        onClick={() => {
                          onFilterPriorityChange('all');
                          onFilterTypeChange('all');
                          setShowFilterPopover(false);
                        }}
                        className="flex-1 py-1 text-center bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-normal"
                      >
                        Xóa lọc
                      </button>
                      <button 
                        onClick={() => setShowFilterPopover(false)}
                        className="flex-1 py-1 text-center bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-normal"
                      >
                        Áp dụng
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={onMarkAllAsRead}
                disabled={unreadCount === 0}
                className="text-blue-600 hover:underline cursor-pointer disabled:opacity-50"
              >
                Đánh dấu tất cả đã đọc
              </button>

              <button 
                onClick={handleDeleteAll}
                disabled={notifications.length === 0}
                className="text-red-500 hover:underline cursor-pointer font-semibold disabled:opacity-50"
              >
                Xóa tất cả
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs px-4 gap-2 font-normal">
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'unread', label: `Chưa đọc`, count: unreadCount },
          { key: 'important', label: 'Quan trọng' },
          { key: 'system', label: 'Hệ thống' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key as any)}
            className={cn(
              "pb-2.5 pt-3 px-2 border-b-2 text-xs transition-all cursor-pointer font-normal flex items-center gap-1.5",
              activeTab === tab.key
                ? "text-blue-600 border-blue-600"
                : "text-black hover:text-blue-600 border-transparent"
            )}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List items */}
      <div className="divide-y divide-slate-100 max-h-[550px] overflow-y-auto bg-slate-50/20">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-black font-normal bg-white">
            Hộp thư của bạn đang trống. Hãy thử gửi thông báo từ tab "Gửi thông báo hàng loạt"!
          </div>
        ) : (
          ['Hôm nay', 'Hôm qua', 'Cũ hơn'].map(groupName => {
            const groupItems = groupedNotifications[groupName] || [];
            if (groupItems.length === 0) return null;

            return (
              <div key={groupName} className="bg-white">
                <div className="bg-slate-50/80 px-4 py-1.5 border-y border-slate-100 text-[10px] text-black font-bold uppercase tracking-wider text-left">
                  {groupName}
                </div>

                <div className="divide-y divide-slate-100">
                  {groupItems.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => onSelect(notif.id)}
                      className={cn(
                        "flex items-start gap-3.5 px-5 py-4 hover:bg-slate-50/50 cursor-pointer transition-colors relative text-left group",
                        selectedId === notif.id && "bg-slate-50 border-l-4 border-blue-650",
                        !notif.isRead && "bg-blue-50/15"
                      )}
                    >
                      {/* Checkbox for Bulk Actions (Email Style) */}
                      <div 
                        onClick={(e) => handleCheckboxToggle(notif.id, e)}
                        className="self-center pr-1 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(notif.id)}
                          readOnly
                          className="rounded text-blue-600 border-slate-350 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                      </div>

                      {getNotificationIcon(notif.type)}

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className={cn(
                            "text-xs text-black leading-snug font-normal block truncate",
                            !notif.isRead && "font-semibold"
                          )}>
                            {notif.title}
                          </span>
                          <span className="text-[10px] text-black/50 shrink-0 font-normal">
                            {notif.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-black/75 leading-relaxed line-clamp-2 font-normal">
                          {stripHtml(notif.content)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-center">
                        {!notif.isRead && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full shrink-0" />
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmModal({
                              isOpen: true,
                              title: 'Xóa thông báo',
                              content: 'Bạn có chắc chắn muốn xóa thông báo này không?',
                              onConfirm: () => onDelete(notif.id)
                            });
                          }}
                          className="p-1 hover:bg-red-50 text-red-500 rounded transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Xóa thông báo"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
      
      <div className="bg-slate-50 border-t border-slate-150 px-5 py-3 text-center text-[10px] text-black/60 font-semibold uppercase tracking-wider">
        Đã tải hết ✓
      </div>

      {/* Confirmation Modal overlay */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        content={confirmModal.content}
      />
    </div>
  );
}
