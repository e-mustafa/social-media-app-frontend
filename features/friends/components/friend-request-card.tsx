'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Link } from '@/i18n/navigation';
import { CheckIcon, Loader2Icon, UserXIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { IFriend, FriendUser } from '../types';
import { useAcceptFriendRequest, useCancelFriendRequest, useRejectFriendRequest } from '../hooks/use-friends';
import { defaultImages } from '@/shared/config/app-configs';

interface FriendRequestCardProps {
	request: IFriend;
	type: 'received' | 'sent';
}

export default function FriendRequestCard({ request, type }: FriendRequestCardProps) {
	const t = useTranslations();
	const acceptMutation = useAcceptFriendRequest();
	const rejectMutation = useRejectFriendRequest();
	const cancelMutation = useCancelFriendRequest();

	const isReceived = type === 'received';
	const targetUser = (isReceived ? request.sendBy : request.sendTo) as FriendUser;

	const fullName = targetUser
		? `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim() || targetUser.username || 'User'
		: 'User';
	const avatarUrl = targetUser?.avatar?.url || defaultImages.avatarMale;
	const initials = `${targetUser?.firstName?.[0] || ''}${targetUser?.lastName?.[0] || ''}`.toUpperCase() || 'U';

	const isPending = acceptMutation.isPending || rejectMutation.isPending || cancelMutation.isPending;

	return (
		<Card className='p-4 bg-card-blur border border-border/20 shadow-sm transition-all hover:shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl'>
			<div className='flex items-center gap-3 min-w-0 w-full sm:w-auto'>
				<Avatar className='w-12 h-12 border border-border/20 shrink-0'>
					<AvatarImage src={avatarUrl} alt={fullName} />
					<AvatarFallback className='bg-primary/10 text-primary font-medium'>{initials}</AvatarFallback>
				</Avatar>
				<div className='min-w-0 flex-1'>
					{targetUser?.username ? (
						<Link
							href={`/u/${targetUser.username}`}
							className='font-semibold text-foreground hover:underline truncate block'
						>
							{fullName}
						</Link>
					) : (
						<span className='font-semibold text-foreground truncate block'>{fullName}</span>
					)}
					{targetUser?.username && (
						<p className='text-xs text-muted-foreground truncate'>@{targetUser.username}</p>
					)}
				</div>
			</div>

			<div className='flex items-center gap-2 w-full sm:w-auto justify-end shrink-0'>
				{isReceived ? (
					<>
						<Button
							type='button'
							size='sm'
							variant='default'
							className='gap-1.5 font-medium min-w-[90px]'
							disabled={isPending}
							onClick={() => acceptMutation.mutate(request._id)}
						>
							{acceptMutation.isPending ? (
								<Loader2Icon className='w-4 h-4 animate-spin' />
							) : (
								<>
									<CheckIcon className='w-4 h-4' />
									{t('friends.requests.accept') || 'Accept'}
								</>
							)}
						</Button>
						<Button
							type='button'
							size='sm'
							variant='outline'
							className='gap-1.5 text-destructive hover:bg-destructive/10 border-destructive/20 font-medium min-w-[90px]'
							disabled={isPending}
							onClick={() => rejectMutation.mutate(request._id)}
						>
							{rejectMutation.isPending ? (
								<Loader2Icon className='w-4 h-4 animate-spin' />
							) : (
								<>
									<XIcon className='w-4 h-4' />
									{t('friends.requests.reject') || 'Reject'}
								</>
							)}
						</Button>
					</>
				) : (
					<Button
						type='button'
						size='sm'
						variant='outline'
						className='gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-border/20 font-medium'
						disabled={isPending}
						onClick={() => cancelMutation.mutate(request._id)}
					>
						{cancelMutation.isPending ? (
							<Loader2Icon className='w-4 h-4 animate-spin' />
						) : (
							<>
								<UserXIcon className='w-4 h-4' />
								{t('friends.requests.cancel') || 'Cancel Request'}
							</>
						)}
					</Button>
				)}
			</div>
		</Card>
	);
}
