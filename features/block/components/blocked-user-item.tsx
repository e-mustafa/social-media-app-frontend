'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Loader2Icon, ShieldOffIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { IBlock, BlockedUser } from '../types';
import { useUnblockUser } from '../hooks/use-block';

interface BlockedUserItemProps {
	blockRecord: IBlock;
}

export default function BlockedUserItem({ blockRecord }: BlockedUserItemProps) {
	const t = useTranslations();
	const unblockMutation = useUnblockUser();

	const user = (typeof blockRecord.blocked === 'object' ? blockRecord.blocked : null) as BlockedUser | null;
	const userId = user?._id || user?.id || (typeof blockRecord.blocked === 'string' ? blockRecord.blocked : '');

	const fullName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'User' : 'User';
	const avatarUrl = user?.avatar?.url || '/images/default-avatar.png';
	const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'B';

	return (
		<Card className='p-3 bg-card-blur border border-border/20 shadow-sm flex items-center justify-between gap-3 rounded-xl'>
			<div className='flex items-center gap-3 min-w-0'>
				<Avatar className='w-10 h-10 border border-border/20 shrink-0'>
					<AvatarImage src={avatarUrl} alt={fullName} />
					<AvatarFallback className='bg-destructive/10 text-destructive font-medium'>{initials}</AvatarFallback>
				</Avatar>
				<div className='min-w-0 flex-1'>
					<p className='text-sm font-semibold text-foreground truncate'>{fullName}</p>
					{user?.username && <p className='text-xs text-muted-foreground truncate'>@{user.username}</p>}
				</div>
			</div>

			<Button
				type='button'
				variant='outline'
				size='sm'
				className='gap-1.5 text-destructive hover:bg-destructive/10 border-destructive/20 shrink-0 font-medium'
				disabled={unblockMutation.isPending || !userId}
				onClick={() => userId && unblockMutation.mutate(userId)}
			>
				{unblockMutation.isPending ? (
					<Loader2Icon className='w-4 h-4 animate-spin' />
				) : (
					<>
						<ShieldOffIcon className='w-4 h-4' />
						{t('block.unblock') || 'Unblock'}
					</>
				)}
			</Button>
		</Card>
	);
}
