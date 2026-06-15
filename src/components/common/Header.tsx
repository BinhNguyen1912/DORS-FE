import { Search, Bell, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useAuthStore } from '../../stores';

interface HeaderProps {
  title: string;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  searchPlaceholder?: string;
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
  searchPlaceholder = 'Tìm kiếm tổng hợp...',
  searchValue = '',
  onSearchChange,
  showSearch = true,
}: HeaderProps) {
  const { user } = useAuthStore();

  const userRoleText = user?.role ? (roleTranslations[user.role] || user.role) : 'Quản trị viên';

  return (
    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 bg-white dark:bg-gray-800 py-3 px-6 flex-shrink-0 shadow-sm z-10">
      {/* Title Area & Sidebar Toggle */}
      <div className="flex items-center gap-2.5 text-left py-1">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            data-sidebar-toggle
            className="p-1.5 hover:bg-gray-150 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all flex-shrink-0"
            title={sidebarCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
          >
            {sidebarCollapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          </button>
        )}
        <div className="text-base font-extrabold text-gray-900 dark:text-white leading-none">
          {title}
        </div>
      </div>

      {/* Actions: Search, Notifications & Profile */}
      <div className="flex flex-wrap items-center gap-4 xl:justify-end flex-1">
        {/* Search Bar (conditional) */}
        {showSearch && onSearchChange && (
          <div className="relative flex-1 max-w-md min-w-[260px]">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
              size={18}
            />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
            />
          </div>
        )}

        {/* Notification Bell */}
        <button className="relative p-2.5 bg-gray-50 hover:bg-gray-150 dark:bg-gray-900 dark:hover:bg-gray-950 rounded-xl text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-700 transition-all">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
            12
          </span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-2 border-l border-gray-200 dark:border-gray-700">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/30">
            {/* Display profile avatar or initials fallback */}
            <span className="text-sm">
              {user?.fullName?.split(' ').pop()?.charAt(0) || 'A'}
            </span>
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {user?.fullName || 'Nguyễn Văn A'}
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
              {userRoleText}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
