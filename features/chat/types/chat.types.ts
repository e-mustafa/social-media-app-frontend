import { IResponse } from '@/shared/types';

export type ChatLiveStatus = 'idle' | 'typing' | 'recording';
export type ChatMessageReaction = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';
export type MessageStatus = 'sent' | 'delivered' | 'read';
export type AttachmentItem = IMessageAttachment;

export interface IUser {
	_id: string;
	id?: string;
	firstName?: string;
	lastName?: string;
	name?: string;
	username?: string;
	email?: string;
	avatar?: string | { url: string };
	isOnline?: boolean;
	lastSeenAt?: string;
}

export interface IMessageAttachment {
	id: string;
	url: string;
	type: 'image' | 'video' | 'audio' | 'file';
	name?: string;
	duration?: number;
	isSoftDeleted?: boolean;
}

export interface IMessage {
	_id: string;
	id?: string;
	chat: string | IChat;
	receiver: IUser | string;
	sender: IUser | string;
	senderId?: string;
	senderName?: string;
	content: string;
	attachments?: IMessageAttachment[];
	createdAt: string;
	updatedAt?: string;
	status?: 'sent' | 'delivered' | 'read';
	isSender?: boolean;
	isTemp?: boolean;
	clientTempId?: string;
	isPending?: boolean;
	isSeen?: boolean;

	conversationId?: string;
	
}

export interface IChat {
	_id: string;
	id?: string;
	name?: string;
	avatar?: string;
	participants: IUser[];
	lastMessage?: IMessage | string;
	lastMessageAt?: string;
	unreadCount?: number;
	isGroup?: boolean;
	groupName?: string;
	isOnline?: boolean;
	isTyping?: boolean;
	isRecording?: boolean;
	membersDescription?: string;

	createdAt?: string;
	updatedAt?: string;
}

export interface IMessageAttachment {
	id: string;
	url: string;
	type: 'image' | 'video' | 'audio' | 'file';
	name?: string;
	duration?: number;
	isSoftDeleted?: boolean;
}

export interface IChatParticipant {
	id?: string;
	_id?: string;
	name?: string;
	firstName?: string;
	username?: string;
	avatar?: string | { url: string };
}


export interface SendMessagePayload {
	content: string;
	sendTo: string;
	chatId: string;
	attachments?: IMessageAttachment[];
	clientTempId?: string;
	sender?: {
		_id: string;
		name?: string;
		avatar?: string | { url: string };
	};
}

// Payload sent from Client to Server when marking messages as read
export interface MessageSeenEmitPayload {
   chatId: string;
   senderId: string;
}

// Payload received from Server when messages are marked as read by recipient
export interface MessageSeenEventPayload {
   by: string;
   count: number;
   readAt: string;
   chatId: string;
}
export interface TypingPayload {
	chatId: string;
	isTyping: boolean;
}

export interface DirectNotificationPayload {
	chatId: string;
	message: IMessage;
}

export interface UserTypingPayload {
	userId: string;
	chatId: string;
	isTyping: boolean;
}

export interface ChatErrorPayload {
	message: string;
}

export interface SocketEventPayloads {
	// Client -> Server
	'chat:join': string;
	'chat:leave': string;
	'message:send': SendMessagePayload;
	'message:seen': MessageSeenEmitPayload;
	'chat:typing': TypingPayload;

	// Server -> Client
	'message:received': IMessage;
	'message:direct_notification': DirectNotificationPayload;
	'chat:user_typing': UserTypingPayload;
	'chat:error': ChatErrorPayload;
}

export interface ChatQueryParams {
	page?: number;
	limit?: number;
	order?: 'asc' | 'desc';
	search?: string;
}

export interface PaginatedChatsResponse extends IResponse<IChat[]> {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
}

export interface PaginatedMessagesResponse extends IResponse<IMessage[]> {
	total?: number;
	limit?: number;
	totalPages?: number;
	page?: number;
}
