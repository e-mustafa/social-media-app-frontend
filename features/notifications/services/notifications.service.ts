import { apiClient } from '@/shared/utils/apiClient';
import { IResponse } from '@/shared/types';
import { NotificationQueryParams, NotificationsResponse, UnreadCountResponse, MarkAsReadResponse, DeleteNotificationResponse } from '../types';

const toQueryString = (params?: NotificationQueryParams) => {
	const searchParams = new URLSearchParams();
	if (params?.page) searchParams.append('page', String(params.page));
	if (params?.limit) searchParams.append('limit', String(params.limit));
	if (params?.order) searchParams.append('order', params.order);
	if (params?.unreadOnly) searchParams.append('unreadOnly', String(params.unreadOnly));
	return searchParams.toString() ? `?${searchParams.toString()}` : '';
};

export const notificationsService = {
	async listNotifications(params?: NotificationQueryParams): Promise<NotificationsResponse> {
		return apiClient.get<NotificationsResponse>(`/notifications${toQueryString(params)}`);
	},

	async getUnreadCount(): Promise<UnreadCountResponse> {
		return apiClient.get<UnreadCountResponse>('/notifications/unread-count');
	},

	async markAsRead(notificationId: string): Promise<MarkAsReadResponse> {
		return apiClient.patch<MarkAsReadResponse>(`/notifications/${notificationId}`, {});
	},

	async markAllAsRead(): Promise<IResponse<void>> {
		return apiClient.patch<IResponse<void>>('/notifications', {});
	},

	async deleteNotification(notificationId: string): Promise<DeleteNotificationResponse> {
		return apiClient.delete<DeleteNotificationResponse>(`/notifications/${notificationId}`);
	},

	async deleteAllNotifications(): Promise<IResponse<void>> {
		return apiClient.delete<IResponse<void>>('/notifications', {});
	},
};