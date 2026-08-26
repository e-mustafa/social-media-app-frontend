export type NavigationTab = 'chats' | 'status' | 'channels' | 'communities' | 'calls' | 'settings';

export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface AttachmentItem {
	id: string;
	url: string;
	type: 'image' | 'audio' | 'file';
	name?: string;
	duration?: number;
}

export interface Message {
	id: string;
	senderId: string;
	senderName?: string;
	text?: string;
	attachments?: AttachmentItem[];
	timestamp: string;
	isSender: boolean;
	status?: MessageStatus;
}

export interface ChatItem {
	id: string;
	name: string;
	avatar: string;
	lastMessage: string;
	time: string;
	unreadCount?: number;
	isGroup?: boolean;
	membersDescription?: string;
	email?: string; // Added contact email
	username?: string; // Added contact @username
}
