import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { chatService } from '../services/chat.service';
import { useSocketStore } from '../store/useSocketStore';
import { ChatQueryParams, IChat, IMessage } from '../types/chat.types';

export const CHAT_QUERY_KEYS = {
	all: ['chats'] as const,
	list: (params?: ChatQueryParams) => ['chats', 'list', params] as const,
	detail: (chatId: string) => ['chats', 'detail', chatId] as const,
};

/**
 * Helper utility to extract chatId safely regardless of backend payload structure
 */
const extractChatId = (message: IMessage): string | undefined => {
	if (typeof message.chat === 'string') return message.chat;
	if (typeof message.chat === 'object' && message.chat !== null) {
		return message.chat._id || message.chat.id;
	}
	if (message.conversationId) return message.conversationId;
	return undefined;
};

/**
 * Resolves appropriate fallback text for lastMessage preview
 */
const resolveLastMessageContent = (message: IMessage): string => {
	if (message.content && message.content.trim().length > 0) {
		return message.content;
	}
	if (message.attachments && message.attachments.length > 0) {
		return '📷 Attachment';
	}
	return '';
};

export function useChats(params?: ChatQueryParams) {
	const queryClient = useQueryClient();
	const socket = useSocketStore((state) => state.socket);

	const query = useQuery({
		queryKey: CHAT_QUERY_KEYS.list(params),
		queryFn: async () => {
			const res = await chatService.getChats(params);
			return res.data || [];
		},
	});

	useEffect(() => {
		if (!socket) return;

		const handleNewNotification = (payload: { chatId?: string; message: IMessage }) => {
			const targetChatId = payload.chatId || extractChatId(payload.message);
			if (!targetChatId) return;

			queryClient.setQueryData<IChat[]>(CHAT_QUERY_KEYS.list(params), (oldChats = []) => {
				return oldChats.map((chat) => {
					const currentId = chat._id || chat.id;
					if (currentId === targetChatId) {
						return {
							...chat,
							lastMessage: resolveLastMessageContent(payload.message),
							lastMessageAt: payload.message.createdAt,
							unreadCount: (chat.unreadCount || 0) + 1,
						};
					}
					return chat;
				});
			});
		};

		const handleMessageReceived = (message: IMessage) => {
			const targetChatId = extractChatId(message);
			if (!targetChatId) return;

			queryClient.setQueryData<IChat[]>(CHAT_QUERY_KEYS.list(params), (oldChats = []) => {
				return oldChats.map((chat) => {
					const currentId = chat._id || chat.id;
					if (currentId === targetChatId) {
						return {
							...chat,
							lastMessage: resolveLastMessageContent(message),
							lastMessageAt: message.createdAt,
						};
					}
					return chat;
				});
			});
		};

		socket.on('message:direct_notification', handleNewNotification);
		socket.on('message:received', handleMessageReceived);

		return () => {
			socket.off('message:direct_notification', handleNewNotification);
			socket.off('message:received', handleMessageReceived);
		};
	}, [socket, queryClient, params]);

	return query;
}

export function useChat(chatId: string) {
	return useQuery({
		queryKey: CHAT_QUERY_KEYS.detail(chatId),
		queryFn: async () => {
			const res = await chatService.getChatById(chatId);
			return res.data;
		},
		enabled: !!chatId,
	});
}

export function useTotalUnreadChatCount() {
	const { data: chats } = useChats();
	
	const totalUnread = chats?.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0) || 0;
	
	return { totalUnread, chats };
}
