import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { chatService } from '../services/chat.service';
import { useSocketStore } from '../store/useSocketStore';
import { ChatQueryParams, IMessage } from '../types/chat.types';

export const CHAT_MESSAGES_QUERY_KEY = (chatId: string) => ['chats', chatId, 'messages'] as const;

/**
 * Custom hook to fetch historical messages lazily via pagination and sync them with Zustand store & socket rooms
 */
export function useChatMessages(chatId?: string, params?: ChatQueryParams) {
	const setInitialMessages = useSocketStore((state) => state.setInitialMessages);
	const joinChat = useSocketStore((state) => state.joinChat);

	const query = useInfiniteQuery({
		queryKey: CHAT_MESSAGES_QUERY_KEY(chatId || ''),
		queryFn: async ({ pageParam = 1 }) => {
			if (!chatId) return { data: [], nextPage: undefined };
			const res = await chatService.getChatMessages(chatId, {
				...params,
				page: pageParam,
				limit: params?.limit || 20,
			});

			const messages: IMessage[] = res.data || [];
			const totalPages = res.metadata?.totalPages || res.totalPages || 1;
			const nextPage = pageParam < totalPages ? pageParam + 1 : undefined;

			return {
				data: messages,
				nextPage,
			};
		},
		getNextPageParam: (lastPage) => lastPage.nextPage,
		initialPageParam: 1,
		enabled: Boolean(chatId),
	});

	// Extract and flatten all accumulated paginated pages into a single array
	const fetchedMessages = useMemo(() => {
		if (!query.data?.pages) return [];
		return query.data.pages.flatMap((page) => page.data);
	}, [query.data]);

	// Join socket room and sync API historical data into Zustand store when fetched
	useEffect(() => {
		if (chatId) {
			joinChat(chatId);
		}
		if (fetchedMessages.length > 0 && chatId) {
			setInitialMessages(chatId, fetchedMessages);
		}
	}, [fetchedMessages, chatId, setInitialMessages, joinChat]);

	return query;
}
