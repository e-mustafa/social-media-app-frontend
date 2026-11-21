'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { ArrowLeft, Ban, Mail, Search, Trash2, User, VolumeX } from 'lucide-react';
import { IChat } from '../types/chat.types';

interface ContactDetailsProps {
	chat: IChat;
	onBack: () => void;
	onClearChat?: () => void;
	onBlockUser?: () => void;
}

export const ContactDetails = ({ chat, onBack, onClearChat, onBlockUser }: ContactDetailsProps) => {
	const participant = chat.participants?.[0];
	const displayName = chat.name || participant?.name || participant?.firstName || 'Chat';
	const avatarUrl =
		chat.avatar || (typeof participant?.avatar === 'string' ? participant.avatar : participant?.avatar?.url) || '';
	const username = participant?.username || '';
	const email = participant?.email || '';

	return (
		<div className='flex flex-col h-full w-full bg-background border-s border-border overflow-hidden'>
			{/* Top Navigation Bar with Back Button */}
			<div className='flex items-center gap-3 p-4 border-b border-border bg-brand-primary/10 backdrop-blur-xl shrink-0'>
				<Button variant='ghost' size='icon' onClick={onBack} className='rounded-full size-9 cursor-pointer'>
					<ArrowLeft className='size-5 rtl:rotate-180' />
				</Button>
				<h2 className='text-lg font-semibold text-foreground'>Contact Info</h2>
			</div>

			{/* Scrollable Main Details Section */}
			<ScrollArea className='flex-1 w-full'>
				<div className='p-6 flex flex-col items-center gap-6 max-w-2xl mx-auto'>
					{/* User Avatar & Basic Identity */}
					<div className='flex flex-col items-center text-center gap-3'>
						<Avatar className='size-28 border-2 border-primary/20 shadow-lg'>
							<AvatarImage src={avatarUrl} alt={displayName} />
							<AvatarFallback className='text-2xl font-bold'>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
						</Avatar>
						<div>
							<h1 className='text-2xl font-bold text-foreground'>{displayName}</h1>
							{username && <p className='text-sm text-muted-foreground dir-ltr'>@{username}</p>}
						</div>
					</div>

					{/* Personal Info Card */}
					<div className='w-full bg-card rounded-xl border border-border p-4 flex flex-col gap-3 shadow-xs'>
						{email && (
							<div className='flex items-center gap-3 text-sm'>
								<Mail className='size-4 text-primary shrink-0' />
								<span className='text-foreground dir-ltr font-mono text-xs md:text-sm truncate'>{email}</span>
							</div>
						)}
						<div className='flex items-center gap-3 text-sm border-t border-border/50 pt-3'>
							<User className='size-4 text-primary shrink-0' />
							<span className='text-muted-foreground text-xs md:text-sm'>
								{chat.isGroup ? 'Group Conversation' : 'Personal Account'}
							</span>
						</div>
					</div>

					{/* Action List Items */}
					<div className='w-full bg-card rounded-xl border border-border divide-y divide-border overflow-hidden shadow-xs'>
						<button
							type='button'
							className='w-full p-3.5 flex items-center gap-3 text-sm text-foreground hover:bg-accent/50 transition-colors text-start cursor-pointer'
						>
							<Search className='size-4 text-muted-foreground' />
							<span>Search in chat</span>
						</button>
						<button
							type='button'
							className='w-full p-3.5 flex items-center gap-3 text-sm text-foreground hover:bg-accent/50 transition-colors text-start cursor-pointer'
						>
							<VolumeX className='size-4 text-muted-foreground' />
							<span>Mute notifications</span>
						</button>
						<button
							type='button'
							onClick={onClearChat}
							className='w-full p-3.5 flex items-center gap-3 text-sm text-destructive hover:bg-destructive/10 transition-colors text-start cursor-pointer'
						>
							<Trash2 className='size-4' />
							<span>Clear chat history</span>
						</button>
						<button
							type='button'
							onClick={onBlockUser}
							className='w-full p-3.5 flex items-center gap-3 text-sm text-destructive hover:bg-destructive/10 transition-colors text-start cursor-pointer'
						>
							<Ban className='size-4' />
							<span>Block contact</span>
						</button>
					</div>
				</div>
			</ScrollArea>
		</div>
	);
};
