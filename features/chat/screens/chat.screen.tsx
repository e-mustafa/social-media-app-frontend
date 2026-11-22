// src/components/chat-screen.tsx
'use client';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { useRouter } from '@/i18n/navigation';
import { useEffect, useState } from 'react';
import { CallScreenModal, CallType } from '../components/call-screen-modal';
import { ChatInfoDrawer } from '../components/chat-info-drawer';
import { ChatRoom } from '../components/chat-room';
import { ChatSidebar } from '../components/chat-sidebar';
import { useChats } from '../hooks/use-chat';
import { useChatMessages } from '../hooks/use-chat-messages';
import { useSocketStore } from '../store/useSocketStore';
import { ChatLiveStatus, IChat, IMessageAttachment } from '../types/chat.types';

interface ChatScreenProps {
	conversationId?: string;
}

function ChatScreenContent({ conversationId }: ChatScreenProps) {
	const router = useRouter();
	const { user } = useAuth();
	const { data: chats = [], isLoading: isLoadingChats } = useChats();

	const {
		isConnected,
		activeChatId,
		setActiveChat,
		sendMessage,
		joinChat,
		leaveChat,
		messages,
		typingUsers,
		sendTyping,
		markAsSeen,
	} = useSocketStore();

	const [isInfoOpen, setIsInfoOpen] = useState(false);
	const [callType, setCallType] = useState<CallType>('voice');
	const [isCallOpen, setIsCallOpen] = useState(false);

	const activeConversation: IChat | undefined =
		chats.find((chat) => chat._id === activeChatId || chat.id === activeChatId) ||
		chats.find((chat) => chat._id === conversationId || chat.id === conversationId) ||
		chats[0];

	const resolvedChatId = conversationId || activeConversation?._id || activeConversation?.id;

	const { isLoading: isLoadingMessages } = useChatMessages(resolvedChatId);

	// Sync active chat ID and socket room subscription
	useEffect(() => {
		if (resolvedChatId) {
			setActiveChat(resolvedChatId);
			joinChat(resolvedChatId);
		}

		return () => {
			if (resolvedChatId) {
				leaveChat(resolvedChatId);
			}
		};
	}, [resolvedChatId, setActiveChat, joinChat, leaveChat]);

	const currentMessages = activeChatId ? messages[activeChatId] || [] : [];

	const isTyping = activeChatId ? (typingUsers[activeChatId]?.length || 0) > 0 : false;
	const liveStatus: ChatLiveStatus = isTyping ? 'typing' : 'idle';

	// Resolve target sender ID (the opposite participant in the active conversation)
	const otherParticipantId =
		activeConversation?.participants?.find((p) => (p._id || p.id) !== user?.id)?._id ||
		activeConversation?.participants?.find((p) => (p._id || p.id) !== user?.id)?.id ||
		activeConversation?.participants?.[0]?._id ||
		activeConversation?.participants?.[0]?.id ||
		'';

	// Automatically trigger markAsSeen when opening chat, receiving messages, or focusing tab
	useEffect(() => {
		if (!resolvedChatId || !otherParticipantId || !isConnected) return;

		const handleMarkSeen = () => {
			markAsSeen(resolvedChatId, otherParticipantId);
		};

		handleMarkSeen();

		window.addEventListener('focus', handleMarkSeen);

		return () => {
			window.removeEventListener('focus', handleMarkSeen);
		};
	}, [resolvedChatId, otherParticipantId, currentMessages.length, isConnected, markAsSeen]);

	const handleSelectConversation = (id: string) => {
		setIsInfoOpen(false);
		router.push(`/messages/${id}`);
	};

	const handleSendMessage = (content: string, attachments?: IMessageAttachment[]) => {
		const sendTo = otherParticipantId;

		sendMessage({
			chatId: activeChatId!,
			content,
			attachments,
			sender: {
				_id: user?.id || '',
				name: user?.name,
				avatar: user?.avatar,
			},
			sendTo,
		});
	};

	const handleStartTyping = () => {
		if (activeChatId) {
			sendTyping({ chatId: activeChatId, isTyping: true });
		}
	};

	const handleStopTyping = () => {
		if (activeChatId) {
			sendTyping({ chatId: activeChatId, isTyping: false });
		}
	};

	const handleStartCall = (type: CallType) => {
		setCallType(type);
		setIsCallOpen(true);
	};

	if (isLoadingChats && chats.length === 0) {
		return (
			<div className='flex h-full w-full items-center justify-center bg-background text-foreground'>
				<div className='animate-pulse text-sm text-muted-foreground'>Loading conversations...</div>
			</div>
		);
	}

	if (!activeConversation && chats.length === 0) {
		return (
			<div className='flex h-full w-full overflow-hidden bg-background text-foreground'>
				<div className='hidden lg:flex' />
				<div className='flex h-full min-w-0 flex-1 items-center justify-center p-4 text-center text-muted-foreground'>
					No active conversations found. Start a new chat!
				</div>
			</div>
		);
	}

	return (
		<div className='flex h-full w-full overflow-hidden page-animation'>
			<div className='flex h-full min-w-0 flex-1 max-h-full overflow-hidden rounded-xl'>
				{isInfoOpen && activeConversation ? (
					<ChatInfoDrawer
						conversation={activeConversation}
						messages={currentMessages}
						onBack={() => setIsInfoOpen(false)}
					/>
				) : activeConversation ? (
					<ChatRoom
						conversation={activeConversation}
						messages={currentMessages}
						liveStatus={liveStatus}
						isConnected={isConnected}
						isLoading={isLoadingMessages && currentMessages.length === 0}
						onSendMessage={handleSendMessage}
						onStartTyping={handleStartTyping}
						onStopTyping={handleStopTyping}
						onOpenInfo={() => setIsInfoOpen(true)}
						onStartCall={handleStartCall}
					/>
				) : null}
			</div>

			{activeConversation && (
				<CallScreenModal
					open={isCallOpen}
					onOpenChange={setIsCallOpen}
					conversation={activeConversation}
					type={callType}
				/>
			)}
		</div>
	);
}

export default function ChatScreen({ conversationId }: ChatScreenProps) {
	return <ChatScreenContent conversationId={conversationId} />;
}