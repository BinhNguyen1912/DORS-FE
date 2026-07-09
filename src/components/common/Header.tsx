import { useState, useRef, useEffect, useCallback } from 'react';
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
  ChevronDown,
  ChevronRight,
  User,
  KeyRound,
  UserCog,
  BellRing,
  Globe,
  Sun,
  LogOut,
  BadgeCheck,
} from 'lucide-react';
import { useAuthStore } from '../../stores';
import { authApi } from '../../apis';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { toast } from '../../stores';

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
  RESCUE_TEAM_LEADER: 'Đội trưởng cứu hộ',
  USER: 'Người dùng',
  VOLUNTEER: 'Tình nguyện viên',
};

export default function Header({
  title,
  sidebarCollapsed = false,
  onToggleSidebar,
  searchValue = '',
  onSearchChange,
  showSearch = true,
}: HeaderProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [avatarError, setAvatarError] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const userRole = user?.role || (user as any)?.userRoles?.[0]?.role?.name;
  const userRoleText = userRole
    ? roleTranslations[userRole] || userRole
    : 'Quản trị viên';

  // 2 chữ cái cuối của fullName làm initials
  const initials = user?.fullName
    ? user.fullName.trim().split(/\s+/).slice(-2).map(w => w[0]).join('').toUpperCase()
    : 'AD';

  // Close dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileOpen]);

  // Dark mode toggle
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  );
  const toggleDark = useCallback(() => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  }, []);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) await authApi.logout(refreshToken);
    } catch (err) {
      console.error('Lỗi khi gọi API đăng xuất:', err);
    } finally {
      logout();
      navigate(ROUTES.LOGIN);
      toast.success('Đăng xuất thành công!');
    }
  };

  const goTo = (path: string) => {
    setProfileOpen(false);
    navigate(path);
  };

  // Menu items chính — mỗi item có action riêng
  const mainMenuItems: {
    icon: React.ElementType;
    label: string;
    rightValue: string | null;
    action: () => void;
  }[] = [
      {
        icon: User,
        label: 'Thông tin cá nhân',
        rightValue: null,
        action: () => goTo(ROUTES.PROFILE),
      },
      {
        icon: KeyRound,
        label: 'Đổi mật khẩu',
        rightValue: null,
        action: () => goTo(ROUTES.PROFILE),
      },
      {
        icon: UserCog,
        label: 'Thiết lập ứng dụng',
        rightValue: null,
        action: () => goTo(ROUTES.SETTINGS),
      },
      {
        icon: BellRing,
        label: 'Thiết lập thông báo',
        rightValue: null,
        action: () => goTo(ROUTES.SETTINGS),
      },
      {
        icon: Globe,
        label: 'Ngôn ngữ',
        rightValue: 'Tiếng Việt',
        action: () => { },
      },
      {
        icon: Sun,
        label: 'Chế độ',
        rightValue: isDark ? 'Tối' : 'Sáng',
        action: () => toggleDark(),
      },
    ];

  return (
    <div className="layout-global-header relative h-16 flex items-center justify-between bg-white dark:bg-gray-800 px-6 border-b border-slate-100 dark:border-slate-800 shadow-sm z-30 select-none flex-shrink-0 overflow-visible">

      {/* ── Left: Toggle + Search / Title ── */}
      <div className="flex items-center gap-4 flex-1">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            data-sidebar-toggle
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all flex-shrink-0 cursor-pointer"
            title={sidebarCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
          >
            <Menu size={20} />
          </button>
        )}

        {showSearch && onSearchChange ? (
          <div className="relative w-full sm:w-64 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Tìm kiếm tổng hợp..."
              value={searchValue}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-12 py-1.5 text-xs rounded-xl bg-slate-50/50 dark:bg-gray-900 border border-slate-200 dark:border-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all font-semibold placeholder-gray-400/80"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[9px] bg-slate-100 dark:bg-slate-800 text-gray-400 rounded border border-slate-200/60 font-bold pointer-events-none select-none flex items-center gap-0.5">
              <span>⌘</span><span>K</span>
            </span>
          </div>
        ) : (
          <div className="text-sm font-extrabold text-gray-900 dark:text-white leading-none">
            {title}
          </div>
        )}
      </div>

      {/* ── Right: Action buttons + Profile ── */}
      <div className="flex items-center gap-3.5 flex-shrink-0">
        {/* Notification Bell */}
        <button className="relative p-2 text-gray-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer">
          <Bell size={20} />
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-[9px] font-bold text-white rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">12</span>
        </button>

        {/* Message */}
        <button className="relative p-2 text-gray-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer">
          <MessageSquare size={20} />
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-[9px] font-bold text-white rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">5</span>
        </button>

        <button className="p-2 text-gray-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer hidden md:block" title="Lịch làm việc">
          <Calendar size={20} />
        </button>
        <button className="p-2 text-gray-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer hidden md:block" title="Bản đồ giám sát">
          <Map size={20} />
        </button>
        <button className="p-2 text-gray-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer hidden md:block" title="Danh sách thành viên">
          <Users size={20} />
        </button>
        <button className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer hidden md:block" title="Cấu hình hệ thống">
          <Settings size={18} />
        </button>
        <button className="p-2 text-gray-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer hidden md:block" title="Trợ giúp">
          <HelpCircle size={20} />
        </button>

        {/* Divider */}
        <div className="h-5 w-px bg-slate-200 dark:bg-gray-700 hidden sm:block mx-1.5" />

        {/* ── Profile trigger ── */}
        <div className="relative" ref={profileRef}>
          <div
            className="flex items-center gap-3 cursor-pointer select-none group"
            onClick={() => setProfileOpen(v => !v)}
          >
            {/* Avatar nhỏ trên header */}
            <div className="w-9 h-9 rounded-full overflow-hidden bg-blue-100 dark:bg-blue-900/40 border-2 border-blue-300 dark:border-blue-600 flex items-center justify-center font-bold text-blue-700 dark:text-blue-300 text-sm flex-shrink-0 transition-all group-hover:border-blue-500">
              {user?.avatarUrl && !avatarError ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" onError={() => setAvatarError(true)} />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-2 text-left">
              <div>
                <p className="text-xs font-extrabold text-gray-900 dark:text-white leading-tight">
                  {user?.fullName || 'Admin TP.Hồ Chí Minh'}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-none">
                  {userRoleText}
                </p>
              </div>
              <ChevronDown
                size={14}
                className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}
              />
            </div>
          </div>

          {/* ════════════════════════════════════
              Profile Dropdown
          ════════════════════════════════════ */}
          {profileOpen && (
            <div
              className="absolute right-0 top-[calc(100%+8px)] w-80 bg-white dark:bg-gray-900 shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden"
              style={{ animation: 'profileDropIn 0.15s cubic-bezier(0.16,1,0.3,1) both', borderRadius: '8px' }}
            >
              {/* ── Banner ── */}
              <div
                className="relative h-24 flex items-end justify-center pb-0"
                style={{
                  background: 'linear-gradient(135deg, #1a56db 0%, #4f9cf9 50%, #93c5fd 100%)',
                  backgroundImage: `
                    linear-gradient(135deg,rgba(26,86,219,0.85) 0%,rgba(79,156,249,0.8) 100%),
                    url('https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Ho_Chi_Minh_City_Skyline.jpg/1200px-Ho_Chi_Minh_City_Skyline.jpg')
                  `,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {/* Avatar lớn — nằm đè xuống dưới banner */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-blue-100 border-4 border-white dark:border-gray-900 flex items-center justify-center font-bold text-blue-700 text-xl shadow-md overflow-hidden">
                      {user?.avatarUrl && !avatarError ? (
                        <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" onError={() => setAvatarError(true)} />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>
                    {/* Online dot */}
                    <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
                  </div>
                </div>
              </div>

              {/* ── User Info ── */}
              <div className="pt-10 pb-4 px-5 text-center border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {user?.fullName || 'Admin TP.Hồ Chí Minh'}
                  </p>
                  <BadgeCheck size={16} className="text-blue-500 flex-shrink-0" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{userRoleText}</p>

                {/* Province badge */}
                <span className="inline-block px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium mb-1.5">
                  Tỉnh/Thành phố: {(user as any)?.provinceName || 'TP. Hồ Chí Minh'}
                </span>

                {/* Email */}
                {user?.email && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{user.email}</p>
                )}
              </div>

              {/* ── Menu items ── */}
              <div className="py-1">
                {mainMenuItems.map(({ icon: Icon, label, rightValue, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    className="w-full flex items-center gap-3 px-5 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors border-b border-slate-50 dark:border-slate-800/80 last:border-b-0"
                  >
                    <Icon size={17} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <span className="flex-1 text-left font-medium">{label}</span>
                    {rightValue ? (
                      <span className="text-xs text-gray-400 dark:text-gray-500 mr-1">{rightValue}</span>
                    ) : null}
                    <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
                  </button>
                ))}
              </div>

              {/* ── Logout ── */}
              <div className="border-t border-slate-100 dark:border-slate-800 py-1">
                <button
                  onClick={() => { setProfileOpen(false); handleLogout(); }}
                  className="w-full flex items-center gap-3 px-5 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  <LogOut size={17} className="text-red-500 flex-shrink-0" />
                  <span className="font-medium">Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Animation keyframe */}
      <style>{`
        @keyframes profileDropIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </div>
  );
}
