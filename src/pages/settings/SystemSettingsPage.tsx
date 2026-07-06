import { useState } from 'react';
import { 
  Info, 
  Activity, 
  Shield, 
  Lock, 
  Bell, 
  MapPin, 
  Database, 
  FileText, 
  Code, 
  Mail, 
  Folder,
  Palette,
  Menu
} from 'lucide-react';
import { cn } from '../../lib/utils';

// Import sub-tab components
import GeneralTab from './components/GeneralTab';
import RbacTab from './components/RbacTab';
import SecurityTab from './components/SecurityTab';
import SosTab from './components/SosTab';
import MapTab from './components/MapTab';
import NotificationTab from './components/NotificationTab';
import EmailTab from './components/EmailTab';
import AuditTab from './components/AuditTab';
import BackupTab from './components/BackupTab';
import ApiTab from './components/ApiTab';
import CategoryTab from './components/CategoryTab';
import ThemeTab from './components/ThemeTab';

type SettingTab = 
  | 'general'
  | 'rbac'
  | 'security'
  | 'sos'
  | 'map'
  | 'notifications'
  | 'email'
  | 'logs'
  | 'backup'
  | 'api'
  | 'categories'
  | 'theme';

interface TabItem {
  id: SettingTab;
  label: string;
  icon: React.ComponentType<any>;
}

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingTab>('general');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const tabs: TabItem[] = [
    { id: 'general', label: 'Thông tin chung', icon: Info },
    { id: 'rbac', label: 'Phân quyền & vai trò', icon: Shield },
    { id: 'security', label: 'Bảo mật & xác thực', icon: Lock },
    { id: 'sos', label: 'SOS & Điều phối', icon: Activity },
    { id: 'map', label: 'Định vị & Bản đồ', icon: MapPin },
    { id: 'notifications', label: 'Thông báo', icon: Bell },
    { id: 'email', label: 'Email & SMS', icon: Mail },
    { id: 'logs', label: 'Nhật ký hệ thống', icon: FileText },
    { id: 'backup', label: 'Sao lưu & khôi phục', icon: Database },
    { id: 'api', label: 'Tích hợp API', icon: Code },
    { id: 'categories', label: 'Danh mục hệ thống', icon: Folder },
    { id: 'theme', label: 'Giao diện', icon: Palette },
  ];

  // Dynamic active tab rendering
  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralTab />;
      case 'rbac':
        return <RbacTab />;
      case 'security':
        return <SecurityTab />;
      case 'sos':
        return <SosTab />;
      case 'map':
        return <MapTab />;
      case 'notifications':
        return <NotificationTab />;
      case 'email':
        return <EmailTab />;
      case 'logs':
        return <AuditTab />;
      case 'backup':
        return <BackupTab />;
      case 'api':
        return <ApiTab />;
      case 'categories':
        return <CategoryTab />;
      case 'theme':
        return <ThemeTab />;
      default:
        return <GeneralTab />;
    }
  };

  return (
    <div className="flex-1 flex flex-col text-left py-1 w-full">
      {/* Settings Flex Panel */}
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        {/* Left navigation column */}
        <div className={cn("transition-all duration-300 flex-shrink-0", isSidebarCollapsed ? "w-12 lg:w-16" : "w-full lg:w-64")}>
          <div className="px-1 lg:px-2">
            <div className={cn("flex items-center justify-between mb-3 select-none", isSidebarCollapsed ? "lg:justify-center" : "")}>
              {!isSidebarCollapsed && (
                <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Cấu hình hệ thống
                </h3>
              )}
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-750 rounded-lg text-gray-400 hover:text-gray-650 transition-all cursor-pointer mx-auto lg:mx-0"
                title={isSidebarCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
              >
                <Menu size={isSidebarCollapsed ? 18 : 15} />
              </button>
            </div>
            
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'w-full flex items-center gap-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer',
                      isSidebarCollapsed ? 'justify-center px-1 border-0' : 'px-3 border-l-2',
                      isActive
                        ? 'border-slate-900 dark:border-white text-black dark:text-white bg-slate-50/50 dark:bg-gray-800'
                        : 'border-transparent text-gray-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white hover:bg-slate-50/30'
                    )}
                    title={isSidebarCollapsed ? tab.label : undefined}
                  >
                    <Icon size={isSidebarCollapsed ? 20 : 16} className={cn(isActive ? 'text-slate-900 dark:text-white' : 'text-gray-400', isSidebarCollapsed ? '' : 'flex-shrink-0')} />
                    {!isSidebarCollapsed && <span>{tab.label}</span>}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Right Tab Content Container */}
        <div className="flex-1 w-full bg-white dark:bg-gray-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/60 shadow-sm">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
