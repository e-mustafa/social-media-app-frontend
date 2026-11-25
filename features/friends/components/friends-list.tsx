'use client';

import { useState } from 'react';
import { Input } from '@/shared/components/ui/input';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { UsersIcon, SearchIcon, Loader2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMyFriends } from '../hooks/use-friends';
import FriendItem from './friend-item';
import { FriendUser, IFriend } from '../types';
import { Button } from '@/shared/components/ui/button';

interface FriendsListProps {
	currentUserId?: string;
}

export default function FriendsList({ currentUserId }: FriendsListProps) {
	const t = useTranslations();
	const [searchQuery, setSearchQuery] = useState('');
	const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useMyFriends({
		limit: 10,
		order: 'desc',
	});

	const allFriends = data?.pages.flatMap((page) => page.data).filter((f): f is IFriend => f !== undefined) || [];

	const filteredFriends = allFriends.filter((friend) => {
		const target = (
			typeof friend.sendBy === 'object' && friend.sendBy._id === currentUserId ? friend.sendTo : friend.sendBy
		) as FriendUser;

		if (!target || typeof target !== 'object') return false;
		const name = `${target.firstName || ''} ${target.lastName || ''} ${target.username || ''}`.toLowerCase();
		return name.includes(searchQuery.toLowerCase());
	});

	return (
		<div className='w-full space-y-4'>
			<div className='relative'>
				<SearchIcon className='absolute z-10 start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rtl:start-auto rtl:end-3' />
				<Input
					type='text'
					placeholder={t('friends.list.searchPlaceholder') || 'Search friends...'}
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className='pe-3 ps-9 bg-card-blur border-border/20 rounded-xl rtl:ps-3 rtl:pe-9'
				/>
			</div>

			{isLoading ? (
				<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
					{Array.from({ length: 6 }).map((_, i) => (
						<div key={i} className='p-4 rounded-xl border border-border/20 bg-card-blur flex items-center gap-4'>
							<Skeleton className='w-12 h-12 rounded-full' />
							<div className='space-y-2'>
								<Skeleton className='h-4 w-32' />
								<Skeleton className='h-3 w-20' />
							</div>
							<Skeleton className='h-8 w-8 rounded-md' />
						</div>
					))}
				</div>
			) : filteredFriends.length > 0 ? (
				<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
					{filteredFriends.map((friend) => (
						<FriendItem key={friend._id} friend={friend} currentUserId={currentUserId} />
					))}
				</div>
			) : (
				<div className='text-center py-12 px-4 rounded-xl border border-border/10 bg-card-blur/50 space-y-3'>
					<UsersIcon className='w-10 h-10 text-muted-foreground mx-auto opacity-50' />
					<p className='text-sm text-muted-foreground font-medium'>
						{searchQuery
							? t('friends.list.noSearchResults') || 'No friends match your search query'
							: t('friends.list.empty') || 'You have no friends added yet'}
					</p>
				</div>
			)}

			{!isLoading && hasNextPage && (
				<div className='flex justify-center py-2'>
					<Button
						type='button'
						variant='outline'
						onClick={() => fetchNextPage()}
						className='rounded-xl bg-card-blur'
						disabled={isFetchingNextPage}
					>
						{isFetchingNextPage ? (
							<Loader2Icon className='size-5 mr-2 rtl:mr-0 rtl:ml-2 animate-spin' />
						) : (
							<></>
						)}
						{t('posts.loadMore') || 'Load More'}
					</Button>
				</div>
			)}
		</div>
	);
}
