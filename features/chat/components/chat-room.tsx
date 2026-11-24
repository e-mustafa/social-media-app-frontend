'use client';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { AttachedMediaFile, MediaUploader } from '@/shared/components/custom-ui/media-uploader';
import { ReactionsPicker } from '@/shared/components/custom-ui/reactions-picker';
import { RecordedVoiceNote, VoiceRecorder } from '@/shared/components/custom-ui/voice-recorder';
import EmojiPicker from '@/shared/components/emoji-picker';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/utils';
import { format, isSameDay } from 'date-fns';
import {
	CheckCheckIcon,
	CheckIcon,
	ImageIcon,
	InfoIcon,
	Loader2Icon,
	MicIcon,
	PhoneIcon,
	SendIcon,
	SmileIcon,
	VideoIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
	ChatLiveStatus,
	ChatMessageReaction,
	IChat,
	IMessage,
	IMessageAttachment,
	MessageStatus,
} from '../types/chat.types';
import { AudioMessageBubble } from './audio-message-bubble';

interface ChatRoomProps {
	conversation: IChat;
	messages: IMessage[];
	liveStatus?: ChatLiveStatus;
	isConnected?: boolean;
	hasMoreMessages?: boolean;
	isLoadingMore?: boolean;
	isLoading?: boolean;
	onLoadMoreMessages?: () => void;
	onSendMessage: (text: string, attachments?: IMessageAttachment[]) => void;
	onStartTyping?: () => void;
	onStopTyping?: () => void;
	onOpenInfo?: () => void;
	onStartCall?: (type: 'voice' | 'video') => void;
}

const deliveryIcon = (status?: MessageStatus) => {
	if (status === 'read') return <CheckCheckIcon className='size-4 text-sky-500' />;
	if (status === 'delivered') return <CheckCheckIcon className='size-4 text-muted-foreground' />;
	return <CheckIcon className='size-4 text-muted-foreground' />;
};

const groupMessagesByDate = (messages: IMessage[]) => {
	return messages.reduce<Array<{ date: string; items: IMessage[] }>>((groups, message) => {
		const dateStr = message.createdAt || new Date().toISOString();
		const messageDate = new Date(dateStr);
		const lastGroup = groups[groups.length - 1];
		if (lastGroup && isSameDay(new Date(lastGroup.date), messageDate)) {
			lastGroup.items.push(message);
			return groups;
		}
		return [...groups, { date: messageDate.toISOString(), items: [message] }];
	}, []);
};

export function ChatRoom({
	conversation,
	messages,
	liveStatus = 'idle',
	isConnected = false,
	hasMoreMessages = false,
	isLoadingMore = false,
	onLoadMoreMessages,
	onSendMessage,
	onStartTyping,
	onStopTyping,
	onOpenInfo,
	onStartCall,
}: ChatRoomProps) {
	const t = useTranslations();
	const scrollContainerRef = useRef<HTMLDivElement | null>(null);
	const bottomRef = useRef<HTMLDivElement | null>(null);
	const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const [draft, setDraft] = useState('');
	const [attachedFiles, setAttachedFiles] = useState<AttachedMediaFile[]>([]);
	const [recordedAudio, setRecordedAudio] = useState<RecordedVoiceNote | null>(null);
	const mediaFileInputRef = useRef<HTMLInputElement | null>(null);

	// Refs to track scroll heights for smooth pagination anchor
	const prevScrollHeightRef = useRef<number>(0);
	const isInitialLoadRef = useRef<boolean>(true);
	const isPrependingRef = useRef<boolean>(false);

	const participant = conversation.participants?.[0];
	const displayName = conversation.name || participant?.name || participant?.firstName || participant?.username || 'Chat';
	const avatarUrl =
		conversation.avatar || (typeof participant?.avatar === 'string' ? participant.avatar : participant?.avatar?.url) || '';

	const groupedMessages = useMemo(() => groupMessagesByDate(messages), [messages]);

	// Maintain scroll position when prepending messages, or auto-scroll to bottom on first load / new message
	useLayoutEffect(() => {
		const container = scrollContainerRef.current;
		if (!container) return;

		if (isInitialLoadRef.current) {
			// Auto scroll to bottom on initial message render
			container.scrollTop = container.scrollHeight;
			isInitialLoadRef.current = false;
		} else if (isPrependingRef.current) {
			// Calculate height diff and restore position seamlessly
			const newScrollHeight = container.scrollHeight;
			const heightDiff = newScrollHeight - prevScrollHeightRef.current;
			container.scrollTop = heightDiff;
			isPrependingRef.current = false;
		} else {
			// If user is already near bottom, auto scroll down on new sent/received message
			const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
			if (isNearBottom) {
				bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
			}
		}
	}, [messages]);

	// Listen to scroll events to trigger fetching older messages
	const handleScroll = () => {
		const container = scrollContainerRef.current;
		if (!container || isLoadingMore || !hasMoreMessages) return;

		// When reaching near the top threshold (e.g. <= 40px)
		if (container.scrollTop <= 40) {
			prevScrollHeightRef.current = container.scrollHeight;
			isPrependingRef.current = true;
			onLoadMoreMessages?.();
		}
	};

	const handleDraftChange = (value: string) => {
		setDraft(value);
		onStartTyping?.();

		if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
		typingTimeoutRef.current = setTimeout(() => onStopTyping?.(), 900);
	};

	const handleEmojiSelect = (emoji: string) => {
		setDraft((prev) => prev + emoji);
	};

	const submit = () => {
		const text = draft.trim();
		const hasMedia = attachedFiles.length > 0 || !!recordedAudio;

		if (!text && !hasMedia) return;

		const attachmentsPayload: IMessageAttachment[] = [];

		if (attachedFiles.length > 0) {
			attachedFiles.forEach((fileItem, idx) => {
				const isVideo = fileItem.file.type.startsWith('video/');
				attachmentsPayload.push({
					id: `att-${Date.now()}-${idx}`,
					url: fileItem.preview,
					type: isVideo ? 'video' : 'image',
					name: fileItem.file.name,
				});
			});
		}

		if (recordedAudio) {
			attachmentsPayload.push({
				id: `voice-${Date.now()}`,
				url: recordedAudio.preview,
				type: 'audio',
				duration: recordedAudio.duration,
				name: 'Voice Note',
			});
		}

		onSendMessage(text, attachmentsPayload.length > 0 ? attachmentsPayload : undefined);

		setDraft('');
		setAttachedFiles([]);
		setRecordedAudio(null);
		onStopTyping?.();
	};

	return (
		<section className='flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-linear-to-br from-accent/20 to-brand-secondary/10'>
			{/* Header */}
			<header className='flex min-h-18 items-center justify-between border-b border-border/30 bg-card-blur px-4 py-3'>
				<div className='flex min-w-0 items-center gap-3'>
					<div className='relative shrink-0'>
						<Avatar className='size-11 border border-border/40'>
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
					<div className='min-w-0'>
						<h2 className='truncate text-sm font-semibold text-foreground'>{displayName}</h2>
						<p className='text-xs text-muted-foreground'>
							{liveStatus === 'typing'
								? t('chat.status.typing') || 'typing...'
								: liveStatus === 'recording'
									? t('chat.status.recording') || 'recording audio...'
									: isConnected
										? t('chat.status.online') || 'Online'
										: t('chat.status.offline') || 'Offline'}
						</p>
					</div>
				</div>
				<div className='flex shrink-0 items-center gap-1'>
					<Button
						type='button'
						variant='ghost'
						size='icon'
						className='size-9 rounded-xl cursor-pointer'
						onClick={() => onStartCall?.('voice')}
						aria-label={t('chat.call.voiceCall')}
					>
						<PhoneIcon className='size-4' />
					</Button>
					<Button
						type='button'
						variant='ghost'
						size='icon'
						className='size-9 rounded-xl cursor-pointer'
						onClick={() => onStartCall?.('video')}
						aria-label={t('chat.call.videoCall')}
					>
						<VideoIcon className='size-4' />
					</Button>
					<Button
						type='button'
						variant='ghost'
						size='icon'
						className='size-9 rounded-xl cursor-pointer'
						onClick={onOpenInfo}
						aria-label={t('chat.info.title')}
					>
						<InfoIcon className='size-4' />
					</Button>
				</div>
			</header>

			{/* Messages Scroll Area with Native Smooth Scroll Pagination */}
			<div
				ref={scrollContainerRef}
				onScroll={handleScroll}
				className='min-h-0 flex-1 overflow-y-auto p-4 space-y-6 scrollbar-style'
			>
				{/* Loading spinner indicator when fetching older messages */}
				{isLoadingMore && (
					<div className='flex items-center justify-center py-2'>
						<Loader2Icon className='size-5 animate-spin text-brand-primary' />
					</div>
				)}

				{groupedMessages.map((group) => (
					<div key={group.date} className='space-y-3'>
						<div className='sticky top-2 z-10 mx-auto w-fit rounded-full border border-border/20 bg-card-glass px-3 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur-xl'>
							{format(new Date(group.date), 'PPP')}
						</div>
						{group.items.map((message) => (
							<MessageBubble key={message.id || message._id} message={message} />
						))}
					</div>
				))}
				<div ref={bottomRef} />
			</div>

			{/* Footer */}
			<footer className='border-t border-border/30 bg-card-blur p-3 space-y-2'>
				<div className='flex flex-wrap items-center justify-between gap-2 px-1'>
					<div className='flex items-center gap-2'>
						<EmojiPicker
							onEmojiSelect={handleEmojiSelect}
							trigger={
								<Button
									type='button'
									variant='ghost'
									size='icon'
									className='size-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer'
									aria-label='Add Emoji'
								>
									<SmileIcon className='size-5' />
								</Button>
							}
						/>

						<MediaUploader
							files={attachedFiles}
							onFilesChange={setAttachedFiles}
							maxFiles={4}
							fileInputRef={mediaFileInputRef}
						/>

						<VoiceRecorder
							onRecordComplete={setRecordedAudio}
							onRemove={() => setRecordedAudio(null)}
							recordedAudio={recordedAudio}
						/>
					</div>
				</div>

				{/* Input Bar Container */}
				<div className='flex items-end gap-2 rounded-2xl border border-border/30 bg-background/50 p-2'>
					<textarea
						value={draft}
						onChange={(event) => handleDraftChange(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === 'Enter' && !event.shiftKey) {
								event.preventDefault();
								submit();
							}
						}}
						placeholder={t('chat.input.placeholder') || 'Type a message...'}
						className='max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground'
					/>
					<Button
						type='button'
						className='size-10 rounded-xl text-white font-medium bg-brand-primary hover:bg-brand-primary/90 cursor-pointer'
						onClick={submit}
						aria-label={t('chat.input.send') || 'Send'}
					>
						<SendIcon className='size-4 rotate-180 rtl:rotate-0' />
					</Button>
				</div>
			</footer>
		</section>
	);
}

function MessageBubble({ message }: { message: IMessage }) {
	const [reaction, setReaction] = useState<ChatMessageReaction | null>(null);
	const dateStr = message.createdAt || new Date().toISOString();
	const messageDate = new Date(dateStr);

	const visibleAttachments = (message.attachments || []).filter((a) => !a.isSoftDeleted);

	const { user } = useAuth();

	// Resolve sender ID regardless of whether backend returned an Object or String ID
	const senderId = typeof message.sender === 'object' ? message.sender?._id || message.sender?.id : message.sender;

	const isSender = Boolean(senderId && user?.id && senderId === user.id);

	return (
		<div className={cn('flex w-full', isSender ? 'justify-start' : 'justify-end')}>
			<div
				className={cn(
					'group max-w-[82%] space-y-2 rounded-3xl border p-3 pb-1 shadow-xs sm:max-w-[68%]',
					isSender
						? 'rounded-ss-md border-border/30 bg-brand-secondary/30'
						:  'rounded-se border-brand-primary/20 bg-brand-primary/70 text-white',
				)}
			>
				{message.content && <p className='whitespace-pre-wrap break-words text-sm leading-6'>{message.content}</p>}
				{visibleAttachments.length > 0 && (
					<div className='grid grid-cols-2 gap-2'>
						{visibleAttachments.map((attachment) => {
							if (attachment.type === 'audio')
								return (
									<AudioMessageBubble
										key={attachment.id}
										src={attachment.url}
										duration={attachment.duration}
										isSender={!!isSender}
									/>
								);
							if (attachment.type === 'image') {
								return (
									<div key={attachment.id} className='relative h-36 overflow-hidden rounded-2xl bg-black/10'>
										<Image
											src={attachment.url}
											alt={attachment.name || 'Message image'}
											fill
											className='object-cover'
											sizes='40vw'
										/>
									</div>
								);
							}
							return (
								<div key={attachment.id} className='flex items-center gap-2 rounded-xl bg-background/20 p-2 text-xs'>
									{attachment.type === 'video' ? <ImageIcon className='size-4' /> : <MicIcon className='size-4' />}
									<span className='truncate'>{attachment.name || attachment.type}</span>
								</div>
							);
						})}
					</div>
				)}
				<div
					className={cn(
						'flex items-center justify-end gap-2 text-[11px]',
						isSender ? 'text-white/80' : 'text-muted-foreground',
					)}
				>
					<ReactionsPicker
						activeReaction={reaction}
						onChange={(r) => setReaction(r as ChatMessageReaction | null)}
						className='scale-90'
					/>
					<span>{format(messageDate, 'p')}</span>
					{isSender && deliveryIcon(message.status)}
				</div>
			</div>
		</div>
	);
}
