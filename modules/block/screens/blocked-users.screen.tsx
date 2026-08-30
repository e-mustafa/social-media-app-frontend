'use client';

import { useState } from 'react';
import { Input } from '@/shared/components/ui/input';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { ShieldAlertIcon, SearchIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useBlockedUsers } from '../hooks/use-block';
import BlockedUserItem from '../components/blocked-user-item';

export default function BlockedUsersScreen() {
	const t = useTranslations();
	const [searchQuery, setSearchQuery] = useState('');

	const { data, isLoading } = useBlockedUsers({ search: searchQuery });
	const blockedList = data?.data || [];

	return (
		<div className='w-full max-w-4xl mx-auto px-4 py-6 space-y-6'>
			<div className='bg-card-blur border border-border/20 rounded-2xl p-6 shadow-sm space-y-4'>
				<div>
					<h1 className='text-2xl font-bold text-foreground flex items-center gap-2'>
						<ShieldAlertIcon className='w-6 h-6 text-destructive' />
						{t('block.title') || 'Blocked Users'}
					</h1>
					<p className='text-sm text-muted-foreground mt-1'>
						{t('block.description') || 'Manage users you have blocked from contacting or viewing your profile'}
					</p>
				</div>

				<div className='relative'>
					<SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rtl:left-auto rtl:right-3' />
					<Input
						type='text'
						placeholder={t('block.searchPlaceholder') || 'Search blocked users...'}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className='pl-9 rtl:pl-3 rtl:pr-9 bg-bg-main/50 border-border/20 rounded-xl'
					/>
				</div>
			</div>

			<div className='space-y-3'>
				{isLoading ? (
					Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className='p-4 rounded-xl border border-border/20 bg-card-blur flex items-center justify-between gap-4'>
							<div className='flex items-center gap-3'>
								<Skeleton className='w-12 h-12 rounded-full' />
								<div className='space-y-2'>
									<Skeleton className='h-4 w-32' />
									<Skeleton className='h-3 w-20' />
								</div>
							</div>
							<Skeleton className='h-9 w-24 rounded-md' />
						</div>
					))
				) : blockedList.length > 0 ? (
					blockedList.map((record) => <BlockedUserItem key={record._id} blockRecord={record} />)
				) : (
					<div className='text-center py-16 px-4 rounded-2xl border border-border/10 bg-card-blur/50 space-y-3'>
						<ShieldAlertIcon className='w-12 h-12 text-muted-foreground mx-auto opacity-40' />
						<p className='text-sm text-muted-foreground font-medium'>
							{searchQuery
								? t('block.noSearchResults') || 'No blocked users match your search'
								: t('block.empty') || 'No blocked users found'}
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
