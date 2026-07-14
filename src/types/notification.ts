export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum NotificationChannel {
  APP = 'APP',
  PUSH = 'PUSH',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  ZALO = 'ZALO'
}

export enum NotificationDeliveryStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  READ = 'READ'
}

export interface NotificationTemplate {
  id: number;
  eventId: number;
  groupId: number;
  code: string;
  name: string;
  titleTemplate: string;
  contentTemplate: string;
  defaultPriority: NotificationPriority;
  defaultChannels: NotificationChannel[];
  variables: string[];
  provinceId?: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  event?: { id: number; code: string; name: string };
  group?: { id: number; code: string; name: string };
}

export interface NotificationEvent {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface NotificationTemplateGroup {
  id: number;
  code: string;
  name: string;
  createdAt: string;
}

export interface NotificationLog {
  id: string;
  notificationId: number;
  recipientId: string;
  channel: NotificationChannel;
  status: 'SUCCESS' | 'FAILED';
  message?: string;
  sentAt: string;
  notification?: {
    id: number;
    title: string;
    content: string;
    priority: NotificationPriority;
  };
  recipient?: {
    id: string;
    userId: number;
    user?: {
      id: number;
      fullName: string;
      phone: string;
    };
  };
}
