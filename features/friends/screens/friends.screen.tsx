'use client';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { useSocketStore } from '@/features/chat/store/useSocketStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { defaultImages } from '@/shared/config/app-configs';
import { cn } from '@/shared/utils/utils';
import { MessageSquareIcon, MoreVerticalIcon, SendIcon, UsersIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useState } from 'react';
import FriendRequestsList from '../components/friend-requests-list';
import FriendsList from '../components/friends-list';

interface FriendsScreenProps {
	currentUserId?: string;
}

export default function FriendsScreen({ currentUserId }: FriendsScreenProps) {
	const t = useTranslations();
	const { user } = useAuth();
	const { isConnected } = useSocketStore();
	const [activeTab, setActiveTab] = useState<'all' | 'requests'>('all');

	const avatarUrl =
		(user?.avatar && user?.avatar.url) || (user?.gender === 1 ? defaultImages.avatarFemale : defaultImages.avatarMale);

	return (
		<div className='w-full animate-in slide-in-from-top-5'>
			{/* Header Section with Cover Image */}
			<div className='relative h-48 w-full rounded-2xl bg-card-glass border border-border/20 overflow-hidden group'>
				<Image
					src={user?.covers?.[0]?.url || defaultImages.cover}
					alt='Cover Photo'
					className='absolute inset-0 w-full h-full object-cover'
					width={1200}
					height={800}
					priority
				/>
				<div className='absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent' />

				<div className='mt-auto h-full items-end relative z-10 flex gap-4 pb-4 ps-4'>
					<div className='relative shrink-0'>
						<Avatar className='size-20 ring-2 border-white bg-card-glass shadow-lg'>
							<AvatarImage src={avatarUrl} alt={user?.firstName || ''} />
							<AvatarFallback>
								{user?.firstName?.charAt(0) || ''}
								{user?.lastName?.charAt(0) || ''}
							</AvatarFallback>
						</Avatar>
						<span
							className={cn(
								'absolute bottom-0 end-0 size-2 rounded-full border-2 border-background',
								isConnected ? 'bg-emerald-500' : 'bg-muted-foreground/40',
							)}
						/>
					</div>
					<div className='min-w-0 flex flex-col'>
						<span className='text-sm font-semibold text-foreground truncate'>
							{user?.firstName} {user?.lastName}
						</span>
						<span className='text-xs text-muted-foreground truncate'>@{user?.username}</span>
						{user?.bio && <p className='text-xs text-muted-foreground mt-1 truncate'>{user.bio}</p>}
					</div>
					<div className='ml-auto flex items-center gap-2 sm:gap-3'>
						<Button size='sm' variant='outline' className='hidden sm:flex items-center gap-2'>
							<MessageSquareIcon className='w-4 h-4' />
							<span>{t('messages.title') || 'Message'}</span>
						</Button>
						<Button size='sm' variant='ghost' className='text-muted-foreground hover:bg-muted/50'>
							<MoreVerticalIcon className='w-4 h-4' />
						</Button>
					</div>
				</div>
			</div>

			{/* Tabs */}
			<Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'all' | 'requests')} className='w-full mt-6'>
				<TabsList className='grid w-full grid-cols-2 bg-card-blur border border-border/20 p-1 rounded-xl min-h-14'>
					<TabsTrigger
						value='all'
						className='flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors data-[state=active]:bg-primary data-[state=active]:text-brand-primary'
					>
						<UsersIcon className='w-4 h-4' />
						<span>{t('friends.tabs.all') || 'My Friends'}</span>
					</TabsTrigger>
					<TabsTrigger
						value='requests'
						className='flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors data-[state=active]:bg-primary data-[state=active]:text-brand-primary'
					>
						<SendIcon className='w-4 h-4' />
						<span>{t('friends.requests.title') || 'Friend Requests'}</span>
					</TabsTrigger>
				</TabsList>

				<TabsContent value='all' className='mt-4'>
					<FriendsList currentUserId={currentUserId} />
				</TabsContent>
				<TabsContent value='requests' className='mt-4'>
					<FriendRequestsList />
				</TabsContent>
			</Tabs>
		</div>
	);
}
