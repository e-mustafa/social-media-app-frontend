// components/contact-details.tsx
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { ArrowLeft, Ban, FileText, Mail, Search, Trash2, User, VolumeX } from 'lucide-react';
import { ChatItem } from '../types';

interface ContactDetailsProps {
	chat: ChatItem;
	onBack: () => void;
	onClearChat?: () => void;
	onBlockUser?: () => void;
}

export const ContactDetails = ({ chat, onBack, onClearChat, onBlockUser }: ContactDetailsProps) => {
	// Mock shared files for display purposes
	const sharedMedia = [
		{ id: '1', type: 'image', url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=300&h=300&fit=crop' },
		{ id: '2', type: 'image', url: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=300&h=300&fit=crop' },
		{ id: '3', type: 'file', name: 'Project_Requirements.pdf', size: '2.4 MB' },
	];

	return (
		<div className='flex flex-col h-full w-full bg-background border-s border-border overflow-hidden'>
			{/* Top Navigation Bar with Back Button */}
			<div className='flex items-center gap-3 p-4 border-b border-border bg-brand-primary/10 backdrop-blur-xl shrink-0'>
				<Button variant='ghost' size='icon' onClick={onBack} className='rounded-full size-9'>
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
							<AvatarImage src={chat.avatar} alt={chat.name} />
							<AvatarFallback className='text-2xl font-bold'>{chat.name[0]}</AvatarFallback>
						</Avatar>
						<div>
							<h1 className='text-2xl font-bold text-foreground'>{chat.name}</h1>
							<p className='text-sm text-muted-foreground dir-ltr'>
								{chat.username ? `@${chat.username}` : `@${chat.name.toLowerCase().replace(/\s+/g, '_')}`}
							</p>
						</div>
					</div>

					{/* Personal Info Card */}
					<div className='w-full bg-card rounded-xl border border-border p-4 flex flex-col gap-3 shadow-xs'>
						<div className='flex items-center gap-3 text-sm'>
							<Mail className='size-4 text-primary shrink-0' />
							<span className='text-foreground dir-ltr font-mono text-xs md:text-sm truncate'>
								{chat.email || `${chat.name.toLowerCase().replace(/\s+/g, '.')}@example.com`}
							</span>
						</div>
						<div className='flex items-center gap-3 text-sm border-t border-border/50 pt-3'>
							<User className='size-4 text-primary shrink-0' />
							<span className='text-muted-foreground text-xs md:text-sm'>
								{chat.isGroup ? 'Group Conversation' : 'Personal Account'}
							</span>
						</div>
					</div>

					{/* Shared Media Section */}
					<div className='w-full flex flex-col gap-3'>
						<div className='flex items-center justify-between'>
							<h3 className='text-sm font-semibold text-muted-foreground'>Media, Links and Docs</h3>
							<span className='text-xs text-primary cursor-pointer hover:underline'>
								See all ({sharedMedia.length})
							</span>
						</div>

						<div className='grid grid-cols-3 gap-2'>
							{sharedMedia.map((item) => (
								<div
									key={item.id}
									className='aspect-square rounded-lg bg-muted border border-border overflow-hidden relative group'
								>
									{item.type === 'image' ? (
										<img src={item.url} alt='Shared media' className='w-full h-full object-cover' />
									) : (
										<div className='w-full h-full flex flex-col items-center justify-center p-2 text-center bg-accent/40'>
											<FileText className='size-6 text-primary mb-1' />
											<span className='text-[10px] text-foreground truncate w-full'>{item.name}</span>
										</div>
									)}
								</div>
							))}
						</div>
					</div>

					{/* Action List Items */}
					<div className='w-full bg-card rounded-xl border border-border divide-y divide-border overflow-hidden shadow-xs'>
						<button
							type='button'
							className='w-full p-3.5 flex items-center gap-3 text-sm text-foreground hover:bg-accent/50 transition-colors text-start'
						>
							<Search className='size-4 text-muted-foreground' />
							<span>Search in chat</span>
						</button>
						<button
							type='button'
							className='w-full p-3.5 flex items-center gap-3 text-sm text-foreground hover:bg-accent/50 transition-colors text-start'
						>
							<VolumeX className='size-4 text-muted-foreground' />
							<span>Mute notifications</span>
						</button>
						<button
							type='button'
							onClick={onClearChat}
							className='w-full p-3.5 flex items-center gap-3 text-sm text-destructive hover:bg-destructive/10 transition-colors text-start'
						>
							<Trash2 className='size-4' />
							<span>Clear chat history</span>
						</button>
						<button
							type='button'
							onClick={onBlockUser}
							className='w-full p-3.5 flex items-center gap-3 text-sm text-destructive hover:bg-destructive/10 transition-colors text-start'
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
