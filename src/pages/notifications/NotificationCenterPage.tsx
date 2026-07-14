import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useNotificationStore } from '../../stores/notification.store';
import { toast } from '../../stores';
import NotificationList from './components/NotificationList';
import NotificationDetail from './components/NotificationDetail';

export default function NotificationCenterPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedIdParam = searchParams.get('id');
  const selectedId = selectedIdParam ? Number(selectedIdParam) : null;

  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    deleteMultiple,
    markMultipleAsRead
  } = useNotificationStore();
  
  // Tabs: 'all' | 'unread' | 'important' | 'system'
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'important' | 'system'>('all');
  
  // Filter options
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Unread Count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Selected Notification
  const selectedNotif = notifications.find(n => n.id === selectedId) || null;

  // Mark selected notification as read when viewed - safe dependency array to avoid infinite loop
  useEffect(() => {
    if (selectedNotif && !selectedNotif.isRead) {
      markAsRead(selectedNotif.id);
    }
  }, [selectedId, selectedNotif?.isRead, markAsRead]);

  // Filter list
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread' && n.isRead) return false;
    if (activeTab === 'important' && n.priority !== 'CRITICAL' && n.priority !== 'HIGH') return false;
    if (activeTab === 'system' && n.type !== 'SYSTEM') return false;
    if (filterPriority !== 'all' && n.priority !== filterPriority) return false;
    if (filterType !== 'all' && n.type !== filterType) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-black select-none p-4 md:p-6">
      {/* Breadcrumb / Top control bar */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3 text-left">
          <button 
            onClick={() => navigate(-1)}
            className="p-1.5 hover:bg-slate-200 rounded-xl transition-all cursor-pointer text-black"
          >
            <ArrowLeft size={18} />
          </button>
          <span className="text-sm font-semibold">Thông báo</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Notification list subcomponent (col-span-7) */}
        <div className="lg:col-span-7">
          <NotificationList
            notifications={filteredNotifications}
            selectedId={selectedId}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            unreadCount={unreadCount}
            onSelect={(id) => setSearchParams({ id: String(id) })}
            onDelete={(id) => {
              deleteNotification(id);
              toast.success('Đã xóa thông báo');
              if (selectedId === id) setSearchParams({});
            }}
            onDeleteMultiple={deleteMultiple}
            onMarkMultipleAsRead={markMultipleAsRead}
            filterPriority={filterPriority}
            onFilterPriorityChange={setFilterPriority}
            filterType={filterType}
            onFilterTypeChange={setFilterType}
            onMarkAllAsRead={() => {
              markAllAsRead();
              toast.success('Đã đánh dấu tất cả thông báo là đã đọc');
            }}
          />
        </div>

        {/* Right Column: Notification Details subcomponent (col-span-5) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 min-h-[500px]">
          <NotificationDetail
            selectedNotif={selectedNotif}
            onMarkAsRead={(id) => {
              markAsRead(id);
              toast.success('Đã đánh dấu thông báo là đã đọc');
            }}
            onDelete={(id) => {
              deleteNotification(id);
              toast.success('Đã xóa thông báo');
              setSearchParams({});
            }}
          />
        </div>
      </div>
    </div>
  );
}
