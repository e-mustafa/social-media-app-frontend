import { useMutation, useQuery, useQueryClient, useInfiniteQuery, InfiniteData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { notificationsService } from '../services/notifications.service';
import { Notification, NotificationQueryParams, NotificationsResponse } from '../types';

export const NOTIFICATIONS_QUERY_KEYS = {
	all: ['notifications'] as const,
	list: (params?: NotificationQueryParams) => ['notifications', 'list', params] as const,
	unreadCount: ['notifications', 'unread-count'] as const,
};

export function useNotifications(params?: NotificationQueryParams, enabled = true) {
	return useInfiniteQuery({
		queryKey: NOTIFICATIONS_QUERY_KEYS.list(params),
		queryFn: ({ pageParam = 1 }) => notificationsService.listNotifications({ ...params, page: pageParam }),
		enabled,
		initialPageParam: 1,
		getNextPageParam: (lastPage) => {
			const metadata = lastPage.metadata;
			return metadata?.hasNext ? (metadata?.page || 1) + 1 : undefined;
		},
	});
}

export function useUnreadCount(enabled = true) {
	return useQuery({
		queryKey: NOTIFICATIONS_QUERY_KEYS.unreadCount,
		queryFn: () => notificationsService.getUnreadCount(),
		enabled,
		refetchInterval: 30000,
		staleTime: 10000,
	});
}

function updateInfiniteData(
	old: InfiniteData<NotificationsResponse> | NotificationsResponse | undefined,
	updater: (notifications: Notification[] | undefined) => Notification[] | undefined,
	unreadDelta?: number
): InfiniteData<NotificationsResponse> | NotificationsResponse | undefined {
	if (!old) return old;

	if ('pages' in old) {
		return {
			...old,
			pages: old.pages.map((page) => ({
				...page,
				data: updater(page.data),
				unread: unreadDelta !== undefined ? Math.max(page.unread + unreadDelta, 0) : page.unread,
			})),
		};
	}

	return {
		...old,
		data: updater(old.data),
		unread: unreadDelta !== undefined ? Math.max(old.unread + unreadDelta, 0) : old.unread,
	};
}

export function useMarkAsRead() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (notificationId: string) => notificationsService.markAsRead(notificationId),
		onMutate: async (notificationId) => {
			await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEYS.all });

			const previousNotifications = queryClient.getQueriesData({ queryKey: NOTIFICATIONS_QUERY_KEYS.all });

			previousNotifications.forEach(([queryKey]) => {
				queryClient.setQueryData(queryKey, (old: InfiniteData<NotificationsResponse> | NotificationsResponse | undefined) =>
					updateInfiniteData(old, (notifications) =>
						notifications?.map((n) => (n._id === notificationId ? { ...n, readAt: new Date().toISOString() } : n)),
					),
				);
			});

			// Update unread count
			queryClient.setQueryData(NOTIFICATIONS_QUERY_KEYS.unreadCount, (old: { data: number } | undefined) => {
				if (!old) return old;
				return { ...old, data: Math.max((old.data || 1) - 1, 0) };
			});

			return { previousNotifications };
		},
		onError: (error, _variables, context) => {
			context?.previousNotifications.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
			toast.error(error.message || 'Failed to mark as read');
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEYS.all });
		},
	});
}

export function useMarkAllAsRead() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => notificationsService.markAllAsRead(),
		onMutate: async () => {
			await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEYS.all });

			const previousNotifications = queryClient.getQueriesData({ queryKey: NOTIFICATIONS_QUERY_KEYS.all });

			previousNotifications.forEach(([queryKey]) => {
				queryClient.setQueryData(queryKey, (old: InfiniteData<NotificationsResponse> | NotificationsResponse | undefined) =>
					updateInfiniteData(
						old,
						(notifications) => notifications?.map((n) => ({ ...n, readAt: new Date().toISOString() })),
					),
				);
			});

			// Update unread count
			queryClient.setQueryData(NOTIFICATIONS_QUERY_KEYS.unreadCount, (old: { data: number } | undefined) => {
				if (!old) return old;
				return { ...old, data: 0 };
			});

			return { previousNotifications };
		},
		onError: (error, _variables, context) => {
			context?.previousNotifications.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
			toast.error(error.message || 'Failed to mark all as read');
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEYS.all });
		},
	});
}

export function useDeleteNotification() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (notificationId: string) => notificationsService.deleteNotification(notificationId),
		onMutate: async (notificationId) => {
			await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEYS.all });

			const previousNotifications = queryClient.getQueriesData({ queryKey: NOTIFICATIONS_QUERY_KEYS.all });

			previousNotifications.forEach(([queryKey]) => {
				queryClient.setQueryData(queryKey, (old: InfiniteData<NotificationsResponse> | NotificationsResponse | undefined) =>
					updateInfiniteData(old, (notifications) => notifications?.filter((n) => n._id !== notificationId)),
				);
			});

			return { previousNotifications };
		},
		onError: (error, _variables, context) => {
			context?.previousNotifications.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
			toast.error(error.message || 'Failed to delete notification');
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEYS.all });
		},
	});
}

export function useDeleteAllNotifications() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => notificationsService.deleteAllNotifications(),
		onSuccess: () => {
			queryClient.setQueryData(NOTIFICATIONS_QUERY_KEYS.list(undefined), (old: InfiniteData<NotificationsResponse> | NotificationsResponse | undefined) => {
				if (!old) return old;
				if ('pages' in old) {
					return { ...old, pages: [{ ...old.pages[0], data: [], unread: 0 }] };
				}
				return { ...old, data: [], unread: 0 };
			});
			queryClient.setQueryData(NOTIFICATIONS_QUERY_KEYS.unreadCount, (old: { data: number } | undefined) => {
				if (!old) return old;
				return { ...old, data: 0 };
			});
			toast.success('All notifications cleared');
		},
		onError: (error) => {
			toast.error(error.message || 'Failed to clear notifications');
		},
	});
}