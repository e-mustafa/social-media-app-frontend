'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { UserPlusIcon, UsersIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import FriendRequestsList from '../components/friend-requests-list';
import FriendsList from '../components/friends-list';

interface FriendsScreenProps {
	currentUserId?: string;
}

export default function FriendsScreen({ currentUserId }: FriendsScreenProps) {
	const t = useTranslations();
	const [activeTab, setActiveTab] = useState<'all' | 'requests'>('all');

	return (
		<div className='w-full max-w-4xl mx-auto px-4 py-6 space-y-6'>
			<div className='bg-card-blur border border-border/20 rounded-2xl p-6 shadow-sm'>
				<h1 className='text-2xl font-bold text-foreground'>{t('friends.title') || 'Friends'}</h1>
				<p className='text-sm text-muted-foreground mt-1'>
					{t('friends.description') || 'Manage your friends list and incoming or outgoing friend requests'}
				</p>
			</div>

			<Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'all' | 'requests')} className='w-full'>
				<TabsList className='grid w-full grid-cols-2 bg-card-blur border border-border/20 p-1 rounded-xl min-h-14'>
					<TabsTrigger
						value='all'
						className='gap-2 rounded-lg font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground min-h-12'
					>
						<UsersIcon className='w-4 h-4' />
						<span>{t('friends.tabs.all') || 'My Friends'}</span>
					</TabsTrigger>
					<TabsTrigger
						value='requests'
						className='gap-2 rounded-lg font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground min-h-12'
					>
						<UserPlusIcon className='w-4 h-4' />
						<span>{t('friends.requests.received') || 'Requests'}</span>
					</TabsTrigger>
				</TabsList>

				<div className='mt-6'>
					<TabsContent value='all' className='m-0'>
						<FriendsList currentUserId={currentUserId} />
					</TabsContent>
					<TabsContent value='requests' className='m-0'>
						<FriendRequestsList />
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
}
