'use client';

import { useRouter } from '@/i18n/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CallScreenModal, CallType } from '../components/call-screen-modal';
import { ChatInfoDrawer } from '../components/chat-info-drawer';
import { ChatRoom } from '../components/chat-room';
import { ChatSidebar } from '../components/chat-sidebar';
import { useChatList } from '../hooks/use-chat';
import { useChatSocket } from '../hooks/use-chat-socket';
// import { useChatMessageList } from '../hooks/use-message';
import { useChatMessageList } from '../hooks/use-message';
import {
	AttachmentItem,
	ChatItem,
	ChatLiveStatus,
	Message,
	MessageStatusPayload,
	RecordingUserStatusPayload,
	TypingUserStatusPayload,
} from '../types';

const conversationsSeed: ChatItem[] = [
	{
		id: 'conversation-1',
		name: 'Mustafa Ahmed',
		avatar: '/images/placeholders/user-avatar-placeholder-male.webp',
		lastMessage: 'See you soon!',
		time: '10:42 AM',
		unreadCount: 2,
		isOnline: true,
		username: 'mustafa',
		email: 'mustafa@example.com',
	},
	{
		id: 'conversation-2',
		name: 'Sara Mohamed',
		avatar: '/images/placeholders/user-avatar-placeholder-female.webp',
		lastMessage: 'Sent a voice note',
		time: 'Yesterday',
		unreadCount: 0,
		isOnline: false,
		username: 'sara',
		email: 'sara@example.com',
	},
];

const messagesSeed: Record<string, Message[]> = {
	'conversation-1': [
		{
			id: 'message-1',
			conversationId: 'conversation-1',
			senderId: 'user-2',
			text: 'Hey, are you joining the call today?',
			timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
			createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
			isSender: false,
		},
		{
			id: 'message-2',
			conversationId: 'conversation-1',
			senderId: 'me',
			text: 'Yes, I will be there in a few minutes.',
			timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
			createdAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
			isSender: true,
			status: 'read',
		},
	],
	'conversation-2': [
		{
			id: 'message-3',
			conversationId: 'conversation-2',
			senderId: 'user-3',
			text: 'Can you review the post design?',
			timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
			createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
			isSender: false,
		},
	],
};

interface ChatScreenProps {
	conversationId?: string;
}

export default function ChatScreen({ conversationId }: ChatScreenProps) {
	const router = useRouter();
	// const [conversations, setConversations] = useState<ChatItem[]>(conversationsSeed);
	const loadMoreRef = useRef<HTMLDivElement | null>(null);

	const { data: chatData } = useChatList({ limit: 10, order: 'desc' });

	const chatList = useMemo(() => chatData?.pages.flatMap((page) => page.data || []) || [], [chatData]);

	const [activeConversationId, setActiveConversationId] = useState(conversationId || chatList[0]?._id || '');

	const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useChatMessageList(activeConversationId, {
		limit: 10,
		order: 'desc',
	});
	const messageList = useMemo(() => data?.pages.flatMap((page) => page.data || []) || [], [data]);

	console.log('messageList', messageList);

	// const [messagesByConversation, setMessagesByConversation] = useState<Record<string, Message[]>>(messagesSeed);
	const [liveStatus, setLiveStatus] = useState<ChatLiveStatus>('idle');
	const [isInfoOpen, setIsInfoOpen] = useState(false);
	const [callType, setCallType] = useState<CallType>('voice');
	const [isCallOpen, setIsCallOpen] = useState(false);

	console.log('data', data);
	console.log('chatList', chatList);

	useEffect(() => {
		const target = loadMoreRef.current;
		if (!target) return;

		const observer = new IntersectionObserver((entries) => {
			const entry = entries[0];
			if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
				fetchNextPage();
			}
		});

		observer.observe(target);
		return () => observer.disconnect();
	}, [fetchNextPage, hasNextPage, isFetchingNextPage]);

	const socketOptions = useMemo(
		() => ({
			onMessageReceived: (message: Message) => {
				if (!message.chat) return;
				// setMessagesByConversation((current) => ({
				// 	...current,
				// 	[message.conversationId as string]: [...(current[message.conversationId as string] || []), message],
				// }));
			},
			onMessageStatusUpdated: ({ conversationId: targetId, messageId, status }: MessageStatusPayload) => {
				// setMessagesByConversation((current) => ({
				// 	...current,
				// 	[targetId]: (current[targetId] || []).map((msg) => (msg.id === messageId ? { ...msg, status } : msg)),
				// }));
			},
			onTypingUserStatus: ({ conversationId: typingId, isTyping }: TypingUserStatusPayload) => {
				if (typingId === activeConversationId) {
					setLiveStatus(isTyping ? 'typing' : 'idle');
				}
			},
			onRecordingUserStatus: ({ conversationId: recordingId, isRecording }: RecordingUserStatusPayload) => {
				if (recordingId === activeConversationId) {
					setLiveStatus(isRecording ? 'recording' : 'idle');
				}
			},
			onOnlineStatus: ({ userId, status }: { userId: string; status: 'online' | 'offline' }) => {
				// setConversations((current) =>
				// 	current.map((conversation) =>
				// 		conversation.id === userId ? { ...conversation, isOnline: status === 'online' } : conversation,
				// 	),
				// );
			},
		}),
		[activeConversationId],
	);

	const { isConnected, sendMessage, startTyping, stopTyping, startRecording, stopRecording } = useChatSocket(socketOptions);
	const activeConversation = chatList.find((conversation) => conversation._id === activeConversationId) || chatList[0];
	// const activeMessages = messagesByConversation[activeConversationId] || [];

	const handleSelectConversation = (id: string) => {
		setActiveConversationId(id);
		setIsInfoOpen(false);
		router.push(`/messages/${id}`);
	};

	const handleSendMessage = (content: string, attachments?: AttachmentItem[]) => {
		const clientMessageId = `message-${Date.now()}`;
		const createdAt = new Date().toISOString();
		const newMessage: Message = {
			id: clientMessageId,
			conversationId: activeConversationId,
			senderId: 'me',
			content,
			attachments,
			timestamp: createdAt,
			createdAt,
			isSender: true,
			status: 'sent',
		};

		// setMessagesByConversation((current) => ({
		// 	...current,
		// 	[activeConversationId]: [...(current[activeConversationId] || []), newMessage],
		// }));

		sendMessage({
			conversationId: activeConversationId,
			content,
			attachments,
			sendTo: activeConversation.participants?.[0]?._id,
			// clientMessageId,
		});
	};

	const handleStartCall = (type: CallType) => {
		setCallType(type);
		setIsCallOpen(true);
	};

	const handleSoftDeleteMedia = (mediaId: string, newFileName: string) => {
		// setMessagesByConversation((current) => ({
		// 	...current,
		// 	[activeConversationId]: (current[activeConversationId] || []).map((msg) => ({
		// 		...msg,
		// 		attachments: (msg.attachments || []).map((att) =>
		// 			att.id === mediaId ? { ...att, name: newFileName, isSoftDeleted: true } : att,
		// 		),
		// 	})),
		// }));
	};

	if (!activeConversation) return null;

	return (
		<main className='flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-background text-foreground'>
			<div className='hidden h-full md:flex'>
				<ChatSidebar chats={chatList} activeChatId={activeConversationId} onSelectChat={handleSelectConversation} />
			</div>

			<div className='flex h-full min-w-0 flex-1 overflow-hidden'>
				{isInfoOpen ? (
					<ChatInfoDrawer
						conversation={activeConversation}
						messages={messageList}
						onBack={() => setIsInfoOpen(false)}
						onSoftDeleteMedia={handleSoftDeleteMedia}
					/>
				) : (
					<ChatRoom
						conversation={activeConversation}
						messages={messageList}
						liveStatus={liveStatus}
						isConnected={isConnected}
						onSendMessage={handleSendMessage}
						onStartTyping={() => startTyping({ conversationId: activeConversationId })}
						onStopTyping={() => stopTyping({ conversationId: activeConversationId })}
						onOpenInfo={() => setIsInfoOpen(true)}
						onStartCall={handleStartCall}
					/>
				)}
			</div>

			<CallScreenModal open={isCallOpen} onOpenChange={setIsCallOpen} conversation={activeConversation} type={callType} />
		</main>
	);
}
