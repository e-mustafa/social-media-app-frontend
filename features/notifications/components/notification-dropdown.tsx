'use client';

import { Link } from '@/i18n/navigation';
import { Button } from '@/shared/components/ui/button';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { APP_ROUTES } from '@/shared/config/app-configs';
import { cn } from '@/shared/utils/utils';
import { BellIcon, ChevronRightIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { useDeleteAllNotifications, useMarkAllAsRead, useNotifications, useUnreadCount } from '../hooks/use-notifications';
import NotificationItem from './notification-item';

export default function NotificationDropdown() {
	const t = useTranslations();
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);

	const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } = useNotifications({}, isOpen);
	const { data: unreadCountData } = useUnreadCount(true);
	const markAllAsReadMutation = useMarkAllAsRead();
	const deleteAllMutation = useDeleteAllNotifications();

	const notifications = data?.pages.flatMap((page) => page.data || []) || [];
	const unreadCount = unreadCountData?.data || 0;

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
					setIsOpen(false);
				}
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

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

	const toggleDropdown = () => {
		setIsOpen((prev) => !prev);
	};

	const handleMarkAllAsRead = () => {
		markAllAsReadMutation.mutate();
	};

	const handleDeleteAll = () => {
		deleteAllMutation.mutate();
	};

	return (
		<div className='relative' ref={dropdownRef}>
			<Button
				ref={buttonRef}
				type='button'
				variant='ghost'
				size='icon'
				className='relative size-10 rounded-xl text-brand-primary hover:text-foreground hover:bg-muted/50 transition-colors'
				onClick={toggleDropdown}
				aria-expanded={isOpen}
				aria-haspopup='true'
				aria-label={t('notifications.dropdown.title') || 'Notifications'}
			>
				<BellIcon className='size-5' />
				{unreadCount > 0 && (
					<span
						className={cn(
							'absolute top-0 start-0 flex 4 min-w-4 items-center justify-center rounded-full bg-destructive text-xs font-medium text-white',
							unreadCount > 99 && 'min-w-6 px-1',
						)}
					>
						{unreadCount > 99 ? '99+' : unreadCount}
					</span>
				)}
			</Button>

			{isOpen && (
				<div className='absolute end-0 top-full mt-2 w-96 max-w-full sm:max-w-sm origin-top-right rounded-2xl border border-border bg-card/70 backdrop-blur-md shadow-lg animate-in zoom-in-95 duration-150 z-50'>
					<div className='flex items-center justify-between border-b border-border p-3'>
						<h3 className='text-sm font-semibold text-foreground'>
							{t('notifications.dropdown.title') || 'Notifications'}
						</h3>
						<div className='flex items-center gap-2'>
							{unreadCount > 0 && (
								<Button
									type='button'
									variant='ghost'
									size='sm'
									className='h-8 px-2 text-xs'
									onClick={handleMarkAllAsRead}
									disabled={markAllAsReadMutation.isPending}
								>
									{markAllAsReadMutation.isPending
										? t('common.loading')
										: t('notifications.dropdown.markAllAsRead') || 'Mark all as read'}
								</Button>
							)}
							<Button
								type='button'
								variant='ghost'
								size='icon'
								className='size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50'
								onClick={() => setIsOpen(false)}
								aria-label={t('common.close') || 'Close'}
							>
								<XIcon className='size-4' />
							</Button>
						</div>
					</div>

					<div className='max-h-[60vh]'>
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
									{unreadCount > 0 && (
										<Button
											variant='outline'
											size='sm'
											onClick={handleDeleteAll}
											disabled={deleteAllMutation.isPending}
										>
											{deleteAllMutation.isPending
												? t('common.loading')
												: t('notifications.dropdown.clearAll') || 'Clear all'}
										</Button>
									)}
								</div>
							)}
						</ScrollArea>
					</div>

					<div className='border-t border-border p-3'>
						<Link
							href={APP_ROUTES.notifications}
							className='flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors'
							onClick={() => setIsOpen(false)}
						>
							{t('notifications.dropdown.viewAll') || 'View all notifications'}
							<ChevronRightIcon className='size-4' />
						</Link>
					</div>
				</div>
			)}
		</div>
	);
}
