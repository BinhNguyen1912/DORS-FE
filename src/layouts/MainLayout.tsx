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
  AlertTriangle,
  Heart,
  Shield,
  Plus,
} from 'lucide-react';
import { useAuthStore, toast } from '../stores';
import { ROUTES } from '../constants';
import { cn } from '../lib/utils';
import { menuItems } from '../config/menu';
import Header from '../components/common/Header';
import ToastContainer from '../components/common/ToastContainer';
import { authApi } from '../apis';

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const sidebarRef = useRef<HTMLElement>(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

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
        title: 'Tình hình thiên tai',
        subtitle: 'Danh sách các điểm sạt lở, lũ lụt',
        icon: <AlertTriangle size={20} />,
        showSearch: true,
        searchPlaceholder: 'Tìm kiếm điểm sự cố...',
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

    return {
      title: 'Hệ thống cứu trợ thiên tai',
      subtitle: 'Quản lý cứu hộ Việt Nam',
      icon: <Shield size={20} />,
      showSearch: false,
    };
  };

  const headerInfo = getHeaderInfo(location.pathname);
  const userRoleText = user?.role === 'SYSTEM_ADMIN' ? 'Quản trị viên' : 'Điều phối viên';

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-gray-950 flex">
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-50 text-white">
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
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

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
                      {user?.fullName || 'Nguyễn Văn A'}
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
          searchPlaceholder={headerInfo.searchPlaceholder || "Tìm kiếm tổng hợp..."}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          showSearch={headerInfo.showSearch}
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
      <ToastContainer />
    </div>
  );
}


