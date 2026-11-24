'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { MoreHorizontalIcon, Trash2Icon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Notification } from '../types';
import { useDeleteNotification, useMarkAsRead } from '../hooks/use-notifications';
import { defaultImages } from '@/shared/config/app-configs';

interface NotificationItemProps {
	notification: Notification;
	onClick?: () => void;
}

const getNotificationActionUrl = (notification: Notification): string | null => {
	if (notification.postId) return `/posts/${notification.postId}`;
	if (notification.commentId) return `/posts/${notification.postId}?comment=${notification.commentId}`;
	if (notification.replyId) return `/posts/${notification.postId}?comment=${notification.commentId}&reply=${notification.replyId}`;
	if (notification.requestId) return `/friends?request=${notification.requestId}`;
	return null;
};

export default function NotificationItem({ notification, onClick }: NotificationItemProps) {
	const t = useTranslations('notifications');
	const locale = useLocale();
	const [showMenu, setShowMenu] = useState(false);
	const markAsReadMutation = useMarkAsRead();
	const deleteMutation = useDeleteNotification();

	const isUnread = !notification.readAt;
	const senderName = `${notification.sendBy.firstName || ''} ${notification.sendBy.lastName || ''}`.trim() || 'Someone';
	const senderInitials = `${notification.sendBy.firstName?.[0] || ''}${notification.sendBy.lastName?.[0] || ''}`.toUpperCase() || 'U';
	const createdAt = formatDistanceToNow(new Date(notification.createdAt), {
		addSuffix: true,
		locale: locale === 'ar' ? ar : enUS,
	});
	const actionUrl = getNotificationActionUrl(notification);

	const handleClick = () => {
		if (isUnread) {
			markAsReadMutation.mutate(notification._id);
		}
		if (actionUrl) {
			window.location.href = actionUrl;
		}
		onClick?.();
	};

	const handleDelete = (e: React.MouseEvent) => {
		e.stopPropagation();
		deleteMutation.mutate(notification._id);
		setShowMenu(false);
	};

	return (
		<div
			className={cn(
				'flex gap-3 p-3 rounded-2xl transition-all cursor-pointer m-1 hover:zoom-105',
				isUnread ? 'bg-primary/5 ring-1 ring-primary/20' : 'bg-card/50 hover:bg-muted/30',
			)}
			onClick={handleClick}
			role='button'
			tabIndex={0}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					handleClick();
				}
			}}
		>
			<div className='relative shrink-0'>
				<Avatar className='size-10 border border-border/20'>
					<AvatarImage src={notification.sendBy.avatar?.url || defaultImages.avatarMale} alt={senderName} />
					<AvatarFallback className='bg-primary/10 text-xs text-primary'>{senderInitials}</AvatarFallback>
				</Avatar>
				{isUnread && (
					<span className='absolute bottom-0 right-0 size-2.5 rounded-full bg-primary border-2 border-background' />
				)}
			</div>

			<div className='flex-1 min-w-0'>
				<div className='flex items-start justify-between gap-2'>
					<div className='flex-1 min-w-0'>
						<p
							className={cn(
								'text-sm leading-5',
								isUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground',
							)}
						>
							{notification.title}
						</p>
						<p className='mt-0.5 text-sm text-muted-foreground line-clamp-2'>{notification.body}</p>
						<p className='mt-1 text-xs text-muted-foreground'>{createdAt}</p>
					</div>

					<div className='relative'>
						<Button
							type='button'
							variant='ghost'
							size='icon'
							className='size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50'
							onClick={(e) => {
								e.stopPropagation();
								setShowMenu((prev) => !prev);
							}}
							aria-expanded={showMenu}
							aria-haspopup='true'
						>
							<MoreHorizontalIcon className='size-4' />
						</Button>

						{showMenu && (
							<div className='absolute inset-e-0 top-full mt-1 z-10 w-36 rounded-xl border border-border bg-card shadow-lg py-1 animate-in zoom-in-95 duration-100'>
								{isUnread && (
									<button
										type='button'
										className='flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted'
										onClick={(e) => {
											e.stopPropagation();
											markAsReadMutation.mutate(notification._id);
											setShowMenu(false);
										}}
									>
										✓ {t('item.markAsRead') || 'Mark as read'}
									</button>
								)}
								<button
									type='button'
									className='flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10'
									onClick={handleDelete}
								>
									<Trash2Icon className='size-4' />
									{t('item.delete') || 'Delete'}
								</button>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}