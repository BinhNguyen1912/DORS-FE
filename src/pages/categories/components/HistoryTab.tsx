import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, RefreshCw, CheckCircle, XCircle, Volume2, MessageSquare, Mail, BellRing } from 'lucide-react';
import { notificationApi } from '../../../apis';
import { cn } from '../../../lib/utils';

export default function HistoryTab() {
  const [selectedChannel, setSelectedChannel] = useState<'APP' | 'SMS' | 'EMAIL' | 'PUSH'>('APP');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('Tất cả vai trò');
  const [selectedStatus, setSelectedStatus] = useState('Tất cả trạng thái');

  // Fetch logs filtered by selected channel to avoid loading huge volumes
  const { data: dbLogs = [], refetch, isLoading } = useQuery({
    queryKey: ['notification-logs-list', selectedChannel],
    queryFn: () => notificationApi.getLogs(selectedChannel),
  });

  // Convert raw DB logs to frontend-compatible structure
  const logs = dbLogs.map((log: any) => ({
    id: log.id,
    name: log.recipient?.user?.fullName || 'Người nhận',
    phone: log.recipient?.user?.phone || 'Chưa cập nhật',
    role: log.recipient?.user?.role || 'Người dùng',
    channel: log.channel || 'APP',
    time: log.sentAt ? new Date(log.sentAt).toLocaleString('vi-VN') : '---',
    status: log.status || 'SUCCESS',
    details: log.message || 'Đã gửi thành công'
  }));

  // Role translations for filtering
  const roleTranslations: Record<string, string> = {
    'Người dân': 'USER',
    'Tình nguyện viên': 'VOLUNTEER',
    'Đội cứu hộ': 'RESCUE_TEAM_LEADER',
    'Trưởng cộng đồng': 'COMMUNITY_LEADER',
  };

  // Filter logs based on inputs
  const filteredLogs = logs.filter(log => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      log.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.phone.includes(searchQuery);

    // Role filter
    let matchesRole = true;
    if (selectedRole !== 'Tất cả vai trò') {
      const dbRole = roleTranslations[selectedRole];
      matchesRole = log.role === dbRole;
    }

    // Status filter
    let matchesStatus = true;
    if (selectedStatus !== 'Tất cả trạng thái') {
      const filterStatus = selectedStatus === 'Thành công (SUCCESS)' ? 'SUCCESS' : 'FAILED';
      matchesStatus = log.status === filterStatus || (filterStatus === 'SUCCESS' && log.status === 'SENT');
    }

    return matchesSearch && matchesRole && matchesStatus;
  });

  const channelsList = [
    { key: 'APP', label: 'In-App', icon: BellRing },
    { key: 'SMS', label: 'SMS', icon: MessageSquare },
    { key: 'EMAIL', label: 'Email', icon: Mail },
    { key: 'PUSH', label: 'Push Notification', icon: Volume2 },
  ] as const;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 space-y-4 select-none">
      
      {/* Tab Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
            Lịch sử gửi tin hệ thống
          </h3>
          <p className="text-[9.5px] text-slate-400 font-normal mt-0.5">
            Xem logs chi tiết theo từng kênh truyền tải để tối ưu hiệu suất truy vấn.
          </p>
        </div>
        <button 
          onClick={() => refetch()}
          disabled={isLoading}
          className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer text-[10px] text-slate-900 dark:text-white disabled:opacity-50"
        >
          <RefreshCw size={11} className={cn(isLoading && "animate-spin")} />
          Tải lại logs
        </button>
      </div>

      {/* Channel Selector Tabs (Mandatory Filter) */}
      <div className="flex gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
        {channelsList.map(ch => {
          const Icon = ch.icon;
          const isActive = selectedChannel === ch.key;
          return (
            <button
              key={ch.key}
              onClick={() => setSelectedChannel(ch.key)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer border",
                isActive 
                  ? "bg-amber-500/10 text-amber-600 border-amber-500 dark:text-amber-400"
                  : "bg-slate-50 dark:bg-gray-850 text-slate-500 border-transparent hover:bg-slate-100 dark:hover:bg-gray-800"
              )}
            >
              <Icon size={12} />
              {ch.label}
            </button>
          );
        })}
      </div>

      {/* Query Filters */}
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-450 dark:text-gray-400" size={13} />
          <input
            type="text"
            placeholder="Tìm kiếm người nhận bằng họ tên hoặc số điện thoại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8.5 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-gray-955 text-gray-900 dark:text-white text-[10px] focus:outline-none"
          />
        </div>
        <select 
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-[10px] bg-white dark:bg-gray-955 text-slate-900 dark:text-white cursor-pointer py-1.5 focus:outline-none"
        >
          <option>Tất cả vai trò</option>
          <option>Người dân</option>
          <option>Tình nguyện viên</option>
          <option>Đội cứu hộ</option>
          <option>Trưởng cộng đồng</option>
        </select>
        <select 
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-[10px] bg-white dark:bg-gray-955 text-slate-900 dark:text-white cursor-pointer py-1.5 focus:outline-none"
        >
          <option>Tất cả trạng thái</option>
          <option>Thành công (SUCCESS)</option>
          <option>Thất bại (FAILED)</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="overflow-hidden border border-slate-100 dark:border-slate-800 rounded-xl">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500">Đang tải danh sách nhật ký...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">Không tìm thấy nhật ký gửi tin nào cho kênh này.</div>
        ) : (
          <table className="w-full text-left border-collapse text-[10px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-gray-900/50 text-[9px] text-slate-900 dark:text-white uppercase font-extrabold">
                <th className="py-2.5 px-3">Người Nhận</th>
                <th className="py-2.5 px-3">Số Điện Thoại</th>
                <th className="py-2.5 px-3">Vai Trò</th>
                <th className="py-2.5 px-3">Kênh Truyền Tải</th>
                <th className="py-2.5 px-3">Thời Gian Gửi</th>
                <th className="py-2.5 px-3">Trạng Thế</th>
                <th className="py-2.5 px-3">Chi Tiết Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/20 dark:hover:bg-gray-800/10">
                  <td className="py-3 px-3 font-bold text-gray-900 dark:text-white">{log.name}</td>
                  <td className="py-3 px-3 font-mono text-slate-900 dark:text-white">{log.phone}</td>
                  <td className="py-3 px-3">
                    <span className="px-1.5 py-0.5 bg-slate-150 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[8px] font-bold">
                      {log.role}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-500 rounded text-[8px] font-black uppercase">
                      {log.channel}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400">{log.time}</td>
                  <td className="py-3 px-3">
                    {log.status === 'SUCCESS' || log.status === 'SENT' ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 rounded-full text-[8.5px] font-bold inline-flex items-center gap-1">
                        <CheckCircle size={10} /> THÀNH CÔNG
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 rounded-full text-[8.5px] font-bold inline-flex items-center gap-1">
                        <XCircle size={10} /> THẤT BẠI
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-700 dark:text-slate-350 max-w-[200px] truncate">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
