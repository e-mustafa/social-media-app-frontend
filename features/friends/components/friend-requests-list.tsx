'use client';

import { Skeleton } from '@/shared/components/ui/skeleton';
import { UserCheckIcon, SendIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useReceivedFriendRequests, useSentFriendRequests } from '../hooks/use-friends';
import FriendRequestCard from './friend-request-card';
import { IFriend } from '../types';

interface FriendRequestsListProps {
	activeTab?: 'received' | 'sent';
}

export default function FriendRequestsList({ activeTab = 'received' }: FriendRequestsListProps) {
	const t = useTranslations();

	const { data: receivedData, isLoading: isLoadingReceived } = useReceivedFriendRequests();
	const { data: sentData, isLoading: isLoadingSent } = useSentFriendRequests();

	const isReceived = activeTab === 'received';
	const pages = isReceived ? receivedData?.pages : sentData?.pages;
	const list = pages?.flatMap((page) => page.data).filter((r): r is IFriend => r !== undefined) || [];
	const isLoading = isReceived ? isLoadingReceived : isLoadingSent;

	const emptyIcon = isReceived ? (
		<UserCheckIcon className='w-10 h-10 text-muted-foreground mx-auto opacity-50' />
	) : (
		<SendIcon className='w-10 h-10 text-muted-foreground mx-auto opacity-50' />
	);
	const emptyText = isReceived
		? t('friends.requests.emptyReceived') || 'No incoming friend requests'
		: t('friends.requests.emptySent') || 'No pending sent friend requests';
	const cardType = isReceived ? 'received' : 'sent';

	return (
		<div className='w-full space-y-4'>
			{isLoading ? (
				Array.from({ length: 3 }).map((_, i) => (
					<div
						key={i}
						className='p-4 rounded-xl border border-border/20 bg-card-blur flex items-center justify-between gap-4'
					>
						<div className='flex items-center gap-3'>
							<Skeleton className='w-12 h-12 rounded-full' />
							<div className='space-y-2'>
								<Skeleton className='h-4 w-32' />
								<Skeleton className='h-3 w-20' />
							</div>
						</div>
						<div className='flex gap-2'>
							<Skeleton className='h-9 w-20 rounded-md' />
							<Skeleton className='h-9 w-20 rounded-md' />
						</div>
					</div>
				))
			) : list.length > 0 ? (
				list.map((req) => <FriendRequestCard key={req._id} request={req} type={cardType} />)
			) : (
				<div className='text-center py-12 px-4 rounded-xl border border-border/10 bg-card-blur/50 space-y-3'>
					{emptyIcon}
					<p className='text-sm text-muted-foreground font-medium'>{emptyText}</p>
				</div>
			)}
		</div>
	);
}
