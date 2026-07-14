import api from '../lib/axios';
import type { 
  NotificationTemplate, 
  NotificationEvent, 
  NotificationTemplateGroup, 
  NotificationLog 
} from '../types';

export const notificationApi = {
  getTemplates: async (): Promise<NotificationTemplate[]> => {
    const response = await api.get<any>('/notification-templates');
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  getTemplateById: async (id: number): Promise<NotificationTemplate> => {
    const response = await api.get<any>(`/notification-templates/${id}`);
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  createTemplate: async (data: Partial<NotificationTemplate>): Promise<NotificationTemplate> => {
    const response = await api.post<any>('/notification-templates', data);
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  updateTemplate: async (id: number, data: Partial<NotificationTemplate>): Promise<NotificationTemplate> => {
    const response = await api.put<any>(`/notification-templates/${id}`, data);
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  deleteTemplate: async (id: number): Promise<void> => {
    await api.delete(`/notification-templates/${id}`);
  },

  testRender: async (data: {
    titleTemplate: string;
    contentTemplate: string;
    data: Record<string, any>;
  }): Promise<{ title: string; content: string }> => {
    const response = await api.post<any>('/notification-templates/test-render', data);
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  getEvents: async (): Promise<NotificationEvent[]> => {
    const response = await api.get<any>('/notification-events');
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  getTemplateGroups: async (): Promise<NotificationTemplateGroup[]> => {
    const response = await api.get<any>('/notification-events/groups');
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  getLogs: async (channel?: string): Promise<NotificationLog[]> => {
    const response = await api.get<any>('/notifications/logs', { params: { channel } });
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  sendNotification: async (data: {
    event: string;
    data: Record<string, any>;
    provinceId?: number;
    recipientUserIds?: number[];
  }): Promise<any> => {
    const response = await api.post<any>('/notifications/send', data);
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  getMyNotifications: async (): Promise<any[]> => {
    const response = await api.get<any>('/notifications/my');
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  markAsRead: async (id: string): Promise<any> => {
    const response = await api.patch<any>(`/notifications/${id}/read`);
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  markAllAsRead: async (): Promise<any> => {
    const response = await api.patch<any>('/notifications/read-all/bulk');
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  deleteNotification: async (id: string): Promise<any> => {
    const response = await api.delete<any>(`/notifications/${id}`);
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  getSentNotifications: async (): Promise<any[]> => {
    const response = await api.get<any>('/notifications');
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  bulkMarkAsRead: async (ids: number[]): Promise<any> => {
    const response = await api.post<any>('/notifications/bulk-read', { ids });
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  bulkDelete: async (ids: number[]): Promise<any> => {
    const response = await api.post<any>('/notifications/bulk-delete', { ids });
    return response.data?.data !== undefined ? response.data.data : response.data;
  },
};
