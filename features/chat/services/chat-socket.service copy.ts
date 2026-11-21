import { io, Socket } from 'socket.io-client';
import {
	ChatErrorPayload,
	DirectNotificationPayload,
	IMessage,
	SendMessagePayload,
	TypingPayload,
	UserTypingPayload,
} from '../types/chat.types';

type MessageHandler = (payload: IMessage) => void;
type DirectNotificationHandler = (payload: DirectNotificationPayload) => void;
type UserTypingHandler = (payload: UserTypingPayload) => void;
type ChatErrorHandler = (payload: ChatErrorPayload) => void;
type ConnectionHandler = () => void;

interface ChatSocketHandlers {
	'message:received': Set<MessageHandler>;
	'message:direct_notification': Set<DirectNotificationHandler>;
	'chat:user_typing': Set<UserTypingHandler>;
	'chat:error': Set<ChatErrorHandler>;
	connect: Set<ConnectionHandler>;
	disconnect: Set<ConnectionHandler>;
	error: Set<ConnectionHandler>;
}

class ChatSocketService {
	private socket: Socket | null = null;
	private currentUrl = '';
	private handlers: ChatSocketHandlers = {
		'message:received': new Set<MessageHandler>(),
		'message:direct_notification': new Set<DirectNotificationHandler>(),
		'chat:user_typing': new Set<UserTypingHandler>(),
		'chat:error': new Set<ChatErrorHandler>(),
		connect: new Set<ConnectionHandler>(),
		disconnect: new Set<ConnectionHandler>(),
		error: new Set<ConnectionHandler>(),
	};

	connect(url: string, token?: string) {
		if (this.socket?.connected && this.currentUrl === url) return;

		if (this.socket) {
			this.socket.disconnect();
			this.socket = null;
		}

		this.currentUrl = url;
		this.socket = io(url, {
			auth: token ? { token } : undefined,
			autoConnect: false,
			transports: ['websocket', 'polling'],
			reconnection: true,
			reconnectionAttempts: 5,
			reconnectionDelay: 1000,
		});

		this.socket.on('connect', () => this.handlers.connect.forEach((handler) => handler()));
		this.socket.on('disconnect', () => this.handlers.disconnect.forEach((handler) => handler()));
		this.socket.on('connect_error', () => this.handlers.error.forEach((handler) => handler()));

		this.socket.on('message:received', (payload: IMessage) => {
			this.handlers['message:received'].forEach((handler) => handler(payload));
		});

		this.socket.on('message:direct_notification', (payload: DirectNotificationPayload) => {
			this.handlers['message:direct_notification'].forEach((handler) => handler(payload));
		});

		this.socket.on('chat:user_typing', (payload: UserTypingPayload) => {
			this.handlers['chat:user_typing'].forEach((handler) => handler(payload));
		});

		this.socket.on('chat:error', (payload: ChatErrorPayload) => {
			this.handlers['chat:error'].forEach((handler) => handler(payload));
		});
	}

	disconnect() {
		this.socket?.disconnect();
		this.socket = null;
		this.currentUrl = '';
	}

	joinChat(chatId: string) {
		this.socket?.emit('chat:join', chatId);
	}

	leaveChat(chatId: string) {
		this.socket?.emit('chat:leave', chatId);
	}

	sendMessage(payload: SendMessagePayload) {
		this.socket?.emit('message:send', payload);
	}

	sendTyping(payload: TypingPayload) {
		this.socket?.emit('chat:typing', payload);
	}

	onMessageReceived(handler: MessageHandler) {
		return this.addHandler('message:received', handler);
	}

	onDirectNotification(handler: DirectNotificationHandler) {
		return this.addHandler('message:direct_notification', handler);
	}

	onUserTyping(handler: UserTypingHandler) {
		return this.addHandler('chat:user_typing', handler);
	}

	onChatError(handler: ChatErrorHandler) {
		return this.addHandler('chat:error', handler);
	}

	onConnect(handler: ConnectionHandler) {
		return this.addHandler('connect', handler);
	}

	onDisconnect(handler: ConnectionHandler) {
		return this.addHandler('disconnect', handler);
	}

	onError(handler: ConnectionHandler) {
		return this.addHandler('error', handler);
	}

	private addHandler<THandler extends (...args: never[]) => void>(key: keyof ChatSocketHandlers, handler: THandler) {
		const target = this.handlers[key] as Set<THandler>;
		target.add(handler);
		return () => target.delete(handler);
	}
}

export const chatSocketService = new ChatSocketService();
