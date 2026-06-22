export type SettingTab =
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

export interface TabItem {
  id: SettingTab;
  label: string;
  icon: React.ComponentType<any>;
}

export interface TeamTypeItem {
  code: string;
  name: string;
}

export interface CategoryItem {
  code: string;
  name: string;
}

export type RbacSubTab = 'roles' | 'matrix' | 'scope';

export interface RoleDetail {
  code: string;
  name: string;
  level: string;
  description: string;
  color: string;
}

export interface PermissionRow {
  moduleCode: string;
  moduleName: string;
  permissions: {
    view: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    approve: boolean;
  };
}

export interface NotificationConfigRow {
  eventCode: string;
  eventName: string;
  web: boolean;
  mobile: boolean;
  sms: boolean;
  email: boolean;
}

export interface AuditLogEntry {
  timestamp: string;
  user: string;
  action: string;
  details: string;
  ip: string;
}
