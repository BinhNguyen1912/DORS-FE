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
  Palette
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
    <div className="flex-1 flex flex-col text-left py-1">
      {/* Settings Grid Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left navigation column */}
        <div className="lg:col-span-3 space-y-4">
          <div className="px-2">
            <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider select-none mb-3">
              Cấu hình hệ thống
            </h3>
            
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-xl transition-all border-l-2 cursor-pointer',
                      isActive
                        ? 'border-slate-900 dark:border-white text-black dark:text-white bg-slate-50/50 dark:bg-gray-800'
                        : 'border-transparent text-gray-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white hover:bg-slate-50/30'
                    )}
                  >
                    <Icon size={16} className={cn(isActive ? 'text-slate-900 dark:text-white' : 'text-gray-400')} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Right Tab Content Container */}
        <div className="lg:col-span-9 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/60 shadow-sm">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
