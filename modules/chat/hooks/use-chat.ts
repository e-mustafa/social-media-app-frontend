import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { chatService } from '../services/chat.service';
import { ChatQueryParams, CreateChatPayload } from '../types/chat.types';

export const CHAT_QUERY_KEYS = {
	all: ['chat'] as const,
	list: (params?: Omit<ChatQueryParams, 'page'>) => ['chat', 'list', params] as const,
	mine: (params?: ChatQueryParams) => ['chat', 'mine', params] as const,
	user: (userId: string, params?: ChatQueryParams) => ['chat', 'user', userId, params] as const,
	detail: (chatId: string) => ['chat', 'detail', chatId] as const,
};

export function useChatList(params?: Omit<ChatQueryParams, 'page'>) {
	return useInfiniteQuery({
		queryKey: CHAT_QUERY_KEYS.list(params),
		queryFn: ({ pageParam = 1 }) =>
			chatService.getChatList({
				...params,
				page: pageParam,
			}),
		initialPageParam: 1,
		getNextPageParam: (lastPage) => {
			if (lastPage.hasNextPage && lastPage.page) {
				return lastPage.page + 1;
			}
			return undefined;
		},
	});
}

export function useUserChat(userId: string, params?: ChatQueryParams) {
	return useQuery({
		queryKey: CHAT_QUERY_KEYS.user(userId, params),
		queryFn: () => chatService.getUserChat(userId, params),
		enabled: !!userId,
	});
}

export function useUserTaggedChat(userId: string, params?: ChatQueryParams) {
	const queryClient = useQueryClient();
	return useQuery({
		queryKey: ['chat', 'user', 'tagged', userId, params],
		queryFn: async () => {
			// Fetch all feed/public chat and filter where the user is tagged, or search from feed query
			const response = await chatService.getFeedChat({ limit: 100 });
			const tagged = (response.data || []).filter((chat) =>
				chat.taggedUsers?.some((u) => u._id === userId || u.id === userId),
			);
			return { ...response, data: tagged };
		},
		enabled: !!userId,
	});
}

export function useMyChat(params?: ChatQueryParams) {
	return useQuery({
		queryKey: CHAT_QUERY_KEYS.mine(params),
		queryFn: () => chatService.getMyChat(params),
	});
}

export function useChat(chatId: string) {
	return useQuery({
		queryKey: CHAT_QUERY_KEYS.detail(chatId),
		queryFn: () => chatService.getChatById(chatId),
		enabled: !!chatId,
	});
}

export function useCreateChat() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: CreateChatPayload) => chatService.createChat(payload),
		onSuccess: (res) => {
			toast.success(res.message || 'Chat created successfully');
			queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.all });
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to create chat');
		},
	});
}

export function useUpdateChat() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ chatId, payload }: { chatId: string; payload: UpdateChatPayload }) =>
			chatService.updateChat(chatId, payload),
		onSuccess: (res) => {
			toast.success(res.message || 'Chat updated successfully');
			queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.all });
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to update chat');
		},
	});
}

export function useDeleteChat() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (chatId: string) => chatService.deleteChat(chatId),
		onSuccess: (res) => {
			toast.success(res.message || 'Chat deleted successfully');
			queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.all });
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to delete chat');
		},
	});
}
