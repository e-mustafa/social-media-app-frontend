'use client';

import { useBlockUser } from '@/features/block/hooks/use-block';
import { useUnfriendFriendRequest } from '@/features/friends/hooks/use-friends';
import { Link } from '@/i18n/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/shared/components/ui/dialog';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { APP_ROUTES, defaultImages } from '@/shared/config/app-configs';
import { Loader2Icon, MessageSquareIcon, MoreHorizontalIcon, UserIcon, UserXIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useState } from 'react';
import { FriendUser, IFriend } from '../types';

interface FriendItemProps {
	friend: IFriend;
	currentUserId?: string;
}

export default function FriendItem({ friend, currentUserId }: FriendItemProps) {
	const t = useTranslations();
	const blockMutation = useBlockUser();
	const unfriendMutation = useUnfriendFriendRequest();

	const friendUser = (
		typeof friend.sendBy === 'object' && friend.sendBy._id === currentUserId ? friend.sendTo : friend.sendBy
	) as FriendUser;

	const fullName = friendUser
		? friendUser.username || `${friendUser.firstName || ''} ${friendUser.lastName || ''}`.trim() || 'User'
		: 'User';
	const avatarUrl = friendUser?.avatar?.url || defaultImages.avatarMale;
	const initials = `${friendUser?.firstName?.[0] || ''}${friendUser?.lastName?.[0] || ''}`.toUpperCase() || 'F';
	const targetUserId = friendUser?._id;

	const [unfriendDialogOpen, setUnfriendDialogOpen] = useState(false);
	const [unfriendTargetId, setUnfriendTargetId] = useState<string | null>(null);
	const [blockDialogOpen, setBlockDialogOpen] = useState(false);
	const [blockTargetId, setBlockTargetId] = useState<string | null>(null);

	const handleUnfriendClick = (id: string) => {
		setUnfriendTargetId(id);
		setUnfriendDialogOpen(true);
	};

	const confirmUnfriend = () => {
		if (!unfriendTargetId) return;
		unfriendMutation.mutate(unfriendTargetId, {
			onSettled: () => {
				setUnfriendDialogOpen(false);
				setUnfriendTargetId(null);
			},
		});
	};

	const handleBlockClick = (id: string) => {
		setBlockTargetId(id);
		setBlockDialogOpen(true);
	};

	const confirmBlock = () => {
		if (!blockTargetId) return;
		blockMutation.mutate(blockTargetId, {
			onSettled: () => {
				setBlockDialogOpen(false);
				setBlockTargetId(null);
			},
		});
	};

	return (
		<>
			<Card className='p-1 bg-card-blur border border-border/20 shadow-sm transition-all hover:shadow-md rounded-xl overflow-hidden group'>
				{/* Cover placeholder (subtle gradient when no cover image) */}
				<div className='h-16 bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 rounded-md border-b border-border/20 relative overflow-hidden'>
					<Image
						src={friendUser?.covers?.[0]?.url || defaultImages.cover}
						alt='Cover Photo'
						className='absolute inset-0 w-full h-full object-cover'
						width={1200}
						height={800}
						priority
					/>
				</div>

				<div className='p-3'>
					<div className='flex items-center gap-3 min-w-0'>
						<div className='relative shrink-0'>
							<Avatar className='size-12 rounded-full border-2 border-white bg-background shadow-lg -mt-6'>
								<AvatarImage src={avatarUrl} alt={fullName} />
								<AvatarFallback className='bg-primary/10 text-primary font-medium'>{initials}</AvatarFallback>
							</Avatar>
							{/* Online status indicator */}
							<span className='absolute bottom-0 right-0 size-3 rounded-full border-2 border-background bg-emerald-500' />
						</div>
						<div className='min-w-0 flex-1'>
							{friendUser?.username ? (
								<Link
									href={`/u/${friendUser.username}`}
									className='font-semibold text-foreground hover:underline truncate block'
								>
									{fullName}
								</Link>
							) : (
								<span className='font-semibold text-foreground truncate block'>{fullName}</span>
							)}
							{friendUser?.username && (
								<p className='text-xs text-muted-foreground truncate'>@{friendUser.username}</p>
							)}
						</div>

						<div className='flex items-center gap-2 shrink-0'>
							{friendUser?.username && (
								<Button asChild size='sm' variant='outline' className='hidden sm:flex items-center gap-1.5'>
									<Link href={`/u/${friendUser.username}`}>
										<UserIcon className='w-4 h-4' />
										{t('friends.item.viewProfile') || 'View Profile'}
									</Link>
								</Button>
							)}

							<Button
								asChild
								size='sm'
								variant='ghost'
								className='h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50'
							>
								<Link href={APP_ROUTES.chat}>
									<MessageSquareIcon className='w-4 h-4' />
									<span className='sr-only'>{t('friends.item.message') || 'Message'}</span>
								</Link>
							</Button>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant='ghost'
										size='icon'
										className='h-8 w-8 text-muted-foreground hover:text-foreground'
									>
										<MoreHorizontalIcon className='w-4 h-4' />
										<span className='sr-only'>{t('friends.item.options') || 'Options'}</span>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align='end' className='w-48 bg-card-glass backdrop-blur-lg'>
									{friendUser?.username && (
										<DropdownMenuItem asChild>
											<Link href={`/u/${friendUser.username}`} className='flex items-center gap-2 cursor-pointer'>
												<UserIcon className='w-4 h-4' />
												{t('friends.item.viewProfile') || 'View Profile'}
											</Link>
										</DropdownMenuItem>
									)}
									{targetUserId && (
										<DropdownMenuItem
											className='text-destructive focus:text-destructive flex items-center gap-2 cursor-pointer'
											disabled={blockMutation.isPending || unfriendMutation.isPending}
											onClick={() => handleBlockClick(targetUserId)}
										>
											<UserXIcon className='w-4 h-4' />
											{t('friends.item.block') || 'Block User'}
										</DropdownMenuItem>
									)}
									{targetUserId && (
										<DropdownMenuItem
											className='flex items-center gap-2 cursor-pointer'
											disabled={blockMutation.isPending || unfriendMutation.isPending}
											onClick={() => handleUnfriendClick(targetUserId)}
										>
											<UserXIcon className='w-4 h-4' />
											{t('friends.item.unfriend') || 'Unfriend'}
										</DropdownMenuItem>
									)}
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>
				</div>
			</Card>

			{/* Unfriend Confirmation Dialog */}
			<Dialog open={unfriendDialogOpen} onOpenChange={setUnfriendDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t('friends.item.unfriendConfirmTitle') || 'Remove Friend?'}</DialogTitle>
						<DialogDescription>
							{t('friends.item.unfriendConfirmDescription') ||
								'Are you sure you want to remove this person from your friends list?'}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							type='button'
							variant='outline'
							onClick={() => setUnfriendDialogOpen(false)}
							className='w-full sm:w-auto'
						>
							{t('common.cancel') || 'Cancel'}
						</Button>
						<Button
							type='button'
							onClick={confirmUnfriend}
							disabled={unfriendMutation.isPending}
							variant='destructive'
							className='w-full sm:w-auto'
						>
							{unfriendMutation.isPending ? (
								<span className='flex items-center gap-2'>
									<Loader2Icon className='animate-spin -ml-1 mr-2 h-4 w-4 rtl:-mr-1 rtl:ml-2' />
									{t('friends.item.unfriendConfirmRemove') || 'Remove Friend'}
								</span>
							) : (
								<>
									<UserXIcon className='w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2' />
									{t('friends.item.unfriendConfirmRemove') || 'Remove Friend'}
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			{/* Block Confirmation Dialog */}
			<Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t('friends.item.blockConfirmTitle') || 'Block User?'}</DialogTitle>
						<DialogDescription>
							{t('friends.item.blockConfirmDescription') ||
								'Are you sure you want to block this user? Blocking will prevent them from interacting with you and viewing your content.'}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							type='button'
							variant='outline'
							onClick={() => setBlockDialogOpen(false)}
							className='w-full sm:w-auto'
						>
							{t('common.cancel') || 'Cancel'}
						</Button>
						<Button
							type='button'
							onClick={confirmBlock}
							disabled={blockMutation.isPending}
							variant='destructive'
							className='w-full sm:w-auto text-destructive focus:text-destructive'
						>
							{blockMutation.isPending ? (
								<span className='flex items-center gap-2'>
									<Loader2Icon className='animate-spin -ml-1 mr-2 h-4 w-4 rtl:-mr-1 rtl:ml-2' />
									{t('friends.item.blockConfirmBlock') || 'Block User'}
								</span>
							) : (
								<>
									<UserXIcon className='w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2' />
									{t('friends.item.blockConfirmBlock') || 'Block User'}
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
