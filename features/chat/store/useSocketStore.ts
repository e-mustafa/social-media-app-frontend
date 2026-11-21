import { configEnv } from '@/shared/config/env';
import { io, Socket } from 'socket.io-client';
import { create } from 'zustand';
import {
	ChatErrorPayload,
	DirectNotificationPayload,
	IMessage,
	IUser,
	MessageSeenEventPayload,
	SendMessagePayload,
	TypingPayload,
	UserTypingPayload,
} from '../types/chat.types';

export interface ExtendedMessage extends IMessage {
	clientTempId?: string;
}

interface SocketState {
	socket: Socket | null;
	isConnected: boolean;
	activeChatId: string | null;
	messages: Record<string, IMessage[]>;
	typingUsers: Record<string, string[]>;
	notifications: DirectNotificationPayload[];
	onlineUsers: string[];

	// Actions
	connect: (token?: string) => void;
	disconnect: () => void;
	setActiveChat: (chatId: string | null) => void;
	joinChat: (chatId: string) => void;
	leaveChat: (chatId: string) => void;
	sendMessage: (payload: SendMessagePayload & { sendTo: string }) => void;
	sendTyping: (payload: TypingPayload) => void;
	setInitialMessages: (chatId: string, messages: IMessage[]) => void;
	markAsSeen: (chatId: string, senderId: string) => void;
}

const extractChatId = (message: Partial<IMessage> & { conversationId?: string }): string | undefined => {
	if (message.conversationId) return message.conversationId;
	if (typeof message.chat === 'string') return message.chat;
	if (typeof message.chat === 'object' && message.chat !== null) {
		return message.chat._id || message.chat.id;
	}
	return undefined;
};

export const useSocketStore = create<SocketState>((set, get) => ({
	socket: null,
	isConnected: false,
	activeChatId: null,
	messages: {},
	typingUsers: {},
	notifications: [],
	onlineUsers: [],

	connect: (token?: string) => {
		const { socket: existingSocket } = get();

		if (existingSocket?.connected) return;

		if (existingSocket) {
			existingSocket.removeAllListeners();
			existingSocket.disconnect();
		}

		const socketUrl = configEnv.socketUrl.replace(/\/$/, '');

		const socketInstance: Socket = io(socketUrl, {
			auth: token ? { token: `Bearer ${token}` } : undefined,
			transports: ['websocket', 'polling'],
			autoConnect: true,
			reconnection: true,
			reconnectionAttempts: 5,
			reconnectionDelay: 1000,
		});

		socketInstance.on('connect', () => {
			set({ isConnected: true });

			const activeChatId = get().activeChatId;
			if (activeChatId) {
				socketInstance.emit('chat:join', activeChatId);
			}
		});

		socketInstance.on('disconnect', () => {
			set({ isConnected: false });
		});

		socketInstance.on('connect_error', (err) => {
			console.error('Socket Connection Error:', err.message);
			set({ isConnected: false });
		});

		// Presence events listeners
		socketInstance.on('user:online', ({ userId }: { userId: string }) => {
			set((state) => ({
				onlineUsers: Array.from(new Set([...state.onlineUsers, userId])),
			}));
		});

		socketInstance.on('user:offline', ({ userId }: { userId: string }) => {
			set((state) => ({
				onlineUsers: state.onlineUsers.filter((id) => id !== userId),
			}));
		});

		// Real-time message receiver with optimistic replacement logic
		socketInstance.on('message:received', (message: ExtendedMessage) => {
			set((state) => {
				const messageId = message._id || message.id;
				const chatId = extractChatId(message) || state.activeChatId;

				if (!chatId || !messageId) return state;

				const currentMessages = state.messages[chatId] || [];

				const isAlreadyPersisted = currentMessages.some(
					(msg) => !msg.isPending && (msg._id === messageId || msg.id === messageId),
				);

				if (isAlreadyPersisted) return state;

				let replaced = false;
				const updatedMessages = currentMessages.map((msg) => {
					if (msg.isPending && message.clientTempId && msg._id === message.clientTempId) {
						replaced = true;
						return { ...message, isPending: false };
					}
					return msg;
				});

				return {
					messages: {
						...state.messages,
						[chatId]: replaced ? updatedMessages : [...currentMessages, message],
					},
				};
			});
		});

		// Direct notifications sync
		socketInstance.on('message:direct_notification', (payload: DirectNotificationPayload) => {
			set((state) => {
				const notificationMessage = payload.message;
				const chatId = payload.chatId || (notificationMessage ? extractChatId(notificationMessage) : undefined);

				const nextNotifications = [payload, ...state.notifications];

				if (chatId && notificationMessage) {
					const currentMessages = state.messages[chatId] || [];
					const messageId = notificationMessage._id || notificationMessage.id;

					const exists = currentMessages.some((msg) => msg._id === messageId || msg.id === messageId);

					if (!exists) {
						return {
							notifications: nextNotifications,
							messages: {
								...state.messages,
								[chatId]: [...currentMessages, notificationMessage],
							},
						};
					}
				}

				return { notifications: nextNotifications };
			});
		});

		socketInstance.on('chat:user_typing', (payload: UserTypingPayload) => {
			const { chatId, userId, isTyping } = payload;
			set((state) => {
				const currentTyping = state.typingUsers[chatId] || [];
				const updatedTyping = isTyping
					? Array.from(new Set([...currentTyping, userId]))
					: currentTyping.filter((id) => id !== userId);

				return {
					typingUsers: {
						...state.typingUsers,
						[chatId]: updatedTyping,
					},
				};
			});
		});

		socketInstance.on('chat:error', (payload: ChatErrorPayload) => {
			console.error('Socket Chat Error:', payload.message);
		});

		socketInstance.on('message:seen', (payload: MessageSeenEventPayload) => {
			set((state) => {
				const { chatId, readAt } = payload;
				if (!chatId) return state;

				const currentMessages = state.messages[chatId] || [];

				const updatedMessages = currentMessages.map((msg) => {
					if (!msg.isSeen || msg.status !== 'read') {
						return {
							...msg,
							isSeen: true,
							status: 'read' as const,
							readAt,
						};
					}
					return msg;
				});

				return {
					messages: {
						...state.messages,
						[chatId]: updatedMessages,
					},
				};
			});
		});

		set({ socket: socketInstance });
	},

	disconnect: () => {
		const { socket } = get();
		if (socket) {
			socket.removeAllListeners();
			socket.disconnect();
			set({ socket: null, isConnected: false, messages: {}, typingUsers: {}, activeChatId: null, onlineUsers: [] });
		}
	},

	setActiveChat: (chatId: string | null) => {
		set({ activeChatId: chatId });
	},

	setInitialMessages: (chatId: string, incomingMessages: IMessage[]) => {
		set((state) => {
			const existing = state.messages[chatId] || [];
			const messageMap = new Map<string, IMessage>();

			existing.forEach((msg) => {
				const id = msg._id || msg.id;
				if (id) messageMap.set(id, msg);
			});

			incomingMessages.forEach((msg) => {
				const id = msg._id || msg.id;
				if (id) messageMap.set(id, msg);
			});

			const sortedMessages = Array.from(messageMap.values()).sort(
				(a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(),
			);

			return {
				messages: {
					...state.messages,
					[chatId]: sortedMessages,
				},
			};
		});
	},

	joinChat: (chatId: string) => {
		const { socket } = get();
		set({ activeChatId: chatId });

		if (socket?.connected && chatId) {
			socket.emit('chat:join', chatId);
		}
	},

	leaveChat: (chatId: string) => {
		const { socket } = get();
		if (socket?.connected && chatId) {
			socket.emit('chat:leave', chatId);
			if (get().activeChatId === chatId) {
				set({ activeChatId: null });
			}
		}
	},

	sendMessage: (payload: SendMessagePayload & { sendTo: string }) => {
		const { socket } = get();
		if (!socket?.connected) return;

		const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
		const optimisticMessage: IMessage = {
			_id: tempId,
			id: tempId,
			chat: payload.chatId,
			content: payload.content || '',
			attachments: payload.attachments || [],
			sender: payload.sender as IUser | string,
			receiver: payload.sendTo,
			createdAt: new Date().toISOString(),
			isPending: true,
		};

		set((state) => {
			const currentMessages = state.messages[payload.chatId] || [];
			return {
				messages: {
					...state.messages,
					[payload.chatId]: [...currentMessages, optimisticMessage],
				},
			};
		});

		socket.emit('message:send', {
			...payload,
			clientTempId: tempId,
		});
	},

	sendTyping: (payload: TypingPayload) => {
		const { socket } = get();
		if (socket?.connected) {
			socket.emit('chat:typing', payload);
		}
	},

	markAsSeen: (chatId: string, senderId: string) => {
		const { socket } = get();
		if (!chatId || !senderId) return;

		if (typeof document !== 'undefined' && !document.hasFocus()) {
			return;
		}

		if (socket?.connected) {
			socket.emit('message:seen', { senderId, chatId });
		}

		set((state) => ({
			notifications: state.notifications.filter((n) => {
				const notificationChatId = n.chatId || (n.message ? extractChatId(n.message) : undefined);
				return notificationChatId !== chatId;
			}),
		}));
	},
}));
