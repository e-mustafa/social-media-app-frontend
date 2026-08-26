'use client';

import { useState } from 'react';
import { ChatHeader } from '../components/chat-header';
import { ChatNavRail } from '../components/chat-nav-rail';
import { ChatSidebar } from '../components/chat-sidebar';
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
	},
	{
		id: '2',
		name: 'Amazon EG',
		avatar: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=100&h=100&fit=crop',
		lastMessage: 'عرض على حاجة كنت عايزها! 🔥 وفر 13%...',
		time: 'Yesterday',
		unreadCount: 1,
	},
	{
		id: '3',
		name: 'خ محمود داود',
		avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
		lastMessage: 'https://youtube.com/shorts/Q98jsof07...',
		time: 'Yesterday',
	},
	{
		id: '4',
		name: 'بيتي-جروب-لمنتجات-السعودية في-م...',
		avatar: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop',
		lastMessage: '~Eng Shahd: 📷 Photo',
		time: 'Sunday',
		unreadCount: 39,
		isGroup: true,
	},
	{
		id: '5',
		name: 'Tech Roots | VIP Clients (2)',
		avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop',
		lastMessage: '+20 10 26658423 joined via an invite link',
		time: '5:39 am',
		isGroup: true,
		membersDescription: '@bn2yman, +20 10 16777404, +20 15 51005664, +20 10 20216475...',
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

	const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];

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
		} finally {
			setIsSending(false);
		}
	};

	return (
		<div className='flex h-screen w-full bg-background text-foreground overflow-hidden antialiased selection:bg-primary/30'>
			{/* 1. Navigation Rail (Far-Start Panel) */}
			<ChatNavRail activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} unreadTotal={31} />

			{/* 2. Chat Contacts List Sidebar */}
			<ChatSidebar chats={chats} activeChatId={activeChatId} onSelectChat={(id) => setActiveChatId(id)} />

			{/* 3. Main Chat Messaging Area */}
			<div className='flex-1 flex flex-col h-full min-h-0 bg-background relative overflow-hidden'>
				{/* Chat Header - Pinned Top */}
				<div className='shrink-0 z-10'>
					<ChatHeader activeChat={activeChat} />
				</div>

				{/* Message Bubble Feed - Scrollable Middle Section Only */}
				<div className='flex-1 min-h-0 overflow-y-auto p-4 bg-linear-to-br from-accent/20 to-brand-secondary/10'>
					<MessageList messages={messages} />
				</div>

				{/* Bottom Message Input Box - Pinned Bottom */}
				<div className='bg-brand-primary/10 backdrop-blur-xl shrink-0 border-t border-border p-3 z-10'>
					<MessageInput onSend={handleSendMessage} isLoading={isSending} />
				</div>
			</div>
		</div>
	);
}
