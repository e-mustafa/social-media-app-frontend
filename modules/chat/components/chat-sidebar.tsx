'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { cn } from '@/shared/utils/utils';
import { FilterIcon, PlusIcon, SearchIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { ChatItem } from '../types';

interface ChatSidebarProps {
	chats: ChatItem[];
	activeChatId?: string;
	onSelectChat: (id: string) => void;
}

export function ChatSidebar({ chats, activeChatId, onSelectChat }: ChatSidebarProps) {
	const t = useTranslations();
	const [filter, setFilter] = useState<'all' | 'unread'>('all');
	const [searchQuery, setSearchQuery] = useState('');

	const filteredChats = useMemo(() => {
		return chats.filter((chat) => {
			const matchesSearch = `${chat.name} ${chat.username || ''}`.toLowerCase().includes(searchQuery.toLowerCase());
			if (filter === 'unread') return matchesSearch && (chat.unreadCount ?? 0) > 0;
			return matchesSearch;
		});
	}, [chats, filter, searchQuery]);

	return (
		<aside className='flex h-full w-full flex-col overflow-hidden border-e border-border/30 bg-card-blur md:w-[360px] md:shrink-0'>
			<div className='flex min-h-18 items-center justify-between border-b border-border/30 p-4'>
				<div>
					<h1 className='text-xl font-bold text-foreground'>{t('chat.sidebar.title')}</h1>
					<p className='text-xs text-muted-foreground'>{t('chat.connection.secure')}</p>
				</div>
				<div className='flex items-center gap-1'>
					<Button
						type='button'
						variant='ghost'
						size='icon'
						className='size-9 rounded-xl'
						aria-label={t('chat.sidebar.newChat')}
					>
						<PlusIcon className='size-4' />
					</Button>
					<Button
						type='button'
						variant='ghost'
						size='icon'
						className='size-9 rounded-xl'
						aria-label={t('chat.sidebar.filter')}
					>
						<FilterIcon className='size-4' />
					</Button>
				</div>
			</div>

			<div className='space-y-3 border-b border-border/30 p-3'>
				<div className='relative'>
					<SearchIcon className='pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
					<Input
						value={searchQuery}
						onChange={(event) => setSearchQuery(event.target.value)}
						placeholder={t('chat.sidebar.search')}
						className='h-10 rounded-xl border-border/30 bg-background/50 ps-9'
					/>
				</div>
				<div className='flex gap-2'>
					<Button
						type='button'
						size='sm'
						variant={filter === 'all' ? 'default' : 'secondary'}
						className='h-8 rounded-full'
						onClick={() => setFilter('all')}
					>
						{t('chat.sidebar.all')}
					</Button>
					<Button
						type='button'
						size='sm'
						variant={filter === 'unread' ? 'default' : 'secondary'}
						className='h-8 rounded-full'
						onClick={() => setFilter('unread')}
					>
						{t('chat.sidebar.unread')}
					</Button>
				</div>
			</div>

			<ScrollArea className='min-h-0 flex-1'>
				<div className='divide-y divide-border/20'>
					{filteredChats.map((chat) => {
						const isActive = chat.id === activeChatId;
						return (
							<button
								key={chat._id}
								type='button'
								onClick={() => onSelectChat(chat.id)}
								className={cn(
									'flex w-full items-center gap-3 p-3 text-start transition-colors hover:bg-muted/50',
									isActive && 'bg-brand-primary/10',
								)}
							>
								<div className='relative shrink-0'>
									<Avatar className='size-12 border border-border/40'>
										<AvatarImage src={chat.participants[0].avatar?.url} alt={chat.name} />
										<AvatarFallback>{chat.participants[0].name.slice(0, 2).toUpperCase()}</AvatarFallback>
									</Avatar>
									<span
										className={cn(
											'absolute bottom-0 end-0 size-3 rounded-full border-2 border-background',
											chat.isOnline ? 'bg-emerald-500' : 'bg-muted-foreground/40',
										)}
									/>
								</div>

								<div className='min-w-0 flex-1'>
									<div className='mb-1 flex items-center justify-between gap-3'>
										<h2 className='truncate text-sm font-semibold text-foreground'>
											{chat.isGroup ? chat.groupName : chat.participants[0].name}
										</h2>
										<span className='shrink-0 text-[11px] text-muted-foreground'>{chat.participants[0].time}</span>
									</div>
									<div className='flex items-center justify-between gap-3'>
										<p className='truncate text-xs text-muted-foreground'>
											{chat.isTyping
												? t('chat.status.typing')
												: chat.isRecording
													? t('chat.status.recording')
													: chat.lastMessage}
										</p>
										{chat.unreadCount && chat.unreadCount > 0 ? (
											<Badge className='flex size-5 shrink-0 items-center justify-center rounded-full p-0 text-[10px] font-bold'>
												{chat.unreadCount}
											</Badge>
										) : null}
									</div>
								</div>
							</button>
						);
					})}
				</div>
			</ScrollArea>
		</aside>
	);
}
