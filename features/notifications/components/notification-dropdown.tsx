'use client';

import { useRouter } from '@/i18n/navigation';
import { Button } from '@/shared/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { APP_ROUTES } from '@/shared/config/app-configs';
import { cn } from '@/shared/utils/utils';
import { BellIcon, CheckCheckIcon, ChevronRightIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useMarkAllAsRead, useNotifications, useUnreadCount } from '../hooks/use-notifications';
import NotificationItem from './notification-item';

export default function NotificationDropdown() {
	const t = useTranslations();
	const [isOpen, setIsOpen] = useState(false);
	const router = useRouter();

	const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } = useNotifications({}, isOpen);
	const { data: unreadCountData } = useUnreadCount(true);
	const markAllAsReadMutation = useMarkAllAsRead();

	const notifications = data?.pages.flatMap((page) => page.data || []) || [];
	const unreadCount = unreadCountData?.data || 0;

	useEffect(() => {
		if (isOpen) {
			refetch();
		}
	}, [isOpen, refetch]);

	const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
		const target = e.currentTarget;
		if (target.scrollHeight - target.scrollTop - target.clientHeight < 100 && hasNextPage && !isFetchingNextPage) {
			fetchNextPage();
		}
	};

	const handleMarkAllAsRead = () => {
		markAllAsReadMutation.mutate();
	};

	const handleViewAll = () => {
		setIsOpen(true);
		router.push(APP_ROUTES.notifications);
	};

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger asChild>
				<Button
					type='button'
					variant='ghost'
					size='icon'
					className='relative size-10 rounded-full text-brand-primary hover:text-foreground transition-all'
					// className='relative size-10 rounded-xl text-brand-primary hover:text-foreground hover:bg-muted/50 transition-colors'
					aria-expanded={isOpen}
					aria-haspopup='true'
					aria-label={t('notifications.dropdown.title') || 'Notifications'}
				>
					<BellIcon className='size-5' />
					{unreadCount > 0 && (
						<span
							className={cn(
								'absolute top-0 inset-s-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-xs font-medium text-white',
								unreadCount > 99 && 'min-w-6 px-1',
							)}
						>
							{unreadCount > 99 ? '99+' : unreadCount}
						</span>
					)}
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent
				align='end'
				sideOffset={8}
				className={cn(
					'w-96 max-w-[calc(100vw-2rem)] sm:max-w-sm',
					'border-border/60 bg-card-glass backdrop-blur-md p-1.5 shadow-lg shadow-brand-secondary/30',
				)}
			>
				<div className='flex items-center justify-between border-b border-border p-3'>
					<DropdownMenuLabel className='text-sm font-semibold text-foreground'>
						{t('notifications.dropdown.title') || 'Notifications'}
					</DropdownMenuLabel>
					<div className='flex items-center gap-2'>
						{unreadCount > 0 && (
							<DropdownMenuItem
								onClick={handleMarkAllAsRead}
								disabled={markAllAsReadMutation.isPending}
								className='h-8 px-2 text-xs'
								inset
							>
								<CheckCheckIcon />
								{markAllAsReadMutation.isPending
									? t('common.loading')
									: t('notifications.dropdown.markAllAsRead') || 'Mark all as read'}
							</DropdownMenuItem>
						)}
						<DropdownMenuItem
							onClick={() => setIsOpen(false)}
							className='size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 p-0'
						>
							<XIcon className='size-4 mx-auto' />
						</DropdownMenuItem>
					</div>
				</div>

				<div className='max-h-[60vh] overflow-auto'>
					<ScrollArea className='p-2' onScroll={handleScroll}>
						{isLoading ? (
							<div className='space-y-3'>
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
						) : notifications.length > 0 ? (
							<div className='space-y-1'>
								{notifications.map((notification) => (
									<NotificationItem
										key={notification._id}
										notification={notification}
										onClick={() => setIsOpen(false)}
									/>
								))}
								{isFetchingNextPage && (
									<div className='flex justify-center py-2'>
										<Skeleton className='h-4 w-20' />
									</div>
								)}
							</div>
						) : (
							<div className='flex flex-col items-center justify-center gap-3 py-8 px-4 text-center'>
								<BellIcon className='size-12 text-muted-foreground/50' />
								<p className='text-sm font-medium text-muted-foreground'>
									{t('notifications.dropdown.empty') || 'No notifications'}
								</p>
							</div>
						)}
					</ScrollArea>
				</div>

				<DropdownMenuSeparator />

				<DropdownMenuItem
					onClick={handleViewAll}
					className='flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-primary/80'
					inset
				>
					{t('notifications.dropdown.viewAll') || 'View all notifications'}
					<ChevronRightIcon className='size-4' />
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
