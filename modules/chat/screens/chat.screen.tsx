'use client';

import { useState } from 'react';
import { ChatHeader } from '../components/chat-header';
import { ChatNavRail } from '../components/chat-nav-rail';
import { ChatSidebar } from '../components/chat-sidebar';
import { ContactDetails } from '../components/contact-details';
import MessageInput from '../components/message-input';
import { MessageList } from '../components/message-list';
import { AttachmentItem, ChatItem, Message, NavigationTab } from '../types';

const MOCK_CHATS: ChatItem[] = [
	{
		id: '1',
		name: 'front-end',
		avatar: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=100&h=100&fit=crop',
		lastMessage: 'تابع قناة من هنا نبدأ... ❤️🇵🇸 ~محمود عيد',
		time: 'Yesterday',
		unreadCount: 15,
		isGroup: true,
		email: 'frontend-team@company.com',
		username: 'frontend_community',
	},
	{
		id: '2',
		name: 'Amazon EG',
		avatar: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=100&h=100&fit=crop',
		lastMessage: 'عرض على حاجة كنت عايزها! 🔥 وفر 13%...',
		time: 'Yesterday',
		unreadCount: 1,
		email: 'offers@amazon.eg',
		username: 'amazon_eg',
	},
	{
		id: '3',
		name: 'خ محمود داود',
		avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
		lastMessage: 'https://youtube.com/shorts/Q98jsof07...',
		time: 'Yesterday',
		email: 'm.dawoud@example.com',
		username: 'mahmoud_dawoud',
	},
	{
		id: '4',
		name: 'بيتي-جروب-لمنتجات-السعودية في-م...',
		avatar: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop',
		lastMessage: '~Eng Shahd: 📷 Photo',
		time: 'Sunday',
		unreadCount: 39,
		isGroup: true,
		email: 'saudi-products@group.com',
		username: 'saudi_products',
	},
	{
		id: '5',
		name: 'Tech Roots | VIP Clients (2)',
		avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop',
		lastMessage: '+20 10 26658423 joined via an invite link',
		time: '5:39 am',
		isGroup: true,
		membersDescription: '@bn2yman, +20 10 16777404, +20 15 51005664, +20 10 20216475...',
		email: 'vip-clients@techroots.com',
		username: 'techroots_vip',
	},
];

const INITIAL_MESSAGES: Message[] = [
	{
		id: 'm1',
		senderId: 'user_2',
		senderName: '~Mahmoud Eid',
		text: 'Alienware 16 Area-51 AA16250\n\nIntel Core Ultra 9 275HX\nNVIDIA GeForce RTX 5080 16GB GDDR7\n\n32GB DDR5-6400 RAM\n2TB NVMe PCIe Gen4 SSD\n\n16" QHD+ IPS Display\n2560x1600 Resolution\n\n240Hz Refresh Rate\n500 nits Brightness\n\n96Wh Battery\nWindows 11 Home',
		timestamp: '6:59 pm',
		isSender: false,
	},
	{
		id: 'm2',
		senderId: 'user_me',
		text: 'سعر 175 ألف',
		timestamp: '7:00 pm',
		isSender: true,
		status: 'read',
	},
];

export default function WhatsAppChatLayout() {
	const [activeTab, setActiveTab] = useState<NavigationTab>('chats');
	const [chats] = useState<ChatItem[]>(MOCK_CHATS);
	const [activeChatId, setActiveChatId] = useState<string>('5');
	const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
	const [isSending, setIsSending] = useState<boolean>(false);

	// View navigation states
	const [showMobileChat, setShowMobileChat] = useState<boolean>(false);
	const [showContactDetails, setShowContactDetails] = useState<boolean>(false);

	const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];

	const handleSelectChat = (id: string) => {
		setActiveChatId(id);
		setShowMobileChat(true);
		setShowContactDetails(false);
	};

	const handleBackToList = () => {
		setShowMobileChat(false);
		setShowContactDetails(false);
	};

	const handleClearChatHistory = () => {
		setMessages([]);
	};

	const handleSendMessage = async (data: { messageText: string; audioBlob: Blob | null; attachments: File[] }) => {
		setIsSending(true);

		try {
			const generatedAttachments: AttachmentItem[] = [];

			if (data.audioBlob) {
				const audioUrl = URL.createObjectURL(data.audioBlob);
				generatedAttachments.push({
					id: `att-audio-${Date.now()}`,
					url: audioUrl,
					type: 'audio',
				});
			}

			data.attachments.forEach((file, idx) => {
				const fileUrl = URL.createObjectURL(file);
				generatedAttachments.push({
					id: `att-file-${Date.now()}-${idx}`,
					url: fileUrl,
					type: file.type.startsWith('image/') ? 'image' : 'file',
					name: file.name,
				});
			});

			const newMessage: Message = {
				id: `msg-${Date.now()}`,
				senderId: 'user_me',
				text: data.messageText,
				attachments: generatedAttachments,
				timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
				isSender: true,
				status: 'sent',
			};

			setMessages((prev) => [...prev, newMessage]);
		} catch (error) {
			console.error('Failed to dispatch message:', error);

			setIsSending(false);
		}
	};

	return (
		<div className='flex flex-col md:flex-row h-screen w-full bg-background text-foreground overflow-hidden antialiased selection:bg-primary/30'>
			{/* Main Workspace Layout */}
			
			{/* 3. Bottom Navigation Rail (Hidden on mobile inside active chat view) */}
			<div className={`${showMobileChat ? 'hidden md:flex' : 'flex'} w-full md:w-auto order-last md:order-first`}>
				<ChatNavRail activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} unreadTotal={31} />
			</div>

			<div className='flex-1 flex flex-row h-full min-h-0 overflow-hidden relative'>
				{/* 1. Contacts List Sidebar (Visible when mobile chat is inactive OR on desktop screens) */}
				<div className={`h-full ${showMobileChat ? 'hidden md:flex' : 'flex'} w-full md:w-auto shrink-0`}>
					<ChatSidebar chats={chats} activeChatId={activeChatId} onSelectChat={handleSelectChat} />
				</div>

				{/* 2. Chat Conversation View OR Contact Details Panel */}
				<div
					className={`flex-1 flex flex-col h-full min-h-0 bg-background relative overflow-hidden ${
						showMobileChat ? 'flex' : 'hidden md:flex'
					}`}
				>
					{showContactDetails ? (
						/* Contact Info / Profile View Panel */
						<ContactDetails
							chat={activeChat}
							onBack={() => setShowContactDetails(false)}
							onClearChat={handleClearChatHistory}
						/>
					) : (
						/* Active Chat Messaging Section */
						<>
							{/* Chat Header */}
							<div className='shrink-0 z-10'>
								<ChatHeader
									activeChat={activeChat}
									onBack={handleBackToList}
									onOpenContactDetails={() => setShowContactDetails(true)}
									onClearChat={handleClearChatHistory}
								/>
							</div>

							{/* Message Feed Area */}
							<div className='flex-1 min-h-0 overflow-y-auto p-4 bg-linear-to-br from-accent/20 to-brand-secondary/10'>
								<MessageList messages={messages} />
							</div>

							{/* Input Box Controls */}
							<div className='bg-brand-primary/10 backdrop-blur-xl shrink-0 border-t border-border p-3 z-10'>
								<MessageInput onSend={handleSendMessage} isLoading={isSending} />
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
