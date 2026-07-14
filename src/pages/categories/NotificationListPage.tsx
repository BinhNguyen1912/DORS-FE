import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  Volume2,
  FileText,
  Send,
  Sliders,
  History,
  Settings,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { notificationApi } from '../../apis';

// Import subcomponents
import MetricsHeader from './components/MetricsHeader';
import EventTab from './components/EventTab';
import TemplateTab from './components/TemplateTab';
import SentTab from './components/SentTab';
import BulkTab from './components/BulkTab';
import HistoryTab from './components/HistoryTab';
import ChannelTab from './components/ChannelTab';

export default function NotificationListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab = tabParam ? parseInt(tabParam, 10) : 1;

  // 1. Fetch real events from Backend API
  const { data: dbEvents = [], refetch: refetchEvents } = useQuery({
    queryKey: ['notification-events-list'],
    queryFn: () => notificationApi.getEvents(),
  });

  // 2. Fetch real templates from Backend API
  const { data: dbTemplates = [], refetch: refetchTemplates } = useQuery({
    queryKey: ['notification-templates-list'],
    queryFn: () => notificationApi.getTemplates(),
  });

  // 3. Fetch real sent notifications from Backend API
  const { data: dbSentNotifications = [] } = useQuery({
    queryKey: ['notification-sent-list'],
    queryFn: () => notificationApi.getSentNotifications(),
  });



  const setActiveTab = (tabIndex: number) => {
    setSearchParams({ tab: tabIndex.toString() });
  };

  // Convert raw DB events to frontend-compatible structure
  const events = dbEvents.map((ev: any) => ({
    id: ev.id,
    code: ev.code,
    name: ev.name,
    group: ev.code.split('_')[0] || 'SYSTEM',
    status: ev.isActive ? 'ACTIVE' : 'INACTIVE',
    priority: 'MEDIUM',
    description: ev.name,
    createdAt: ev.createdAt ? new Date(ev.createdAt).toLocaleString('vi-VN') : '---',
    updatedAt: ev.createdAt ? new Date(ev.createdAt).toLocaleString('vi-VN') : '---'
  }));

  // Convert raw DB templates to frontend-compatible structure
  const templates = dbTemplates.map((tpl: any) => ({
    id: tpl.id,
    code: tpl.code,
    name: tpl.name,
    eventCode: tpl.event?.code || 'SYSTEM_NOTICE',
    group: tpl.group?.code || 'SYSTEM',
    priority: tpl.defaultPriority,
    channels: (tpl.defaultChannels || ['APP']) as any,
    title: tpl.titleTemplate,
    content: tpl.contentTemplate,
    isActive: tpl.isActive
  }));

  // Convert raw DB sent notifications to frontend-compatible structure
  const sentNotifications = dbSentNotifications.map((notif: any) => ({
    id: notif.id,
    title: notif.title || 'Thông báo',
    content: notif.content || '',
    priority: notif.priority || 'MEDIUM',
    status: notif.status || 'COMPLETED',
    channels: notif.template?.defaultChannels || ['APP'],
    sentCount: 1,
    successCount: 1,
    time: notif.createdAt ? new Date(notif.createdAt).toLocaleString('vi-VN') : '---'
  }));

  // Calculate dynamic metrics for the metrics header
  const sentTodayCount = dbSentNotifications.filter((notif: any) => {
    if (!notif.createdAt) return false;
    const createdDate = new Date(notif.createdAt);
    const today = new Date();
    return createdDate.toDateString() === today.toDateString();
  }).length;

  const totalSent = dbSentNotifications.length;
  const successSent = dbSentNotifications.filter((n: any) => n.status === 'SENT' || n.status === 'SUCCESS').length;
  const successRate = totalSent > 0 ? Number(((successSent / totalSent) * 100).toFixed(1)) : 100;

  return (
    <div className="p-6 space-y-6 select-none bg-slate-50/50 dark:bg-gray-950 min-h-screen text-xs font-semibold text-gray-900 dark:text-gray-150">

      {/* 1. Breadcrumbs & Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            Quản lý thông báo
          </h2>
          <div className="flex items-center gap-1.5 text-slate-900 dark:text-white mt-1.5 font-medium text-[10px]">
            <span>Trang chủ</span>
            <ChevronRight size={10} />
            <span>Quản trị hệ thống</span>
            <ChevronRight size={10} />
            <span className="text-slate-900 dark:text-white font-bold">Thông báo</span>
          </div>
        </div>
      </div>

      {/* 2. Top Metrics (KPIs) */}
      <MetricsHeader 
        totalEvents={events.length}
        totalTemplates={templates.length}
        sentToday={sentTodayCount}
        successRate={successRate}
      />

      {/* 3. Horizontal Tabs Navigation */}
      <div className="flex text-black flex-wrap gap-2 pb-px">
        {[
          { key: 1, label: 'Sự kiện', icon: Volume2 },
          { key: 2, label: 'Mẫu thông báo', icon: FileText },
          { key: 3, label: 'Thông báo đã gửi', icon: Send },
          { key: 4, label: 'Gửi thông báo hàng loạt', icon: Sliders },
          { key: 5, label: 'Lịch sử gửi', icon: History },
          { key: 6, label: 'Kênh gửi & cấu hình', icon: Settings },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4.5 py-2.5 rounded-t-xl transition-all cursor-pointer font-extrabold uppercase tracking-wider text-[10px] border-b-2",
                activeTab === tab.key
                  ? "bg-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-500"
                  : "bg-transparent text-slate-900 dark:text-white hover:text-amber-600 border-transparent opacity-80 hover:opacity-100"
              )}
            >
              <Icon size={13} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 4. Tab Content Area */}
      {activeTab === 1 && <EventTab events={events} templates={templates} />}
      {activeTab === 2 && <TemplateTab templates={templates} onRefresh={refetchTemplates} />}
      {activeTab === 3 && <SentTab sentNotifications={sentNotifications} />}
      {activeTab === 4 && <BulkTab events={events} templates={templates} />}
      {activeTab === 5 && <HistoryTab />}
      {activeTab === 6 && <ChannelTab />}

    </div>
  );
}
