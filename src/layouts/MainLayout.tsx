import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LogOut,
  Menu,
  ChevronsLeft,
  ChevronsRight,
  PhoneCall,
  LayoutDashboard,
  Users,
  Home,
  Heart,
  Shield,
  Plus,
  ChevronDown,
  ChevronRight,
  Map,
  Settings,
  AlertTriangle,
} from 'lucide-react';
import { useAuthStore, toast } from '../stores';
import { ROUTES } from '../constants';
import { cn } from '../lib/utils';
import { menuItems } from '../config/menu';
import Header from '../components/common/Header';
import ToastContainer from '../components/common/ToastContainer';
import { authApi } from '../apis';
import { useSocket } from '../providers/SocketProvider';
import { DISPATCH_EVENTS, NOTIFICATION_EVENTS } from '../constants/websocket.constant';

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const sidebarRef = useRef<HTMLElement>(null);

  const [noTeamSosId, setNoTeamSosId] = useState<number | null>(null);
  const [noTeamMessage, setNoTeamMessage] = useState<string>('');

  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // Clear search query on path change
  useEffect(() => {
    setSearchQuery('');
  }, [location.pathname]);

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    'Danh mục': true,
  });

  const { dispatchSocket, notificationSocket } = useSocket();

  // Global socket listener for rescue notifications
  useEffect(() => {
    if (!dispatchSocket) return;

    const handleNewSos = (sos: any) => {
      console.log('📡 [WS Global] New SOS received:', sos);
      if (location.pathname !== ROUTES.DISASTER_LIST) {
        toast.warning(`🚨 SOS MỚI: Yêu cầu từ ${sos.requesterName || 'Người dân'} (SĐT: ${sos.requesterPhone || 'Chưa cập nhật'}) tại ${sos.addressDetail || sos.adminUnit?.name || 'Vị trí hiện trường'}`);
      }
    };

    const handleNoTeam = (payload: { sosId: number; message: string }) => {
      console.log('📡 [WS Global] No team available:', payload);
      setNoTeamSosId(payload.sosId);
      setNoTeamMessage(payload.message || 'Không tìm được đội cứu hộ phù hợp — cần điều phối thủ công');
    };

    dispatchSocket.on(DISPATCH_EVENTS.SOS_CREATED, handleNewSos);
    dispatchSocket.on(DISPATCH_EVENTS.SOS_NO_TEAM, handleNoTeam);

    return () => {
      dispatchSocket.off(DISPATCH_EVENTS.SOS_CREATED, handleNewSos);
      dispatchSocket.off(DISPATCH_EVENTS.SOS_NO_TEAM, handleNoTeam);
    };
  }, [dispatchSocket, location.pathname]);

  // Global socket listener for push notifications
  useEffect(() => {
    if (!notificationSocket) return;

    const handlePushNotification = (notification: any) => {
      console.log('📡 [WS Global] Notification received:', notification);
      toast.info(`🔔 ${notification.title || 'Thông báo mới'}: ${notification.message || ''}`);
    };

    notificationSocket.on(NOTIFICATION_EVENTS.PUSH, handlePushNotification);

    return () => {
      notificationSocket.off(NOTIFICATION_EVENTS.PUSH, handlePushNotification);
    };
  }, [notificationSocket]);
  const toggleMenu = (label: string) => {
    setExpandedMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (err) {
      console.error('Lỗi khi gọi API đăng xuất:', err);
    } finally {
      logout();
      navigate(ROUTES.LOGIN);
      toast.success('Đăng xuất thành công!');
    }
  };

  // Click outside sidebar effect to collapse (desktop) or close (mobile) the sidebar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      // Close mobile sidebar if clicked outside
      if (sidebarOpen && sidebarRef.current && !sidebarRef.current.contains(target)) {
        const mobileToggleBtn = document.querySelector('[data-mobile-toggle]');
        if (mobileToggleBtn && mobileToggleBtn.contains(target)) {
          return;
        }
        setSidebarOpen(false);
      }

      // Collapse desktop sidebar if expanded and clicked outside
      if (!collapsed && sidebarRef.current && !sidebarRef.current.contains(target)) {
        const toggleBtn = document.querySelector('[data-sidebar-toggle]');
        if (toggleBtn && toggleBtn.contains(target)) {
          return;
        }
        setCollapsed(true);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [collapsed, sidebarOpen]);

  // Determine path headers information dynamically for global layout
  const getHeaderInfo = (pathname: string) => {
    if (pathname === ROUTES.DASHBOARD || pathname === '/') {
      return {
        title: 'Tổng quan hệ thống',
        subtitle: 'Bảng điều khiển giám sát cứu hộ',
        icon: <LayoutDashboard size={20} />,
        showSearch: false,
      };
    }
    if (pathname === ROUTES.RESCUE_TEAM_LIST) {
      return {
        title: 'Quản lý đội cứu hộ',
        subtitle: 'Tổng quan',
        icon: <Users size={20} />,
        showSearch: true,
        searchPlaceholder: 'Tìm kiếm đội, thành viên, khu vực...',
      };
    }
    if (pathname === ROUTES.RESCUE_TEAM_DASHBOARD) {
      return {
        title: 'Bản đồ giám sát đội cứu hộ',
        subtitle: 'Giám sát vị trí thời gian thực',
        icon: <Users size={20} />,
        showSearch: false,
      };
    }
    if (pathname === ROUTES.RESCUE_TEAM_CREATE) {
      return {
        title: 'Tạo đội cứu hộ',
        subtitle: 'Thêm đội mới vào hệ thống',
        icon: <Plus size={20} />,
        showSearch: false,
      };
    }
    if (pathname.startsWith('/rescue-team/')) {
      return {
        title: 'Chi tiết đội cứu hộ',
        subtitle: 'Thông tin hồ sơ chi tiết',
        icon: <Users size={20} />,
        showSearch: false,
      };
    }
    if (pathname === ROUTES.HOUSEHOLD_LIST) {
      return {
        title: 'Quản lý hộ dân',
        subtitle: 'Danh sách các hộ gia đình trong vùng lũ',
        icon: <Home size={20} />,
        showSearch: true,
        searchPlaceholder: 'Tìm kiếm hộ dân...',
      };
    }
    if (pathname === ROUTES.DISASTER_LIST) {
      return {
        title: (
          <div className="flex items-center gap-2">
            <span>BẢN ĐỒ CỨU HỘ TÌNH HUỐNG THIÊN TAI</span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-extrabold bg-red-650 text-white rounded-full animate-pulse flex-shrink-0">
              <span className="w-1.5 h-1.5 bg-white rounded-full" />
              LIVE
            </span>
          </div>
        ),
        subtitle: 'Bản đồ cứu hộ và điều phối cứu nạn',
        icon: <Map size={20} />,
        showSearch: true,
        searchPlaceholder: 'Tìm kiếm địa điểm, đội, SOS...',
      };
    }
    if (pathname === ROUTES.DONATION_LIST) {
      return {
        title: 'Quản lý tài trợ & quyên góp',
        subtitle: 'Danh sách nguồn lực quyên góp',
        icon: <Heart size={20} />,
        showSearch: true,
        searchPlaceholder: 'Tìm kiếm khoản tài trợ...',
      };
    }
    if (pathname === ROUTES.USER_LIST) {
      return {
        title: 'Quản lý Thành Viên (User)',
        subtitle: 'Danh mục người dùng hệ thống',
        icon: <Users size={20} />,
        showSearch: true,
        searchPlaceholder: 'Tìm kiếm người dùng...',
      };
    }
    if (pathname === ROUTES.ROLE_LIST) {
      return {
        title: 'Quản lý Chức danh',
        subtitle: 'Danh mục vai trò & phân quyền hệ thống',
        icon: <Shield size={20} />,
        showSearch: true,
        searchPlaceholder: 'Tìm kiếm vai trò...',
      };
    }
    if (pathname === ROUTES.SETTINGS) {
      return {
        title: 'Cấu hình hệ thống',
        subtitle: 'Quản lý và cấu hình các thiết lập toàn hệ thống',
        icon: <Settings size={20} />,
        showSearch: false,
      };
    }

    return {
      title: 'Hệ thống cứu trợ thiên tai',
      subtitle: 'Quản lý cứu hộ Việt Nam',
      icon: <Shield size={20} />,
      showSearch: false,
    };
  };

  const headerInfo = getHeaderInfo(location.pathname);

  const roleTranslations: Record<string, string> = {
    SYSTEM_ADMIN: 'Quản trị viên hệ thống',
    PROVINCE_ADMIN: 'Quản trị viên cấp tỉnh',
    RESCUE_TEAM_LEADER: 'Đội trưởng cứu hộ',
    USER: 'Người dùng',
    VOLUNTEER: 'Tình nguyện viên',
  };
  const userRole = user?.role || (user as any)?.userRoles?.[0]?.role?.name;
  const userRoleText = userRole ? (roleTranslations[userRole] || userRole) : 'Điều phối viên';

  // Lọc danh sách menu theo quyền của vai trò (RBAC)
  const filteredMenuItems = menuItems
    .map((item) => {
      if (item.roles && (!userRole || !item.roles.includes(userRole))) {
        return null;
      }

      if (item.children) {
        const filteredChildren = item.children.filter((child) => {
          if (child.roles && (!userRole || !child.roles.includes(userRole))) {
            return false;
          }
          return true;
        });

        if (filteredChildren.length === 0) {
          return null;
        }

        return {
          ...item,
          children: filteredChildren,
        };
      }

      return item;
    })
    .filter(Boolean) as typeof menuItems;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-gray-950 flex">
      {/* Mobile Top Bar */}
      <div className="lg:hidden layout-mobile-topbar fixed top-0 left-0 right-0 h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-50 text-white">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          data-mobile-toggle
          className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
          <span className="font-bold text-xs uppercase tracking-wider">CỨU HỘ VIỆT NAM</span>
        </div>
        <div className="w-8" />
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Collapsible Left Sidebar */}
      <aside
        ref={sidebarRef}
        className={cn(
          'fixed lg:sticky top-0 left-0 h-screen bg-[#0b1329] text-slate-350 border-r border-slate-900 flex flex-col z-40 transition-all duration-300 ease-in-out transform lg:translate-x-0',
          collapsed ? 'w-16' : 'w-60',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Sidebar Header Logo */}
        <div className={cn(
          "h-16 border-b border-slate-850 flex items-center overflow-hidden transition-all duration-300",
          collapsed ? "px-2 justify-center" : "px-4"
        )}>
          <div className="flex items-center w-full">
            <div className={cn(
              "flex items-center justify-center transition-all duration-300",
              collapsed ? "h-9 w-9 mx-auto" : "h-13 w-full justify-start"
            )}>
              <img
                src={collapsed
                  ? "https://pub-2c2241596f28433bb00bedb6391e5d78.r2.dev/assets/logo-focus.png"
                  : "https://pub-2c2241596f28433bb00bedb6391e5d78.r2.dev/assets/logo.png"
                }
                alt="Cứu Hộ Việt Nam Logo"
                className="h-full w-auto object-contain max-w-full"
              />
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto no-scrollbar">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = !!item.children;
            const isExpanded = !!expandedMenus[item.label];
            const hasActiveChild = hasChildren && item.children!.some(child => location.pathname === child.href);
            const isActive = location.pathname === item.href || hasActiveChild;

            if (hasChildren) {
              return (
                <div key={item.label} className="space-y-1">
                  <button
                    onClick={() => {
                      if (collapsed) {
                        setCollapsed(false);
                        setExpandedMenus(prev => ({ ...prev, [item.label]: true }));
                      } else {
                        toggleMenu(item.label);
                      }
                    }}
                    className={cn(
                      'w-full flex items-center justify-between rounded-xl transition-all font-semibold text-xs',
                      collapsed
                        ? 'justify-center p-2.5'
                        : 'px-2.5 py-2',
                      isActive
                        ? 'bg-amber-600/10 text-amber-500'
                        : 'text-slate-400 hover:text-white hover:bg-slate-850/60'
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={18} className="flex-shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </div>
                    {!collapsed && (
                      isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                    )}
                  </button>

                  {isExpanded && !collapsed && (
                    <div className="pl-4 space-y-1 mt-1 border-l border-slate-800 ml-[19px]">
                      {item.children!.map((child) => {
                        const isChildActive = location.pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            to={child.href}
                            onClick={() => setSidebarOpen(false)}
                            className={cn(
                              'group flex items-center rounded-lg px-3 py-1.5 font-semibold text-xs transition-all duration-200',
                              isChildActive
                                ? 'text-amber-500 font-bold bg-amber-600/10'
                                : 'text-slate-400 hover:text-white hover:bg-slate-850/40'
                            )}
                          >
                            <span
                              className={cn(
                                'w-1.5 h-1.5 rounded-full mr-2.5 transition-all duration-300 flex-shrink-0',
                                isChildActive
                                  ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                                  : 'bg-slate-650 group-hover:bg-slate-400'
                              )}
                            />
                            <span className="truncate">{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                to={item.href === '#' ? '#' : item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center rounded-xl transition-all font-semibold text-xs',
                  collapsed
                    ? 'justify-center p-2.5'
                    : 'gap-2 px-2.5 py-2',
                  isActive
                    ? 'bg-amber-600/10 text-amber-500 border-l-[3px] border-amber-500'
                    : 'text-slate-400 hover:text-white hover:bg-slate-850/60'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer Area: Emergency and User details */}
        <div className={cn(
          "border-t border-slate-850 space-y-3 flex-shrink-0",
          collapsed ? "p-2" : "p-3"
        )}>
          {/* Emergency helpline card */}
          {collapsed ? (
            <div className="flex justify-center">
              <a
                href="tel:1900123114"
                className="w-10 h-10 rounded-xl bg-orange-600/10 hover:bg-orange-600/20 text-orange-500 flex items-center justify-center transition-all"
                title="Hỗ trợ khẩn cấp 24/7: 1900 123 114"
              >
                <PhoneCall size={16} />
              </a>
            </div>
          ) : (
            <div className="bg-[#121b34] p-2.5 rounded-xl border border-orange-500/10 flex items-center gap-2.5">
              <div className="p-2 bg-orange-600/10 text-orange-500 rounded-lg flex-shrink-0">
                <PhoneCall size={15} />
              </div>
              <div className="text-left overflow-hidden">
                <p className="text-[8px] text-gray-500 font-bold uppercase leading-none mb-1">Hỗ trợ khẩn cấp 24/7</p>
                <a href="tel:1900123114" className="text-xs font-extrabold text-orange-500 leading-none hover:underline block truncate">
                  1900 123 114
                </a>
              </div>
            </div>
          )}

          {/* User profile & collapse toggle */}
          <div className="space-y-2">
            <div className={cn(
              "flex items-center justify-between gap-2.5",
              collapsed && "justify-center"
            )}>
              <div className="flex items-center gap-2 overflow-hidden flex-1 justify-start">
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white flex-shrink-0">
                  {user?.fullName?.split(' ').pop()?.charAt(0) || 'A'}
                </div>
                {!collapsed && (
                  <div className="text-left overflow-hidden flex-1">
                    <p className="text-xs font-bold text-white truncate">
                      {user?.fullName || 'Không xác định'}
                    </p>
                    <p className="text-[9px] text-slate-500 font-semibold truncate mt-0.5">
                      {userRoleText}
                    </p>
                  </div>
                )}
              </div>

              {!collapsed && (
                <button
                  onClick={handleLogout}
                  className="p-1.5 hover:bg-slate-850 rounded-lg text-slate-500 hover:text-white transition-all flex-shrink-0"
                  title="Đăng xuất"
                >
                  <LogOut size={14} />
                </button>
              )}
            </div>

            {/* Sidebar toggle button at bottom */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={cn(
                "hidden lg:flex items-center text-slate-500 hover:text-white rounded-lg hover:bg-slate-850/60 transition-all font-semibold text-xs text-left w-full",
                collapsed ? "justify-center p-2" : "gap-2 px-2.5 py-1.5"
              )}
            >
              {collapsed ? (
                <ChevronsRight size={16} />
              ) : (
                <>
                  <ChevronsLeft size={16} />
                  <span>Thu gọn</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Right Content Area */}
      <main
        className={cn(
          'flex-1 min-h-screen pt-14 lg:pt-0 transition-all duration-300 ease-in-out flex flex-col'
        )}
      >
        {/* Global Header */}
        <Header
          title={headerInfo.title}
          sidebarCollapsed={collapsed}
          onToggleSidebar={() => setCollapsed(!collapsed)}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          showSearch={true}
        />

        {/* Outlet with shared search state context */}
        <div className="pt-2.5 pb-4 px-4 lg:pt-3 lg:pb-5 lg:px-5 flex-1 flex flex-col relative overflow-hidden">
          {/* Watermark Background Layer to handle the checkerboard image */}
          <div
            className={cn(
              "fixed top-0 bottom-0 right-0 pointer-events-none bg-[url('https://pub-2c2241596f28433bb00bedb6391e5d78.r2.dev/assets/bg-main.png')] bg-no-repeat bg-[position:right_-300px_top_-300px] bg-[size:850px_850px] opacity-[0.12] mix-blend-multiply dark:mix-blend-screen dark:opacity-[0.18] transition-all duration-300 z-0",
              collapsed ? "lg:left-16 left-0" : "lg:left-60 left-0"
            )}
          />
          <div className="flex-1 flex flex-col z-10">
            <Outlet context={{ searchQuery, setSearchQuery }} />
          </div>
        </div>
      </main>
      {noTeamSosId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-gray-900 border border-red-100 dark:border-red-950/45 p-6 rounded-3xl max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center text-center gap-4 animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-600 dark:text-red-400">
              <AlertTriangle size={24} className="animate-bounce" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Cảnh báo khẩn cấp</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold leading-relaxed">
                Yêu cầu SOS #{noTeamSosId}: {noTeamMessage}
              </p>
            </div>
            <div className="flex gap-2.5 w-full pt-1">
              <button
                onClick={() => setNoTeamSosId(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-655 dark:text-gray-300 transition select-none cursor-pointer"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  const targetId = noTeamSosId;
                  setNoTeamSosId(null);
                  navigate(ROUTES.SOS_REQUEST_LIST, { state: { selectedSosId: targetId } });
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition shadow-sm select-none cursor-pointer"
              >
                Đi đến xử lý
              </button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
}


