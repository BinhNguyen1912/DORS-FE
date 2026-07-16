import { create } from 'zustand';
import { notificationApi } from '../apis/notification.api';
import { toast } from './toast.store';

export interface NotificationItem {
  id: number;
  title: string;
  content: string;
  type: 'SOS' | 'RESCUE' | 'FLOOD' | 'SYSTEM' | 'HELP';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  isRead: boolean;
  createdAt: string; // ISO String or display string
  dateGroup: 'Hôm nay' | 'Hôm qua' | 'Cũ hơn';
  time: string; // display time e.g., '10:30'
  meta?: Record<string, string>;
  fullContent?: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  isLoading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  deleteMultiple: (ids: number[]) => Promise<void>;
  markMultipleAsRead: (ids: number[]) => Promise<void>;
  addNotification: (notif: Omit<NotificationItem, 'id' | 'isRead'>) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [], // Start with empty list to let user test
  isLoading: false,
  error: null,
  
  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await notificationApi.getMyNotifications();
      if (Array.isArray(data)) {
        const parsedData = data.map((item: any) => ({
          ...item,
          id: Number(item.id) || Math.floor(Math.random() * 1000000)
        }));
        set({ 
          notifications: parsedData,
          isLoading: false 
        });
      } else {
        set({ isLoading: false });
      }
    } catch (err: any) {
      console.error('Failed to fetch notifications from backend', err);
      set({ 
        error: err.message || 'Không thể lấy dữ liệu thông báo', 
        isLoading: false 
      });
    }
  },

  markAsRead: async (id) => {
    const previousState = get().notifications;
    
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
    }));

    try {
      await notificationApi.markAsRead(String(id));
    } catch (err) {
      console.error('Failed to mark notification as read on backend', err);
      set({ notifications: previousState });
      toast.error('Không thể cập nhật trạng thái đã đọc.');
    }
  },

  markAllAsRead: async () => {
    const previousState = get().notifications;

    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
    }));

    try {
      await notificationApi.markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all notifications as read on backend', err);
      set({ notifications: previousState });
      toast.error('Không thể đánh dấu tất cả đã đọc.');
    }
  },

  deleteNotification: async (id) => {
    const previousState = get().notifications;

    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));

    try {
      await notificationApi.deleteNotification(String(id));
    } catch (err) {
      console.error('Failed to delete notification on backend', err);
      set({ notifications: previousState });
      toast.error('Không thể xóa thông báo.');
    }
  },

  deleteMultiple: async (ids) => {
    const previousState = get().notifications;
    set((state) => ({
      notifications: state.notifications.filter((n) => !ids.includes(n.id)),
    }));
    try {
      await notificationApi.bulkDelete(ids);
      toast.success(`Đã xóa thành công ${ids.length} thông báo.`);
    } catch (err) {
      console.error('Failed to bulk delete', err);
      set({ notifications: previousState });
      toast.error('Có lỗi xảy ra khi xóa hàng loạt.');
    }
  },

  markMultipleAsRead: async (ids) => {
    const previousState = get().notifications;
    set((state) => ({
      notifications: state.notifications.map((n) =>
        ids.includes(n.id) ? { ...n, isRead: true } : n
      ),
    }));
    try {
      await notificationApi.bulkMarkAsRead(ids);
      toast.success(`Đã đánh dấu đọc ${ids.length} thông báo.`);
    } catch (err) {
      console.error('Failed to bulk mark read', err);
      set({ notifications: previousState });
      toast.error('Có lỗi xảy ra khi đánh dấu đọc.');
    }
  },

  addNotification: (notif) => {
    const id = Math.floor(Math.random() * 1000000);
    set((state) => ({
      notifications: [
        {
          ...notif,
          id,
          isRead: false,
        },
        ...state.notifications,
      ],
    }));
  },
}));
