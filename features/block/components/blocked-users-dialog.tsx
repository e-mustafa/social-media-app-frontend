'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { UserXIcon, SearchIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useBlockedUsers } from '../hooks/use-block';
import BlockedUserItem from './blocked-user-item';

interface BlockedUsersDialogProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function BlockedUsersDialog({ isOpen, onClose }: BlockedUsersDialogProps) {
	const t = useTranslations();
	const [searchQuery, setSearchQuery] = useState('');

	const { data, isLoading } = useBlockedUsers({ search: searchQuery });
	const blockedList = data?.data || [];

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className='sm:max-w-md bg-card-glass backdrop-blur-lg max-h-[80vh] flex flex-col rounded-2xl'>
				<DialogHeader>
					<DialogTitle className='flex items-center gap-2 text-foreground'>
						<UserXIcon className='w-5 h-5 text-destructive' />
						{t('block.dialogTitle') || 'Blocked Users'}
					</DialogTitle>
				</DialogHeader>

				<div className='relative mt-2'>
					<SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rtl:left-auto rtl:right-3' />
					<Input
						type='text'
						placeholder={t('block.searchPlaceholder') || 'Search blocked users...'}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className='pl-9 rtl:pl-3 rtl:pr-9 bg-bg-main/50 border-border/20 rounded-xl text-sm'
					/>
				</div>

				<div className='flex-1 overflow-y-auto space-y-3 py-4 pr-1 mt-2 min-h-[200px]'>
					{isLoading ? (
						Array.from({ length: 3 }).map((_, i) => (
							<div key={i} className='p-3 rounded-xl border border-border/20 bg-card-blur flex items-center justify-between gap-3'>
								<div className='flex items-center gap-3'>
									<Skeleton className='w-10 h-10 rounded-full' />
									<div className='space-y-1.5'>
										<Skeleton className='h-4 w-28' />
										<Skeleton className='h-3 w-16' />
									</div>
								</div>
								<Skeleton className='h-8 w-20 rounded-md' />
							</div>
						))
					) : blockedList.length > 0 ? (
						blockedList.map((record) => <BlockedUserItem key={record._id} blockRecord={record} />)
					) : (
						<div className='text-center py-10 px-4 rounded-xl border border-border/10 bg-bg-main/30 space-y-2'>
							<UserXIcon className='w-8 h-8 text-muted-foreground mx-auto opacity-40' />
							<p className='text-sm text-muted-foreground font-medium'>
								{searchQuery
									? t('block.noSearchResults') || 'No blocked users match your search'
									: t('block.empty') || 'No blocked users found'}
							</p>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
