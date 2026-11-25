'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { XIcon, SearchIcon, Loader2Icon, UserIcon, UsersIcon, CheckIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Separator } from '@/shared/components/ui/separator';
import { cn } from '@/shared/utils/utils';
import { useSearchFriends, getFlattenedUsers } from '../hooks/use-user-search';
import { useStartDirectChat } from '../hooks/use-chat-actions';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { APP_ROUTES } from '@/shared/config/app-configs';

interface NewConversationDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function NewConversationDialog({ open, onOpenChange }: NewConversationDialogProps) {
	const t = useTranslations();
	const router = useRouter();
	const { user } = useAuth();
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

	const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } = useSearchFriends({
		search: searchQuery,
		limit: 20,
	});
	const startChatMutation = useStartDirectChat();

	const friends = getFlattenedUsers(data?.pages);

	const filteredFriends = friends.filter((friend) => friend._id !== user?.id);

	const handleSelectUser = (userId: string) => {
		setSelectedUserId(userId);
	};

	const handleStartChat = (friendId: string) => {
		startChatMutation.mutate(friendId, {
			onSuccess: (res) => {
				onOpenChange(false);
				if (res.data?._id) {
					router.push(`${APP_ROUTES.chat}/${res.data._id}`);
				} else {
					// No existing chat, navigate to messages with recipientId as query param
					router.push(`${APP_ROUTES.chat}?recipientId=${friendId}`);
				}
			},
		});
	};

	const handleSearchChange = (value: string) => {
		setSearchQuery(value);
		setSelectedUserId(null);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='max-w-md max-h-[80vh] sm:max-w-lg' showCloseButton={false}>
				<DialogHeader>
					<DialogTitle className='flex items-center justify-between'>
						{t('chat.newConversation.title') || 'New Conversation'}
						<Button
							type='button'
							variant='ghost'
							size='icon'
							className='h-8 w-8'
							onClick={() => onOpenChange(false)}
							aria-label={t('common.close') || 'Close'}
						>
							<XIcon className='size-4' />
						</Button>
					</DialogTitle>
					<DialogDescription>
						{t('chat.newConversation.description') || 'Search for a friend to start a conversation'}
					</DialogDescription>
				</DialogHeader>

				<div className='space-y-4'>
					<div className='relative'>
						<SearchIcon className='absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
						<Input
							value={searchQuery}
							onChange={(e) => handleSearchChange(e.target.value)}
							placeholder={t('chat.newConversation.searchPlaceholder') || 'Search friends...'}
							className='ps-9'
							autoFocus
						/>
					</div>

					<Separator />

					<ScrollArea className='max-h-[50vh]'>
						{isLoading && filteredFriends.length === 0 ? (
							<div className='flex items-center justify-center py-8'>
								<Loader2Icon className='size-6 animate-spin text-brand-primary' />
							</div>
						) : filteredFriends.length > 0 ? (
							<div className='space-y-1'>
								{filteredFriends.map((friend) => (
									<button
										key={friend._id}
										type='button'
										onClick={() => handleSelectUser(friend._id)}
										className={cn(
											'flex w-full items-center gap-3 p-3 rounded-xl transition-colors',
											'hover:bg-muted/50',
											selectedUserId === friend._id && 'bg-brand-primary/10'
										)}
									>
										<Avatar className='size-10'>
											<AvatarImage src={friend.avatar?.url} alt={friend.firstName} />
											<AvatarFallback>
												{friend.firstName?.[0]}{friend.lastName?.[0]}
											</AvatarFallback>
										</Avatar>
										<div className='min-w-0 flex-1'>
											<p className='truncate font-medium text-foreground'>
												{friend.firstName} {friend.lastName}
											</p>
											{friend.username && (
												<p className='truncate text-xs text-muted-foreground'>@{friend.username}</p>
											)}
										</div>
										{selectedUserId === friend._id && (
											<CheckIcon className='size-5 text-brand-primary shrink-0' />
										)}
									</button>
								))}
							</div>
						) : searchQuery ? (
							<div className='flex flex-col items-center justify-center py-12 px-4 text-center'>
								<UserIcon className='size-10 text-muted-foreground/50 mb-2' />
								<p className='text-sm text-muted-foreground'>
									{t('chat.newConversation.noResults') || 'No friends found matching your search'}
								</p>
							</div>
						) : (
							<div className='flex flex-col items-center justify-center py-12 px-4 text-center'>
								<UsersIcon className='size-10 text-muted-foreground/50 mb-2' />
								<p className='text-sm text-muted-foreground'>
									{t('chat.newConversation.startSearch') || 'Start typing to search for friends'}
								</p>
							</div>
						)}

						{!isLoading && hasNextPage && (
							<div className='flex justify-center py-2'>
								<Button
									type='button'
									variant='outline'
									size='sm'
									onClick={() => fetchNextPage()}
									disabled={isFetchingNextPage}
									className='rounded-xl'
								>
									{isFetchingNextPage ? (
										<Loader2Icon className='size-4 mr-2 animate-spin' />
									) : null}
									{t('common.loadMore') || 'Load more'}
								</Button>
							</div>
						)}
					</ScrollArea>

					{selectedUserId && (
						<div className='border-t pt-4'>
							<Button
								className='w-full'
								onClick={() => handleStartChat(selectedUserId)}
								disabled={startChatMutation.isPending}
							>
								{startChatMutation.isPending ? (
									<Loader2Icon className='size-4 mr-2 animate-spin' />
								) : (
									<>
										<MessageSquareIcon className='size-4 mr-2' />
									</>
								)}
								{startChatMutation.isPending
									? t('chat.newConversation.starting') || 'Starting...'
									: t('chat.newConversation.startChat') || 'Start Chat'}
							</Button>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

function MessageSquareIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
			<path strokeLinecap='round' strokeLinejoin='round' d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' />
		</svg>
	);
}