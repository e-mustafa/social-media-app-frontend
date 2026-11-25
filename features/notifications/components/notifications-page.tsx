'use client';

import { useRouter } from '@/i18n/navigation';
import { Button } from '@/shared/components/ui/button';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { cn } from '@/shared/utils/utils';
import { BellIcon, ChevronLeftIcon, Trash2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useDeleteAllNotifications, useMarkAllAsRead, useNotifications, useUnreadCount } from '../hooks/use-notifications';
import NotificationItem from './notification-item';

export default function NotificationsPage() {
	const t = useTranslations();
	const router = useRouter();

	const {
		data,
		isLoading: isQueryLoading,
		isFetchingNextPage,
		hasNextPage,
		fetchNextPage,
		refetch,
	} = useNotifications({}, true);
	const { data: unreadCountData } = useUnreadCount(true);
	const markAllAsReadMutation = useMarkAllAsRead();
	const deleteAllMutation = useDeleteAllNotifications();

	const notifications = data?.pages.flatMap((page) => page.data || []) || [];
	const unreadCount = unreadCountData?.data || 0;

	useEffect(() => {
		refetch();
	}, [refetch]);

	const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
		const target = e.currentTarget;
		if (target.scrollHeight - target.scrollTop - target.clientHeight < 100 && hasNextPage && !isFetchingNextPage) {
			fetchNextPage();
		}
	};

	const handleMarkAllAsRead = () => {
		markAllAsReadMutation.mutate();
	};

	const handleDeleteAll = () => {
		deleteAllMutation.mutate();
	};

	const handleBack = () => {
		router.back();
	};

	if (isQueryLoading) {
		return (
			<div className='space-y-4 mt-4'>
				{Array.from({ length: 5 }).map((_, index) => (
					<div key={index} className='flex gap-3'>
						<Skeleton className='size-10 rounded-full' />
						<div className='flex-1 space-y-2'>
							<Skeleton className='h-4 w-3/4' />
							<Skeleton className='h-3 w-1/2' />
						</div>
					</div>
				))}
			</div>
		);
	}

	return (
		<div className='flex flex-col h-full'>
			<div className='flex items-center justify-between gap-4 border-b border-border p-4'>
				<div className='flex items-center gap-3'>
					<Button
						type='button'
						variant='ghost'
						size='icon'
						className='size-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50'
						onClick={handleBack}
						aria-label={t('notifications.page.back') || 'Back'}
					>
						<ChevronLeftIcon className='size-5' />
					</Button>
					<div className='flex gap-3 items-center'>
						<h1 className='text-xl font-semibold text-foreground'>
							{t('notifications.page.title') || 'Notifications'}
						</h1>
						{unreadCount > 0 && (
							<span
								className={cn(
									'inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-sm font-medium text-primary',
									unreadCount > 99 && 'min-w-6 px-1',
								)}
							>
								<BellIcon className='size-5' />
								{unreadCount > 99 ? '99+' : unreadCount}
							</span>
						)}
					</div>
				</div>
				<div className='flex items-center gap-2'>
					{unreadCount >= 0 && (
						<Button
							type='button'
							variant='outline'
							onClick={handleMarkAllAsRead}
							disabled={markAllAsReadMutation.isPending || !!(notifications?.length || 0)}
						>
							{markAllAsReadMutation.isPending
								? t('posts.feedTitle')
								: t('notifications.page.markAllAsRead') || 'Mark all as read'}
						</Button>
					)}
					<Button
						type='button'
						variant='destructive'
						onClick={handleDeleteAll}
						disabled={deleteAllMutation.isPending || notifications.length === 0}
						aria-label={t('notifications.page.clearAll') || 'Clear all'}
					>
						<Trash2Icon className='size-4' />
						{t('notifications.page.clearAll') || 'Clear all'}
					</Button>
				</div>
			</div>

			<div className='flex-1 overflow-hidden'>
				<ScrollArea className='h-full' onScroll={handleScroll}>
					{notifications.length > 0 ? (
						<div className='space-y-1'>
							{notifications.map((notification) => (
								<NotificationItem key={notification._id} notification={notification} />
							))}
							{isFetchingNextPage && (
								<div className='flex justify-center py-4'>
									<Skeleton className='h-4 w-20' />
								</div>
							)}
						</div>
					) : (
						<div className='flex flex-col items-center justify-center gap-4 h-full px-4 text-center mt-10'>
							<BellIcon className='size-16 text-muted-foreground/50' />
							<p className='text-base font-medium text-muted-foreground'>
								{t('notifications.page.empty') || 'No notifications yet'}
							</p>
							<p className='text-sm text-muted-foreground'>
								{t('notifications.page.emptyDesc') || 'When you receive notifications, they will appear here.'}
							</p>
						</div>
					)}
				</ScrollArea>
			</div>
		</div>
	);
}
