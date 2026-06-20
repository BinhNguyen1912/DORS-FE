import {
  LayoutDashboard,
  Map,
  Users,
  Briefcase,
  AlertTriangle,
  UserCheck,
  Truck,
  BarChart2,
  Settings,
  FolderOpen,
} from 'lucide-react';
import { ROUTES } from '../constants';

export interface MenuItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  children?: { label: string; href: string }[];
}

export const menuItems: MenuItem[] = [
  { label: 'Tổng quan', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  {
    label: 'Danh mục',
    href: '#/categories',
    icon: FolderOpen,
    children: [
      { label: 'Thành Viên', href: ROUTES.USER_LIST },
      { label: 'Chức danh', href: ROUTES.ROLE_LIST },
    ],
  },
  { label: 'Bản đồ cứu hộ', href: ROUTES.DISASTER_LIST, icon: Map }, // Currently using disaster list as placeholder
  { label: 'Đội cứu hộ', href: ROUTES.RESCUE_TEAM_DASHBOARD, icon: Users },
  { label: 'Nhiệm vụ', href: '#/missions', icon: Briefcase },
  { label: 'Yêu cầu trợ giúp', href: '#/help-requests', icon: AlertTriangle },
  { label: 'Nhân lực & Tình nguyện', href: '#/volunteer', icon: UserCheck },
  { label: 'Thiết bị & Phương tiện', href: '#/equipment', icon: Truck },
  { label: 'Báo cáo & Thống kê', href: '#/reports', icon: BarChart2 },
  { label: 'Cài đặt hệ thống', href: ROUTES.SETTINGS, icon: Settings },
];
