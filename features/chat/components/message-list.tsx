// 'use client';

// import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
// import { ScrollArea } from '@/shared/components/ui/scroll-area';
// import { format } from 'date-fns';
// import { Check, CheckCheck, FileText, Play } from 'lucide-react';
// import { IMessage } from '../types/chat.types';

// interface MessageListProps {
// 	messages: IMessage[];
// }

// export const MessageList = ({ messages }: MessageListProps) => {
// 	return (
// 		<ScrollArea className='flex-1'>
// 			<div className='space-y-4 max-w-6xl mx-auto p-4'>
// 				{messages.map((message) => {
// 					const isOutgoing = message.isSender;
// 					const dateStr = message.createdAt || new Date().toISOString();
// 					const messageText = message.content || '';

// 					return (
// 						<div
// 							key={message.id || message._id}
// 							className={`flex items-end gap-2 w-full ${isOutgoing ? 'justify-end' : 'justify-start'}`}
// 						>
// 							{!isOutgoing && (
// 								<Avatar className='size-8 shrink-0 mb-1 border border-border'>
// 									<AvatarImage src='' />
// 									<AvatarFallback>{message.senderName?.[0] || 'U'}</AvatarFallback>
// 								</Avatar>
// 							)}

// 							<div
// 								className={`relative group max-w-[85%] sm:max-w-[70%] p-3 shadow-xs transition-colors duration-200 ${
// 									isOutgoing
// 										? 'bg-primary text-primary-foreground rounded-2xl rounded-se-none'
// 										: 'bg-muted text-foreground border border-border/40 rounded-2xl rounded-ss-none'
// 								}`}
// 							>
// 								{!isOutgoing && message.senderName && (
// 									<p className='text-xs font-bold text-primary mb-1 text-start'>{message.senderName}</p>
// 								)}

// 								{message.attachments && message.attachments.length > 0 && (
// 									<div className='space-y-2 mb-2'>
// 										{message.attachments.map((att) => (
// 											<div key={att.id} className='rounded-lg overflow-hidden border border-border/20'>
// 												{att.type === 'image' && (
// 													<img
// 														src={att.url}
// 														alt='Attachment'
// 														className='max-h-60 w-full object-cover rounded-md'
// 													/>
// 												)}
// 												{att.type === 'audio' && (
// 													<div className='flex items-center gap-3 p-2 bg-background/10 rounded-md'>
// 														<button
// 															type='button'
// 															className='p-2 rounded-full bg-primary-foreground/20 text-current hover:bg-primary-foreground/30 cursor-pointer'
// 														>
// 															<Play className='size-4 fill-current' />
// 														</button>
// 														<div className='h-1 flex-1 bg-current/20 rounded-full overflow-hidden'>
// 															<div className='h-full w-1/3 bg-current rounded-full' />
// 														</div>
// 													</div>
// 												)}
// 												{att.type === 'file' && (
// 													<div className='flex items-center gap-2 p-2 bg-background/10 rounded-md text-xs'>
// 														<FileText className='size-4 shrink-0' />
// 														<span className='truncate'>{att.name || 'Document'}</span>
// 													</div>
// 												)}
// 											</div>
// 										))}
// 									</div>
// 								)}

// 								{messageText && (
// 									<p className='text-sm leading-relaxed whitespace-pre-wrap break-words text-start'>
// 										{messageText}
// 									</p>
// 								)}

// 								<div
// 									className={`flex items-center gap-1 text-[10px] mt-1 select-none ${
// 										isOutgoing ? 'justify-end text-primary-foreground/80' : 'justify-end text-muted-foreground'
// 									}`}
// 								>
// 									<span>{format(new Date(dateStr), 'p')}</span>
// 									{isOutgoing && (
// 										<span className='ms-0.5'>
// 											{message.status === 'read' ? (
// 												<CheckCheck className='size-3.5 text-primary-foreground' />
// 											) : (
// 												<Check className='size-3.5 text-primary-foreground/70' />
// 											)}
// 										</span>
// 									)}
// 								</div>
// 							</div>
// 						</div>
// 					);
// 				})}
// 			</div>
// 		</ScrollArea>
// 	);
// };
