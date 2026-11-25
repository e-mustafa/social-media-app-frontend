'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { cn } from '@/shared/utils/utils';
import { format } from 'date-fns';
import { FilterIcon, PlusIcon, SearchIcon, UsersIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { IChat } from '../types/chat.types';
import { CreateGroupDialog } from './create-group-dialog';
import { NewConversationDialog } from './new-conversation-dialog';
import { useChatDialogStore } from '../store/useChatDialogStore';

interface ChatSidebarProps {
	chats: IChat[];
	activeChatId?: string | null;
	onSelectChat: (id: string) => void;
	isConnected?: boolean;
}

// External store for window focus state
function createWindowFocusStore() {
	let focused = typeof document !== 'undefined' ? document.hasFocus() : true;
	const listeners = new Set<() => void>();

	if (typeof window !== 'undefined') {
		const handleFocus = () => {
			focused = true;
			listeners.forEach((l) => l());
		};
		const handleBlur = () => {
			focused = false;
			listeners.forEach((l) => l());
		};
		window.addEventListener('focus', handleFocus);
		window.addEventListener('blur', handleBlur);
	}

	return {
		subscribe: (callback: () => void) => {
			listeners.add(callback);
			return () => listeners.delete(callback);
		},
		getSnapshot: () => focused,
		getServerSnapshot: () => true,
	};
}

const windowFocusStore = typeof window !== 'undefined' ? createWindowFocusStore() : {
	subscribe: () => () => {},
	getSnapshot: () => true,
	getServerSnapshot: () => true,
};

function useWindowFocus() {
	return useSyncExternalStore(
		windowFocusStore.subscribe,
		windowFocusStore.getSnapshot,
		windowFocusStore.getServerSnapshot,
	);
}

export function ChatSidebar({ chats, activeChatId, onSelectChat, isConnected }: ChatSidebarProps) {
	const t = useTranslations();
	const [filter, setFilter] = useState<'all' | 'unread'>('all');
	const [searchQuery, setSearchQuery] = useState('');

	// Dialog states from shared store
	const { isNewConversationOpen, isCreateGroupOpen, setNewConversationOpen, setCreateGroupOpen } = useChatDialogStore();

	// Track window focus state to dynamically handle read receipt badges
	const isWindowFocused = useWindowFocus();

	// Sidebar resizable state management
	const [sidebarWidth, setSidebarWidth] = useState<number>(360);
	const [isResizing, setIsResizing] = useState<boolean>(false);
	const sidebarRef = useRef<HTMLElement>(null);

	// Handle mouse move for smooth sidebar resizing supporting RTL and LTR
	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			if (!isResizing || !sidebarRef.current) return;

			const rect = sidebarRef.current.getBoundingClientRect();
			const isRtl = document.documentElement.dir === 'rtl' || document.dir === 'rtl';

			// Calculate new width relative to layout direction
			const calculatedWidth = isRtl ? rect.right - e.clientX : e.clientX - rect.left;

			// Constrain sidebar width between 280px and 500px
			if (calculatedWidth >= 280 && calculatedWidth <= 385) {
				setSidebarWidth(calculatedWidth);
			}
		},
		[isResizing],
	);

	const handleMouseUp = useCallback(() => {
		setIsResizing(false);
	}, []);

	// Attach and detach global drag event listeners
	useEffect(() => {
		if (isResizing) {
			window.addEventListener('mousemove', handleMouseMove);
			window.addEventListener('mouseup', handleMouseUp);
		}

		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		};
	}, [isResizing, handleMouseMove, handleMouseUp]);

	const startResizing = (e: React.MouseEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsResizing(true);
	};

	const getChatDisplayName = (chat: IChat) => {
		if (chat.isGroup) return chat.groupName || 'Group';
		if (chat.name) return chat.name;
		const participant = chat.participants?.[0];
		if (!participant) return 'Chat';
		if (participant.name) return participant.name;
		if (participant.firstName || participant.lastName) {
			return `${participant.firstName || ''} ${participant.lastName || ''}`.trim();
		}
		return participant.username || 'User';
	};

	const getChatAvatar = (chat: IChat) => {
		if (chat.avatar) return chat.avatar;
		const participant = chat.participants?.[0];
		if (!participant) return '';
		if (typeof participant.avatar === 'string') return participant.avatar;
		return participant.avatar?.url || '';
	};

	const getLastMessageText = (chat: IChat) => {
		if (!chat.lastMessage) return '';
		if (typeof chat.lastMessage === 'string') return chat.lastMessage;
		return chat.lastMessage.content || '';
	};

	const formatLastMessageTime = (chat: IChat) => {
		const dateStr = chat.lastMessageAt || (typeof chat.lastMessage === 'object' ? chat.lastMessage?.createdAt : null);
		if (!dateStr) return '';
		try {
			return format(new Date(dateStr), 'p');
		} catch {
			return '';
		}
	};

	const filteredChats = useMemo(() => {
		return chats.filter((chat) => {
			const chatId = chat._id || chat.id || '';
			const isActive = chatId === activeChatId;

			// Clear unread count dynamically if the chat is currently active and focused
			const effectiveUnreadCount = isActive && isWindowFocused ? 0 : (chat.unreadCount ?? 0);

			const name = getChatDisplayName(chat);
			const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
			if (filter === 'unread') return matchesSearch && effectiveUnreadCount > 0;
			return matchesSearch;
		});
	}, [chats, filter, searchQuery, activeChatId, isWindowFocused]);

	return (
		<aside
			ref={sidebarRef}
			style={{ width: `${sidebarWidth}px` }}
			className={cn(
				'relative flex h-full max-w-dvw w-full flex-col overflow-hidden border-e border-border/30 bg-card-blur md:shrink-0 transition-none',
				isResizing && 'select-none',
			)}
		>
			<div className='flex min-h-18 items-center justify-between border-b border-border/30 p-4'>
				<div>
					<h1 className='text-xl font-bold text-foreground'>{t('chat.sidebar.title') || 'Messages'}</h1>
					<p className='text-xs text-muted-foreground'>{t('chat.connection.secure') || 'Realtime chat'}</p>
				</div>
				<div className='flex items-center gap-1'>
					<Button
						type='button'
						variant='ghost'
						size='icon'
						className='size-9 rounded-xl'
						aria-label={t('chat.sidebar.newChat') || 'New chat'}
						onClick={() => setNewConversationOpen(true)}
					>
						<PlusIcon className='size-4' />
					</Button>
					<Button
						type='button'
						variant='ghost'
						size='icon'
						className='size-9 rounded-xl'
						aria-label={t('chat.sidebar.createGroup') || 'Create group'}
						onClick={() => setCreateGroupOpen(true)}
					>
						<UsersIcon className='size-4' />
					</Button>
					<Button
						type='button'
						variant='ghost'
						size='icon'
						className='size-9 rounded-xl'
						aria-label={t('chat.sidebar.filter') || 'Filter'}
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
						placeholder={t('chat.sidebar.search') || 'Search conversations...'}
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
						{t('chat.sidebar.all') || 'All'}
					</Button>
					<Button
						type='button'
						size='sm'
						variant={filter === 'unread' ? 'default' : 'secondary'}
						className='h-8 rounded-full'
						onClick={() => setFilter('unread')}
					>
						{t('chat.sidebar.unread') || 'Unread'}
					</Button>
				</div>
			</div>

			<ScrollArea className='min-h-0 flex-1'>
				<div className='divide-y divide-border/20'>
					{filteredChats.map((chat) => {
						const chatId = chat._id || chat.id || '';
						const isActive = chatId === activeChatId;
						const displayName = getChatDisplayName(chat);
						const avatarUrl = getChatAvatar(chat);
						const lastMsgText = getLastMessageText(chat);
						const timeText = formatLastMessageTime(chat);

						// Calculate unread badge visibility based on active chat and tab focus status
						const effectiveUnreadCount = isActive && isWindowFocused ? 0 : (chat.unreadCount ?? 0);

						return (
							<button
								key={chatId}
								type='button'
								onClick={() => onSelectChat(chatId)}
								className={cn(
									'flex w-full items-center gap-3 p-3 text-start transition-colors hover:bg-muted/50 cursor-pointer',
									isActive && 'bg-brand-primary/10',
								)}
							>
								<div className='relative shrink-0'>
									<Avatar className='size-12 border border-border/40'>
										<AvatarImage src={avatarUrl} alt={displayName} />
										<AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
									</Avatar>
									<span
										className={cn(
											'absolute bottom-0 end-0 size-3 rounded-full border-2 border-background',
											isConnected ? 'bg-emerald-500' : 'bg-muted-foreground/40',
										)}
									/>
								</div>

								<div className='min-w-0 flex-1'>
									<div className='mb-1 flex items-center justify-between gap-3'>
										<h2 className='truncate text-sm font-semibold text-foreground'>{displayName}</h2>
										{timeText && <span className='shrink-0 text-[11px] text-muted-foreground'>{timeText}</span>}
									</div>
									<div className='flex items-center justify-between gap-3'>
										<p className='truncate text-xs text-muted-foreground'>
											{chat.isTyping
												? t('chat.status.typing') || 'typing...'
												: chat.isRecording
													? t('chat.status.recording') || 'recording...'
													: lastMsgText}
										</p>
										{effectiveUnreadCount > 0 ? (
											<Badge className='flex size-5 shrink-0 items-center justify-center rounded-full p-0 text-[10px] font-bold'>
												{effectiveUnreadCount}
											</Badge>
										) : null}
									</div>
								</div>
							</button>
						);
					})}
				</div>
			</ScrollArea>

			{/* Interactive drag-to-resize handle */}
			<div
				onMouseDown={startResizing}
				className={cn(
					'absolute top-0 end-0 h-full w-1.5 cursor-col-resize hover:bg-primary/40 active:bg-primary transition-colors z-20',
					isResizing && 'bg-primary',
				)}
			/>

			{/* New Conversation Dialog */}
			<NewConversationDialog open={isNewConversationOpen} onOpenChange={setNewConversationOpen} />

			{/* Create Group Dialog */}
			<CreateGroupDialog open={isCreateGroupOpen} onOpenChange={setCreateGroupOpen} />
		</aside>
	);
}
