'use client';

import {
	useAcceptFriendRequest,
	useCancelFriendRequest,
	useMyFriends,
	useReceivedFriendRequests,
	useRejectFriendRequest,
	useSendFriendRequest,
	useSentFriendRequests,
} from '@/features/friends';
import type { IFriend } from '@/features/friends';
import useBlockUser from '@/features/profile/hooks/use-block-user';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/shared/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import {
	BanIcon,
	CheckIcon,
	ChevronDownIcon,
	Loader2Icon,
	MessageSquareIcon,
	UserCheckIcon,
	UserMinusIcon,
	UserPlusIcon,
	UserXIcon,
	XIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ProfileActionBarProps {
	targetUserId: string;
	isBlocked?: boolean;
}

export default function ProfileActionBar({ targetUserId, isBlocked }: ProfileActionBarProps) {
	const t = useTranslations();
	const router = useRouter();

	const { data: myFriendsData, isLoading: isLoadingFriends } = useMyFriends();
	const { data: receivedRequestsData, isLoading: isLoadingReceived } = useReceivedFriendRequests();
	const { data: sentRequestsData, isLoading: isLoadingSent } = useSentFriendRequests();

	const sendRequestMutation = useSendFriendRequest();
	const cancelRequestMutation = useCancelFriendRequest();
	const acceptRequestMutation = useAcceptFriendRequest();
	const rejectRequestMutation = useRejectFriendRequest();
	const { mutate: blockUser, isPending: isBlocking } = useBlockUser(targetUserId);

	const friends = myFriendsData?.pages?.flatMap((page) => page.data).filter((f): f is IFriend => f !== undefined) || [];
	const receivedRequests = receivedRequestsData?.pages?.flatMap((page) => page.data).filter((r): r is IFriend => r !== undefined) || [];
	const sentRequests = sentRequestsData?.pages?.flatMap((page) => page.data).filter((r): r is IFriend => r !== undefined) || [];

	const isFriend = friends.some(
		(f) =>
			(typeof f.sendBy === 'object' && (f.sendBy._id === targetUserId || f.sendBy.id === targetUserId)) ||
			(typeof f.sendTo === 'object' && (f.sendTo._id === targetUserId || f.sendTo.id === targetUserId)),
	);

	const receivedReq = receivedRequests.find(
		(r) => typeof r.sendBy === 'object' && (r.sendBy._id === targetUserId || r.sendBy.id === targetUserId),
	);

	const sentReq = sentRequests.find(
		(r) => typeof r.sendTo === 'object' && (r.sendTo._id === targetUserId || r.sendTo.id === targetUserId),
	);

	const isLoading = isLoadingFriends || isLoadingReceived || isLoadingSent;

	if (isLoading) {
		return (
			<div className='flex items-center gap-2'>
				<Button variant='outline' size='sm' disabled className='rounded-xl gap-2'>
					<Loader2Icon className='size-4 animate-spin' />
					<span>{t('common.loading') || 'Loading...'}</span>
				</Button>
			</div>
		);
	}

	return (
		<div className='flex flex-wrap items-center gap-2'>
			{isFriend ? (
				<>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant='outline' size='sm' className='rounded-xl gap-2 font-medium bg-card-blur'>
								<UserCheckIcon className='size-4 text-emerald-500' />
								<span>{t('friends.tabs.all') || 'Friends'}</span>
								<ChevronDownIcon className='size-3.5 opacity-60' />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end' className='w-40 rounded-xl bg-card-glass backdrop-blur-lg'>
							<DropdownMenuItem
								onClick={() => blockUser()}
								disabled={isBlocking}
								className='text-destructive focus:text-destructive gap-2 cursor-pointer'
							>
								<UserMinusIcon className='size-4' />
								<span>{t('friends.item.unfriend') || 'Unfriend / Block'}</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					<Button
						type='button'
						size='sm'
						className='rounded-xl gap-2 font-medium text-white'
						onClick={() => router.push('/messages')}
					>
						<MessageSquareIcon className='size-4' />
						<span>{t('profile.actions.message') || 'Message'}</span>
					</Button>
				</>
			) : receivedReq ? (
				<>
					<Button
						type='button'
						size='sm'
						variant='default'
						disabled={acceptRequestMutation.isPending || rejectRequestMutation.isPending}
						onClick={() => acceptRequestMutation.mutate(receivedReq._id)}
						className='rounded-xl gap-1.5 font-medium'
					>
						{acceptRequestMutation.isPending ? (
							<Loader2Icon className='size-4 animate-spin' />
						) : (
							<>
								<CheckIcon className='size-4' />
								<span>{t('friends.requests.accept') || 'Accept'}</span>
							</>
						)}
					</Button>
					<Button
						type='button'
						size='sm'
						variant='outline'
						disabled={acceptRequestMutation.isPending || rejectRequestMutation.isPending}
						onClick={() => rejectRequestMutation.mutate(receivedReq._id)}
						className='rounded-xl gap-1.5 font-medium text-destructive hover:bg-destructive/10 border-destructive/20'
					>
						{rejectRequestMutation.isPending ? (
							<Loader2Icon className='size-4 animate-spin' />
						) : (
							<>
								<XIcon className='size-4' />
								<span>{t('friends.requests.reject') || 'Reject'}</span>
							</>
						)}
					</Button>
				</>
			) : sentReq ? (
				<Button
					type='button'
					size='sm'
					variant='outline'
					disabled={cancelRequestMutation.isPending}
					onClick={() => cancelRequestMutation.mutate(sentReq._id)}
					className='rounded-xl gap-1.5 font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-border/30'
				>
					{cancelRequestMutation.isPending ? (
						<Loader2Icon className='size-4 animate-spin' />
					) : (
						<>
							<UserXIcon className='size-4' />
							<span>{t('friends.requests.cancel') || 'Cancel Request'}</span>
						</>
					)}
				</Button>
			) : (
				<Button
					type='button'
					size='sm'
					variant='default'
					disabled={sendRequestMutation.isPending}
					onClick={() => sendRequestMutation.mutate(targetUserId)}
					className='rounded-xl gap-1.5 font-medium text-white'
				>
					{sendRequestMutation.isPending ? (
						<Loader2Icon className='size-4 animate-spin' />
					) : (
						<>
							<UserPlusIcon className='size-4' />
							<span>{t('profile.actions.addFriend') || 'Add Friend'}</span>
						</>
					)}
				</Button>
			)}

			<Button
				type='button'
				variant='ghost'
				size='icon'
				disabled={isBlocking}
				onClick={() => blockUser()}
				className='size-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10'
				title={isBlocked ? t('profile.blockedUsers.unblock') : t('profile.blockedUsers.block')}
			>
				<BanIcon className='size-4' />
			</Button>
		</div>
	);
}
