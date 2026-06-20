import { useState } from 'react';
import { 
  Search, 
  Bell, 
  Menu, 
  MessageSquare, 
  Calendar, 
  Map, 
  Users, 
  Settings, 
  HelpCircle, 
  ChevronDown 
} from 'lucide-react';
import { useAuthStore } from '../../stores';

interface HeaderProps {
  title: React.ReactNode;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showSearch?: boolean;
}

const roleTranslations: Record<string, string> = {
  SYSTEM_ADMIN: 'Quản trị viên hệ thống',
  PROVINCE_ADMIN: 'Quản trị viên cấp tỉnh',
  COMMUNITY_LEADER: 'Trưởng cộng đồng',
  USER: 'Người dùng',
};

export default function Header({
  title,
  sidebarCollapsed = false,
  onToggleSidebar,
  searchValue = '',
  onSearchChange,
  showSearch = true,
}: HeaderProps) {
  const { user } = useAuthStore();

  const [avatarError, setAvatarError] = useState(false);
  const userRoleText = user?.role ? (roleTranslations[user.role] || user.role) : 'Quản trị viên';

  return (
    <div className="h-16 flex items-center justify-between bg-white dark:bg-gray-800 px-6 border-b border-slate-100 dark:border-slate-800 shadow-sm z-10 select-none flex-shrink-0">
      {/* Left side: Sidebar Toggle & Search Bar / Title */}
      <div className="flex items-center gap-4 flex-1">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            data-sidebar-toggle
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all flex-shrink-0 cursor-pointer"
            title={sidebarCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
          >
            <Menu size={20} />
          </button>
        )}

        {showSearch && onSearchChange ? (
          <div className="relative w-full sm:w-64 md:w-80">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={14}
            />
            <input
              type="text"
              placeholder="Tìm kiếm tổng hợp..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-12 py-1.5 text-xs rounded-xl bg-slate-50/50 dark:bg-gray-900 border border-slate-200 dark:border-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all font-semibold placeholder-gray-400/80"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[9px] bg-slate-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 rounded border border-slate-200/60 dark:border-slate-750 font-sans flex items-center gap-0.5 font-bold pointer-events-none select-none">
              <span>⌘</span>
              <span>K</span>
            </span>
          </div>
        ) : (
          <div className="text-sm font-extrabold text-gray-900 dark:text-white leading-none">
            {title}
          </div>
        )}
      </div>

      {/* Actions: Notifications, Quick Actions, Settings & Profile */}
      <div className="flex items-center gap-3.5 xl:justify-end flex-shrink-0">
        {/* Notification Bell */}
        <button className="relative p-2 text-gray-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer">
          <Bell size={20} />
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-[9px] font-bold text-white rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
            12
          </span>
        </button>

        {/* Message bubble */}
        <button className="relative p-2 text-gray-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer">
          <MessageSquare size={20} />
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-[9px] font-bold text-white rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
            5
          </span>
        </button>

        {/* Calendar */}
        <button className="p-2 text-gray-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer hidden md:block" title="Lịch làm việc">
          <Calendar size={20} />
        </button>

        {/* Map */}
        <button className="p-2 text-gray-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer hidden md:block" title="Bản đồ giám sát">
          <Map size={20} />
        </button>

        {/* Users */}
        <button className="p-2 text-gray-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer hidden md:block" title="Danh sách thành viên">
          <Users size={20} />
        </button>

        {/* Settings inside a light blue rounded square container */}
        <button className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-pointer hidden md:block" title="Cấu hình hệ thống">
          <Settings size={18} />
        </button>

        {/* Help */}
        <button className="p-2 text-gray-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer hidden md:block" title="Trợ giúp">
          <HelpCircle size={20} />
        </button>

        {/* Vertical Divider */}
        <div className="h-5 w-px bg-slate-200 dark:bg-gray-700 hidden sm:block mx-1.5" />

        {/* User Profile */}
        <div className="flex items-center gap-3 cursor-pointer select-none">
          {/* Circular avatar image */}
          <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/30 flex-shrink-0">
            {user?.avatarUrl && !avatarError ? (
              <img 
                src={user.avatarUrl} 
                alt="Avatar" 
                className="w-full h-full object-cover" 
                onError={() => setAvatarError(true)}
              />
            ) : (
              <svg className="w-full h-full text-gray-400 bg-slate-100 dark:bg-gray-700 p-1.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-2 text-left">
            <div>
              <p className="text-xs font-extrabold text-gray-900 dark:text-white leading-tight">
                {user?.fullName || 'Admin TP.Hồ Chí Minh'}
              </p>
              <p className="text-[10px] text-black dark:text-white font-normal mt-0.5 leading-none">
                {userRoleText}
              </p>
            </div>
            <ChevronDown size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
}
