'use client';

import { useBlockUser } from '@/features/block/hooks/use-block';
import { Link } from '@/i18n/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { MoreHorizontalIcon, UserIcon, UserXIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FriendUser, IFriend } from '../types';

interface FriendItemProps {
	friend: IFriend;
	currentUserId?: string;
}

export default function FriendItem({ friend, currentUserId }: FriendItemProps) {
	const t = useTranslations();
	const blockMutation = useBlockUser();

	const friendUser = (
		typeof friend.sendBy === 'object' && friend.sendBy._id === currentUserId ? friend.sendTo : friend.sendBy
	) as FriendUser;

	const fullName = friendUser
		? `${friendUser.firstName || ''} ${friendUser.lastName || ''}`.trim() || friendUser.username || 'User'
		: 'User';
	const avatarUrl = friendUser?.avatar?.url || '/images/default-avatar.png';
	const initials = `${friendUser?.firstName?.[0] || ''}${friendUser?.lastName?.[0] || ''}`.toUpperCase() || 'F';
	const targetUserId = friendUser?._id;

	return (
		<Card className='p-4 bg-card-blur border border-border/20 shadow-sm transition-all hover:shadow-md flex flex-row items-center justify-between gap-4 rounded-xl'>
			<div className='flex items-center gap-3 min-w-0'>
				<Avatar className='w-12 h-12 border border-border/20 shrink-0'>
					<AvatarImage src={avatarUrl} alt={fullName} />
					<AvatarFallback className='bg-primary/10 text-primary font-medium'>{initials}</AvatarFallback>
				</Avatar>
				<div className='min-w-0 flex-1'>
					{friendUser?.username ? (
						<Link
							href={`/u/${friendUser.username}`}
							className='font-semibold text-foreground hover:underline truncate block'
						>
							{fullName}
						</Link>
					) : (
						<span className='font-semibold text-foreground truncate block'>{fullName}</span>
					)}
					{friendUser?.username && <p className='text-xs text-muted-foreground truncate'>@{friendUser.username}</p>}
				</div>
			</div>

			<div className='flex items-center gap-2 shrink-0'>
				{friendUser?.username && (
					<Button asChild size='sm' variant='outline' className='hidden sm:flex items-center gap-1.5'>
						<Link href={`/u/${friendUser.username}`}>
							<UserIcon className='w-4 h-4' />
							{t('friends.item.viewProfile') || 'View Profile'}
						</Link>
					</Button>
				)}

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant='ghost' size='icon' className='h-8 w-8 text-muted-foreground hover:text-foreground'>
							<MoreHorizontalIcon className='w-4 h-4' />
							<span className='sr-only'>{t('friends.item.options') || 'Options'}</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align='end' className='w-48 bg-card-glass backdrop-blur-lg'>
						{friendUser?.username && (
							<DropdownMenuItem asChild>
								<Link href={`/u/${friendUser.username}`} className='flex items-center gap-2 cursor-pointer'>
									<UserIcon className='w-4 h-4' />
									{t('friends.item.viewProfile') || 'View Profile'}
								</Link>
							</DropdownMenuItem>
						)}
						{targetUserId && (
							<DropdownMenuItem
								className='text-destructive focus:text-destructive flex items-center gap-2 cursor-pointer'
								disabled={blockMutation.isPending}
								onClick={() => blockMutation.mutate(targetUserId)}
							>
								<UserXIcon className='w-4 h-4' />
								{t('friends.item.block') || 'Block User'}
							</DropdownMenuItem>

							// TODO: add unfriend option
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</Card>
	);
}
