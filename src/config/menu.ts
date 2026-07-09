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
  ClipboardList,
} from 'lucide-react';
import { ROUTES } from '../constants';

export interface MenuItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  roles?: string[]; // Allowed roles (empty means allowed for all)
  children?: { label: string; href: string; roles?: string[] }[];
}

export const menuItems: MenuItem[] = [
  { label: 'Tổng quan', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  {
    label: 'Danh mục',
    href: '#/categories',
    icon: FolderOpen,
    roles: ['SYSTEM_ADMIN', 'PROVINCE_ADMIN'],
    children: [
      { label: 'Thành Viên', href: ROUTES.USER_LIST, roles: ['SYSTEM_ADMIN', 'PROVINCE_ADMIN'] },
      { label: 'Chức danh', href: ROUTES.ROLE_LIST, roles: ['SYSTEM_ADMIN'] },
    ],
  },
  {
    label: 'Bản đồ cứu hộ',
    href: ROUTES.DISASTER_LIST,
    icon: Map,
    roles: ['SYSTEM_ADMIN', 'PROVINCE_ADMIN', 'RESCUE_TEAM_LEADER', 'USER', 'VOLUNTEER']
  },
  {
    label: 'Đội cứu hộ',
    href: ROUTES.RESCUE_TEAM_DASHBOARD,
    icon: Users,
    roles: ['SYSTEM_ADMIN', 'PROVINCE_ADMIN', 'RESCUE_TEAM_LEADER']
  },
  {
    label: 'Nhiệm vụ',
    href: '#/missions',
    icon: Briefcase,
    roles: ['SYSTEM_ADMIN', 'PROVINCE_ADMIN', 'RESCUE_TEAM_LEADER']
  },
  {
    label: 'Yêu cầu',
    href: ROUTES.SOS_REQUEST_LIST,
    icon: ClipboardList,
    roles: ['SYSTEM_ADMIN', 'PROVINCE_ADMIN']
  },
  {
    label: 'Người dân',
    href: '#/volunteer',
    icon: UserCheck,
    roles: ['SYSTEM_ADMIN', 'PROVINCE_ADMIN']
  },
  {
    label: 'Thiết bị & Phương tiện',
    href: '#/equipment',
    icon: Truck,
    roles: ['SYSTEM_ADMIN', 'PROVINCE_ADMIN', 'RESCUE_TEAM_LEADER']
  },
  {
    label: 'Báo cáo & Thống kê',
    href: '#/reports',
    icon: BarChart2,
    roles: ['SYSTEM_ADMIN', 'PROVINCE_ADMIN']
  },
  {
    label: 'Cài đặt hệ thống',
    href: ROUTES.SETTINGS,
    icon: Settings,
    roles: ['SYSTEM_ADMIN', 'PROVINCE_ADMIN']
  },
];
