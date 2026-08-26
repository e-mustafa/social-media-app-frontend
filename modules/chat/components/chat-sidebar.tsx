'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Filter, Plus, Search } from 'lucide-react';
import { useCallback, useState } from 'react';
import { ChatItem } from '../types';

interface ChatSidebarProps {
	chats: ChatItem[];
	activeChatId: string;
	onSelectChat: (id: string) => void;
}

const MIN_WIDTH = 260;
const MAX_WIDTH = 520;
const DEFAULT_WIDTH = 360;

export const ChatSidebar = ({ chats, activeChatId, onSelectChat }: ChatSidebarProps) => {
	const [filter, setFilter] = useState<'all' | 'unread' | 'favorites'>('all');
	const [searchQuery, setSearchQuery] = useState<string>('');
	const [sidebarWidth, setSidebarWidth] = useState<number>(DEFAULT_WIDTH);
	const [isResizing, setIsResizing] = useState<boolean>(false);

	// Filter chats according to active tab and search query
	const filteredChats = chats.filter((chat) => {
		const matchesSearch = chat.name.toLowerCase().includes(searchQuery.toLowerCase());
		if (filter === 'unread') return matchesSearch && (chat.unreadCount ?? 0) > 0;
		return matchesSearch;
	});

	// Handle dynamic sidebar width resizing via mouse dragging
	const startResizing = useCallback(
		(mouseDownEvent: React.MouseEvent) => {
			mouseDownEvent.preventDefault();
			setIsResizing(true);
			const startX = mouseDownEvent.clientX;
			const startWidth = sidebarWidth;

			// Determine text direction for accurate pixel delta calculation
			const isRTL = document.documentElement.dir === 'rtl' || document.dir === 'rtl';

			const doResize = (mouseMoveEvent: MouseEvent) => {
				const currentX = mouseMoveEvent.clientX;
				const deltaX = isRTL ? startX - currentX : currentX - startX;
				const newWidth = Math.min(Math.max(startWidth + deltaX, MIN_WIDTH), MAX_WIDTH);
				setSidebarWidth(newWidth);
			};

			const stopResizing = () => {
				setIsResizing(false);
				window.removeEventListener('mousemove', doResize);
				window.removeEventListener('mouseup', stopResizing);
			};

			window.addEventListener('mousemove', doResize);
			window.addEventListener('mouseup', stopResizing);
		},
		[sidebarWidth],
	);

	return (
		<aside
			style={{ width: `${sidebarWidth}px` }}
			className={`relative bg-card-glass bg-brand-primary/10xx backdrop-blur-xl border-e border-border flex flex-col max-w-full w-full! sm:w-auto h-full max-h-full overflow-hidden shrink-0 select-none ${
				isResizing ? 'transition-none' : 'transition-all duration-75'
			}`}
		>
			{/* Resizable Drag Edge Handle */}
			<div
				onMouseDown={startResizing}
				className='absolute top-0 end-0 bottom-0 w-1.5 cursor-col-resize group z-30 flex justify-center items-center hover:bg-primary/30 transition-colors'
				title='Drag to resize sidebar'
			>
				<div className='w-0.5 h-8 bg-primary group-hover:bg-primary rounded-full transition-colors' />
			</div>

			{/* Sidebar Header - Pinned Top */}
			<div className='min-h-18.75 bg-brand-primary/10 backdrop-blur-xl p-4 flex items-center justify-between border-b border-border shrink-0'>
				<h1 className='text-xl font-bold text-foreground'>Chats</h1>
				<div className='flex items-center gap-1'>
					<Button variant='ghost' size='icon' className='rounded-full size-8' title='New Chat'>
						<Plus className='size-4' />
					</Button>
					<Button variant='ghost' size='icon' className='rounded-full size-8' title='Filter Chats'>
						<Filter className='size-4' />
					</Button>
				</div>
			</div>

			{/* Search Input Container - Pinned Top */}
			<div className='px-3 py-2 border-bxxx border-border shrink-0'>
				<div className='relative flex items-center'>
					<Search className='size-4 text-muted-foreground absolute start-3 pointer-events-none' />
					<Input
						type='text'
						placeholder='Search or start new chat'
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className='ps-9 bg-muted/50 text-xs h-9'
					/>
				</div>
			</div>

			{/* Filter Tabs - Pinned Top */}
			<div className='flex items-center gap-2 px-3 py-2 border-b border-border overflow-x-auto no-scrollbar shrink-0'>
				{(['all', 'unread', 'favorites'] as const).map((tab) => (
					<Button
						key={tab}
						variant={filter === tab ? 'default' : 'secondary'}
						size='sm'
						onClick={() => setFilter(tab)}
						className='h-7 text-xs rounded-full px-3 capitalize'
					>
						{tab}
					</Button>
				))}
			</div>

			{/* Chat List Scroll Area - Only this region scrolls */}
			<ScrollArea className='flex-1 min-h-0 w-full'>
				<div className='divide-y divide-border/40'>
					{filteredChats.map((chat) => {
						const isActive = chat.id === activeChatId;
						return (
							<button
								key={chat.id}
								type='button'
								onClick={() => onSelectChat(chat.id)}
								className={`w-full p-3 flex items-center gap-3 transition-colors text-start ${
									isActive ? 'bg-accent' : 'hover:bg-accent/50'
								}`}
							>
								<Avatar className='size-12 shrink-0 border border-border/50'>
									<AvatarImage src={chat.avatar} alt={chat.name} />
									<AvatarFallback>{chat.name[0]}</AvatarFallback>
								</Avatar>
								<div className='flex-1 min-w-0'>
									<div className='flex items-center justify-between mb-1'>
										<h3 className='text-sm font-semibold text-foreground truncate'>{chat.name}</h3>
										<span className='text-[11px] text-muted-foreground shrink-0'>{chat.time}</span>
									</div>
									<div className='flex items-center justify-between'>
										<p className='text-xs text-muted-foreground truncate'>{chat.lastMessage}</p>
										{chat.unreadCount && chat.unreadCount > 0 ? (
											<Badge className='ms-2 size-5 p-0 flex items-center justify-center rounded-full text-[10px] font-bold'>
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
};
