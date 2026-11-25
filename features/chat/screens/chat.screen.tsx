'use client';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/shared/components/ui/button';
import { APP_ROUTES } from '@/shared/config/app-configs';
import { MessageSquareIcon, PlusIcon, UsersIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CallScreenModal, CallType } from '../components/call-screen-modal';
import { ChatInfoDrawer } from '../components/chat-info-drawer';
import { ChatRoom } from '../components/chat-room';
import { ChatSidebar } from '../components/chat-sidebar';
import { useChats } from '../hooks/use-chat';
import { useChatMessages } from '../hooks/use-chat-messages';
import { useChatDialogStore } from '../store/useChatDialogStore';
import { useSocketStore } from '../store/useSocketStore';
import { ChatLiveStatus, IChat, IMessageAttachment } from '../types/chat.types';

interface ChatScreenProps {
	conversationId?: string;
}

function ChatScreenContent({ conversationId }: ChatScreenProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { user } = useAuth();
	const { data: chats = [], isLoading: isLoadingChats } = useChats();
	const t = useTranslations();

	const recipientId = searchParams?.get('recipientId') ?? undefined;
	const recipientIdParam: string | undefined = recipientId || undefined;

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

	const { setNewConversationOpen, setCreateGroupOpen } = useChatDialogStore();

	const [isInfoOpen, setIsInfoOpen] = useState(false);
	const [callType, setCallType] = useState<CallType>('voice');
	const [isCallOpen, setIsCallOpen] = useState(false);
	const [isMobile, setIsMobile] = useState(false);

	// Determine if we have a specific conversation to show
	const hasExplicitConversation = Boolean(conversationId || recipientIdParam);

	// Initialize showConversationList: false on mobile when we have explicit conversation, true otherwise
	const [showConversationList, setShowConversationList] = useState(() => {
		if (typeof window !== 'undefined') {
			const mobile = window.innerWidth < 768;
			return mobile && hasExplicitConversation ? false : true;
		}
		return true;
	});

	// Detect mobile viewport
	useEffect(() => {
		const checkMobile = () => setIsMobile(window.innerWidth < 768);
		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	// Find active conversation by conversationId or recipientId
	const activeConversation: IChat | undefined =
		chats.find((chat) => chat._id === activeChatId || chat.id === activeChatId) ||
		chats.find((chat) => chat._id === conversationId || chat.id === conversationId) ||
		(recipientIdParam
			? chats.find((chat) => !chat.isGroup && chat.participants?.some((p) => (p._id || p.id) === recipientIdParam))
			: undefined);

	// Create a minimal conversation object for new chats with recipientId
	const newChatConversation: IChat | undefined =
		recipientIdParam && !activeConversation
			? {
					_id: 'new',
					id: 'new',
					participants: chats
						.flatMap((c) => c.participants)
						.filter((p) => (p._id || p.id) === recipientIdParam)
						.slice(0, 1),
					isGroup: false,
				}
			: undefined;

	// Only resolve a chatId if we have an explicit conversation to show
	const resolvedChatId = hasExplicitConversation
		? conversationId || activeConversation?._id || activeConversation?.id
		: undefined;

	const { isLoading: isLoadingMessages } = useChatMessages(resolvedChatId || undefined);

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
		router.push(`${APP_ROUTES.chat}/${id}`);
		// On mobile, switch to conversation view
		if (isMobile) {
			setShowConversationList(false);
		}
	};

	const handleBackToConversations = () => {
		setShowConversationList(true);
		// Navigate back to the main messages route without conversation ID
		router.push(APP_ROUTES.chat);
	};

	const handleSendMessage = (content: string, attachments?: IMessageAttachment[]) => {
		const sendTo = recipientIdParam || otherParticipantId;

		sendMessage({
			chatId: activeChatId || '',
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

	// Determine if we should show conversation list or active conversation on mobile
	const shouldShowConversationList = isMobile ? showConversationList : true;
	const hasActiveConversation = hasExplicitConversation && (activeConversation || newChatConversation);
	const shouldShowConversation = isMobile ? !showConversationList && hasActiveConversation : hasActiveConversation;

	if (isLoadingChats && chats.length === 0) {
		return (
			<div className='flex h-full w-full items-center justify-center bg-background text-foreground'>
				<div className='animate-pulse text-sm text-muted-foreground'>Loading conversations...</div>
			</div>
		);
	}

	// Create conversation object for rendering (handles both existing and new chats)
	const conversationForChat = activeConversation || newChatConversation;

	// Welcome panel for desktop when no conversation is selected
	const showWelcomePanel = !isMobile && !hasActiveConversation;

	return (
		<div className='flex h-full w-full overflow-hidden page-animation absolute inset-0 sm:static'>
			{/* Conversation List View (Sidebar) */}
			{shouldShowConversationList && (
				<div className='flex h-full flex-col overflow-hidden transition-all duration-200 '>
					<ChatSidebar
						chats={chats}
						activeChatId={activeChatId}
						onSelectChat={handleSelectConversation}
						isConnected={isConnected}
					/>
				</div>
			)}

			{/* Active Conversation View or Welcome Panel */}
			{isMobile ? (
				// Mobile: Full-screen conversation or conversation list
				shouldShowConversation && conversationForChat ? (
					<div className='flex h-full min-w-0 flex-1 flex-col overflow-hidden'>
						{/* </header> */}
						<div className='flex h-[100dvh - 64px]xxx min-w-0 flex-1 flex-col overflow-hidden'>
							{isInfoOpen ? (
								<ChatInfoDrawer
									conversation={conversationForChat!}
									messages={currentMessages}
									onBack={() => setIsInfoOpen(false)}
								/>
							) : (
								<ChatRoom
									conversation={conversationForChat!}
									messages={currentMessages}
									liveStatus={liveStatus}
									isConnected={isConnected}
									isLoading={isLoadingMessages && currentMessages.length === 0}
									onSendMessage={handleSendMessage}
									onStartTyping={handleStartTyping}
									onStopTyping={handleStopTyping}
									onOpenInfo={() => setIsInfoOpen(true)}
									onStartCall={handleStartCall}
									handleBack={handleBackToConversations}
								/>
							)}
						</div>
						{!!conversationForChat?.participants?.[0] && (
							<CallScreenModal
								open={isCallOpen}
								onOpenChange={setIsCallOpen}
								conversation={conversationForChat}
								type={callType}
							/>
						)}
					</div>
				) : null
			) : (
				// Desktop/Tablet: Side-by-side with welcome panel
				<div className='flex h-full min-w-0 flex-1 flex-col overflow-hidden'>
					{showWelcomePanel ? (
						// Welcome Panel
						<div className='flex h-full min-w-0 flex-1 items-center justify-center p-8 bg-background'>
							<div className='text-center space-y-6 max-w-md'>
								<div className='mx-auto size-20 rounded-2xl bg-brand-primary/10 flex items-center justify-center'>
									<MessageSquareIcon className='size-10 text-brand-primary' />
								</div>
								<div className='space-y-2'>
									<h2 className='text-2xl font-bold text-foreground'>
										{t('chat.welcome.title') || 'Welcome to Talkify Chat'}
									</h2>
									<p className='text-muted-foreground'>
										{t('chat.welcome.description') || 'Select a conversation from the list or start a new one'}
									</p>
								</div>
								<div className='flex gap-3 justify-center'>
									<Button onClick={() => setNewConversationOpen(true)}>
										<PlusIcon className='size-4 mr-2' />
										{t('chat.welcome.newChat') || 'New Chat'}
									</Button>
									<Button variant='outline' onClick={() => setCreateGroupOpen(true)}>
										<UsersIcon className='size-4 mr-2' />
										{t('chat.welcome.newGroup') || 'New Group'}
									</Button>
								</div>
							</div>
						</div>
					) : (
						// Active Conversation
						<div className='flex h-full min-w-0 flex-1 max-h-full overflow-hidden rounded-e-xl'>
							{isInfoOpen ? (
								<ChatInfoDrawer
									conversation={conversationForChat!}
									messages={currentMessages}
									onBack={() => setIsInfoOpen(false)}
								/>
							) : (
								<ChatRoom
									conversation={conversationForChat!}
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
							)}
						</div>
					)}
					{!!conversationForChat?.participants?.[0] && (
						<CallScreenModal
							open={isCallOpen}
							onOpenChange={setIsCallOpen}
							conversation={conversationForChat!}
							type={callType}
						/>
					)}
				</div>
			)}
		</div>
	);
}

export default function ChatScreen({ conversationId }: ChatScreenProps) {
	return <ChatScreenContent conversationId={conversationId} />;
}
