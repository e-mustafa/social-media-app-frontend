import { io, Socket } from 'socket.io-client';
import {
	ChatReadPayload,
	ChatSendPayload,
	Message,
	MessageStatusPayload,
	OnlineStatusPayload,
	RecordingPayload,
	RecordingUserStatusPayload,
	TypingPayload,
	TypingUserStatusPayload,
} from '../types';

type MessageHandler = (payload: Message) => void;
type StatusUpdateHandler = (payload: MessageStatusPayload) => void;
type TypingUserStatusHandler = (payload: TypingUserStatusPayload) => void;
type RecordingUserStatusHandler = (payload: RecordingUserStatusPayload) => void;
type OnlineStatusHandler = (payload: OnlineStatusPayload) => void;
type ConnectionHandler = () => void;

interface ChatSocketHandlers {
	'message:received': Set<MessageHandler>;
	'message:status_updated': Set<StatusUpdateHandler>;
	'typing:user_status': Set<TypingUserStatusHandler>;
	'recording:user_status': Set<RecordingUserStatusHandler>;
	'user:online_status': Set<OnlineStatusHandler>;
	connect: Set<ConnectionHandler>;
	disconnect: Set<ConnectionHandler>;
	error: Set<ConnectionHandler>;
}

class ChatSocketService {
	private socket: Socket | null = null;
	private currentUrl = '';
	private handlers: ChatSocketHandlers = {
		'message:received': new Set<MessageHandler>(),
		'message:status_updated': new Set<StatusUpdateHandler>(),
		'typing:user_status': new Set<TypingUserStatusHandler>(),
		'recording:user_status': new Set<RecordingUserStatusHandler>(),
		'user:online_status': new Set<OnlineStatusHandler>(),
		connect: new Set<ConnectionHandler>(),
		disconnect: new Set<ConnectionHandler>(),
		error: new Set<ConnectionHandler>(),
	};

	connect(url: string, token?: string) {
		console.log('token', token);
		if (this.socket?.connected && this.currentUrl === url) return;

		if (this.socket) {
			this.socket.disconnect();
			this.socket = null;
		}

		this.currentUrl = url;
		this.socket = io(url, {
			auth: token ? { token } : undefined,
			transports: ['websocket', 'polling'],
			autoConnect: true,
			reconnection: true,
			reconnectionAttempts: 5,
			reconnectionDelay: 1000,
		});

		this.socket.on('connect', () => this.handlers.connect.forEach((handler) => handler()));
		this.socket.on('disconnect', () => this.handlers.disconnect.forEach((handler) => handler()));
		this.socket.on('connect_error', () => this.handlers.error.forEach((handler) => handler()));

		this.socket.on('message:received', (payload: Message) => {
			this.handlers['message:received'].forEach((handler) => handler(payload));
		});

		this.socket.on('message:status_updated', (payload: MessageStatusPayload) => {
			this.handlers['message:status_updated'].forEach((handler) => handler(payload));
		});

		this.socket.on('typing:user_status', (payload: TypingUserStatusPayload) => {
			this.handlers['typing:user_status'].forEach((handler) => handler(payload));
		});

		this.socket.on('recording:user_status', (payload: RecordingUserStatusPayload) => {
			this.handlers['recording:user_status'].forEach((handler) => handler(payload));
		});

		this.socket.on('user:online_status', (payload: OnlineStatusPayload) => {
			this.handlers['user:online_status'].forEach((handler) => handler(payload));
		});
	}

	disconnect() {
		this.socket?.disconnect();
		this.socket = null;
		this.currentUrl = '';
	}

	sendMessage(payload: ChatSendPayload) {
		console.log('message:send payload', payload);
		this.socket?.emit('message:send', payload);
	}

	markMessageRead(payload: ChatReadPayload) {
		this.socket?.emit('message:read', payload);
	}

	startTyping(payload: TypingPayload) {
		this.socket?.emit('typing:start', payload);
	}

	stopTyping(payload: TypingPayload) {
		this.socket?.emit('typing:stop', payload);
	}

	startRecording(payload: RecordingPayload) {
		this.socket?.emit('recording:start', payload);
	}

	stopRecording(payload: RecordingPayload) {
		this.socket?.emit('recording:stop', payload);
	}

	onMessageReceived(handler: MessageHandler) {
		return this.addHandler('message:received', handler);
	}

	onMessageStatusUpdated(handler: StatusUpdateHandler) {
		return this.addHandler('message:status_updated', handler);
	}

	onTypingUserStatus(handler: TypingUserStatusHandler) {
		return this.addHandler('typing:user_status', handler);
	}

	onRecordingUserStatus(handler: RecordingUserStatusHandler) {
		return this.addHandler('recording:user_status', handler);
	}

	onOnlineStatus(handler: OnlineStatusHandler) {
		return this.addHandler('user:online_status', handler);
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
