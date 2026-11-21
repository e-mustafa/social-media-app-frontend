// 'use client';

// import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
// import { Button } from '@/shared/components/ui/button';
// import { ArrowLeft, Ban, MoreVertical, Phone, Search, Trash2, Video } from 'lucide-react';
// import { useState } from 'react';
// import { IChat } from '../types/chat.types';

// interface ChatHeaderProps {
// 	activeChat: IChat;
// 	onBack?: () => void;
// 	onOpenContactDetails?: () => void;
// 	onClearChat?: () => void;
// 	onBlockUser?: () => void;
// }

// export const ChatHeader = ({ activeChat, onBack, onOpenContactDetails, onClearChat, onBlockUser }: ChatHeaderProps) => {
// 	const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

// 	const participant = activeChat.participants?.[0];
// 	const displayName = activeChat.name || participant?.name || participant?.firstName || 'Chat';
// 	const avatarUrl =
// 		activeChat.avatar || (typeof participant?.avatar === 'string' ? participant.avatar : participant?.avatar?.url) || '';

// 	return (
// 		<div className='min-h-18.75 flex items-center justify-between p-3 border-b border-border bg-brand-primary/10 backdrop-blur-xl relative z-20'>
// 			{/* Left Side: Back Arrow (Mobile) & Contact Info Button */}
// 			<div className='flex items-center gap-2 min-w-0'>
// 				{onBack && (
// 					<Button
// 						variant='ghost'
// 						size='icon'
// 						onClick={onBack}
// 						className='md:hidden rounded-full size-9 shrink-0 cursor-pointer'
// 						aria-label='Back to chat list'
// 					>
// 						<ArrowLeft className='size-5 rtl:rotate-180' />
// 					</Button>
// 				)}

// 				<button
// 					type='button'
// 					onClick={onOpenContactDetails}
// 					className='flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity text-start rounded-lg p-1 cursor-pointer'
// 				>
// 					<Avatar className='size-10 shrink-0 border border-border/50'>
// 						<AvatarImage src={avatarUrl} alt={displayName} />
// 						<AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
// 					</Avatar>
// 					<div className='min-w-0 flex-1'>
// 						<h2 className='text-sm font-semibold text-foreground truncate'>{displayName}</h2>
// 						<p className='text-[11px] text-muted-foreground truncate'>
// 							{activeChat.isGroup ? activeChat.membersDescription || 'Group members...' : 'Online'}
// 						</p>
// 					</div>
// 				</button>
// 			</div>

// 			{/* Right Side Action Buttons */}
// 			<div className='flex items-center gap-1 shrink-0 relative'>
// 				<Button variant='ghost' size='icon' className='rounded-full size-10 cursor-pointer' title='Voice Call'>
// 					<Phone className='size-5' />
// 				</Button>
// 				<Button variant='ghost' size='icon' className='rounded-full size-10 cursor-pointer' title='Video Call'>
// 					<Video className='size-5' />
// 				</Button>

// 				<Button
// 					variant='ghost'
// 					size='icon'
// 					className='rounded-full size-10 cursor-pointer'
// 					onClick={() => setIsDropdownOpen((prev) => !prev)}
// 					title='More options'
// 				>
// 					<MoreVertical className='size-5' />
// 				</Button>

// 				{isDropdownOpen && (
// 					<>
// 						<div className='fixed inset-0 z-30' onClick={() => setIsDropdownOpen(false)} />
// 						<div className='absolute top-full end-0 mt-1 w-48 bg-card border border-border rounded-xl shadow-xl py-1 z-40 text-sm'>
// 							<button
// 								type='button'
// 								onClick={() => {
// 									setIsDropdownOpen(false);
// 									onOpenContactDetails?.();
// 								}}
// 								className='w-full px-4 py-2 flex items-center gap-2 hover:bg-accent text-start text-foreground cursor-pointer'
// 							>
// 								<Search className='size-4 text-muted-foreground' />
// 								<span>Contact Info</span>
// 							</button>
// 							<button
// 								type='button'
// 								onClick={() => {
// 									setIsDropdownOpen(false);
// 									onClearChat?.();
// 								}}
// 								className='w-full px-4 py-2 flex items-center gap-2 hover:bg-destructive/10 text-destructive text-start cursor-pointer'
// 							>
// 								<Trash2 className='size-4' />
// 								<span>Clear chat</span>
// 							</button>
// 							<button
// 								type='button'
// 								onClick={() => {
// 									setIsDropdownOpen(false);
// 									onBlockUser?.();
// 								}}
// 								className='w-full px-4 py-2 flex items-center gap-2 hover:bg-destructive/10 text-destructive text-start cursor-pointer'
// 							>
// 								<Ban className='size-4' />
// 								<span>Block</span>
// 							</button>
// 						</div>
// 					</>
// 				)}
// 			</div>
// 		</div>
// 	);
// };
