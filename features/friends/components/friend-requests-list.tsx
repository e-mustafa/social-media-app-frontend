'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { UserCheckIcon, SendIcon, InboxIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useReceivedFriendRequests, useSentFriendRequests } from '../hooks/use-friends';
import FriendRequestCard from './friend-request-card';

export default function FriendRequestsList() {
	const t = useTranslations();
	const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

	const { data: receivedData, isLoading: isLoadingReceived } = useReceivedFriendRequests();
	const { data: sentData, isLoading: isLoadingSent } = useSentFriendRequests();

	const receivedList = receivedData?.data || [];
	const sentList = sentData?.data || [];

	return (
		<div className='w-full space-y-4'>
			<Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'received' | 'sent')} className='w-full'>
				<TabsList className='grid w-full grid-cols-2 bg-card-blur border border-border/20 p-1 rounded-xl min-h-14'>
					<TabsTrigger
						value='received'
						className='gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground min-h-12'
					>
						<InboxIcon className='w-4 h-4' />
						<span>{t('friends.requests.received') || 'Received Requests'}</span>
						{receivedList.length > 0 && (
							<span className='ms-1 px-1.5 py-0.5 text-xs rounded-full bg-primary-foreground/20 font-bold'>
								{receivedList.length}
							</span>
						)}
					</TabsTrigger>
					<TabsTrigger
						value='sent'
						className='gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground min-h-12'
					>
						<SendIcon className='w-4 h-4' />
						<span>{t('friends.requests.sent') || 'Sent Requests'}</span>
						{sentList.length > 0 && (
							<span className='ms-1 px-1.5 py-0.5 text-xs rounded-full bg-primary-foreground/20 font-bold'>
								{sentList.length}
							</span>
						)}
					</TabsTrigger>
				</TabsList>

				<TabsContent value='received' className='space-y-3 mt-4'>
					{isLoadingReceived ? (
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
					) : receivedList.length > 0 ? (
						receivedList.map((req) => <FriendRequestCard key={req._id} request={req} type='received' />)
					) : (
						<div className='text-center py-12 px-4 rounded-xl border border-border/10 bg-card-blur/50 space-y-3'>
							<UserCheckIcon className='w-10 h-10 text-muted-foreground mx-auto opacity-50' />
							<p className='text-sm text-muted-foreground font-medium'>
								{t('friends.requests.emptyReceived') || 'No incoming friend requests'}
							</p>
						</div>
					)}
				</TabsContent>

				<TabsContent value='sent' className='space-y-3 mt-4'>
					{isLoadingSent ? (
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
								<Skeleton className='h-9 w-28 rounded-md' />
							</div>
						))
					) : sentList.length > 0 ? (
						sentList.map((req) => <FriendRequestCard key={req._id} request={req} type='sent' />)
					) : (
						<div className='text-center py-12 px-4 rounded-xl border border-border/10 bg-card-blur/50 space-y-3'>
							<SendIcon className='w-10 h-10 text-muted-foreground mx-auto opacity-50' />
							<p className='text-sm text-muted-foreground font-medium'>
								{t('friends.requests.emptySent') || 'No pending sent friend requests'}
							</p>
						</div>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}
