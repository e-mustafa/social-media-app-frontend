export type NavigationTab = 'chats' | 'status' | 'channels' | 'communities' | 'calls' | 'settings';

export type MessageStatus = 'sent' | 'delivered' | 'read';
export type ChatPresenceStatus = 'online' | 'offline';
export type ChatLiveStatus = 'idle' | 'typing' | 'recording';
export type ChatMessageReaction = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';

export interface AttachmentItem {
	id: string;
	url: string;
	type: 'image' | 'video' | 'audio' | 'file';
	name?: string;
	duration?: number;
	isSoftDeleted?: boolean;
}

export interface Message {
	id: string;
	conversationId?: string;
	senderId: string;
	senderName?: string;
	text?: string;
	attachments?: AttachmentItem[];
	timestamp: string;
	createdAt?: string;
	isSender: boolean;
	status?: MessageStatus;
	reaction?: ChatMessageReaction | null;
}

export interface ChatItem {
	id: string;
	name: string;
	avatar: string;
	lastMessage: string;
	time: string;
	lastMessageAt?: string;
	unreadCount?: number;
	isOnline?: boolean;
	isTyping?: boolean;
	isRecording?: boolean;
	isGroup?: boolean;
	membersDescription?: string;
	email?: string;
	username?: string;
}

export interface ChatSendPayload {
	conversationId: string;
	text?: string;
	attachments?: AttachmentItem[];
	clientMessageId: string;
}

export interface ChatReadPayload {
	conversationId: string;
	messageId: string;
}

export interface TypingPayload {
	conversationId: string;
}

export interface RecordingPayload {
	conversationId: string;
}

export interface MessageStatusPayload {
	conversationId: string;
	messageId: string;
	status: MessageStatus;
}

export interface TypingUserStatusPayload {
	conversationId: string;
	userId: string;
	isTyping: boolean;
}

export interface RecordingUserStatusPayload {
	conversationId: string;
	userId: string;
	isRecording: boolean;
}

export interface OnlineStatusPayload {
	userId: string;
	status: ChatPresenceStatus;
}

export type ChatSocketEvent =
	| { type: 'message:send'; payload: ChatSendPayload }
	| { type: 'message:received'; payload: Message }
	| { type: 'message:read'; payload: ChatReadPayload }
	| { type: 'message:status_updated'; payload: MessageStatusPayload }
	| { type: 'typing:start'; payload: TypingPayload }
	| { type: 'typing:stop'; payload: TypingPayload }
	| { type: 'typing:user_status'; payload: TypingUserStatusPayload }
	| { type: 'recording:start'; payload: RecordingPayload }
	| { type: 'recording:stop'; payload: RecordingPayload }
	| { type: 'recording:user_status'; payload: RecordingUserStatusPayload }
	| { type: 'user:online_status'; payload: OnlineStatusPayload };
