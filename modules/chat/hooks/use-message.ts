import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { messageService } from '../services/message.service';
import { CreateMessagePayload, MessageQueryParams } from '../types/message.types';

export const Message_QUERY_KEYS = {
	all: ['message'] as const,
	list: (params?: Omit<MessageQueryParams, 'page'>) => ['message', 'list', params] as const,
	mine: (params?: MessageQueryParams) => ['message', 'mine', params] as const,
	user: (userId: string, params?: MessageQueryParams) => ['message', 'user', userId, params] as const,
	detail: (messageId: string) => ['message', 'detail', messageId] as const,
};

export function useChatMessageList(chatId: string, params?: Omit<MessageQueryParams, 'page'>) {
	return useInfiniteQuery({
		queryKey: Message_QUERY_KEYS.list(params),
		queryFn: ({ pageParam = 1 }) =>
			messageService.getMessageList(chatId, {
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

export function useUserMessage(userId: string, params?: MessageQueryParams) {
	return useQuery({
		queryKey: Message_QUERY_KEYS.user(userId, params),
		queryFn: () => messageService.getUserMessage(userId, params),
		enabled: !!userId,
	});
}

export function useUserTaggedMessage(userId: string, params?: MessageQueryParams) {
	const queryClient = useQueryClient();
	return useQuery({
		queryKey: ['message', 'user', 'tagged', userId, params],
		queryFn: async () => {
			// Fetch all feed/public message and filter where the user is tagged, or search from feed query
			const response = await messageService.getFeedMessage({ limit: 100 });
			const tagged = (response.data || []).filter((message) =>
				message.taggedUsers?.some((u) => u._id === userId || u.id === userId),
			);
			return { ...response, data: tagged };
		},
		enabled: !!userId,
	});
}

export function useMyMessage(params?: MessageQueryParams) {
	return useQuery({
		queryKey: Message_QUERY_KEYS.mine(params),
		queryFn: () => messageService.getMyMessage(params),
	});
}

export function useMessage(messageId: string) {
	return useQuery({
		queryKey: Message_QUERY_KEYS.detail(messageId),
		queryFn: () => messageService.getMessageById(messageId),
		enabled: !!messageId,
	});
}

export function useCreateMessage() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: CreateMessagePayload) => messageService.createMessage(payload),
		onSuccess: (res) => {
			toast.success(res.message || 'Message created successfully');
			queryClient.invalidateQueries({ queryKey: Message_QUERY_KEYS.all });
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to create message');
		},
	});
}

export function useUpdateMessage() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ messageId, payload }: { messageId: string; payload: UpdateMessagePayload }) =>
			messageService.updateMessage(messageId, payload),
		onSuccess: (res) => {
			toast.success(res.message || 'Message updated successfully');
			queryClient.invalidateQueries({ queryKey: Message_QUERY_KEYS.all });
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to update message');
		},
	});
}

export function useDeleteMessage() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (messageId: string) => messageService.deleteMessage(messageId),
		onSuccess: (res) => {
			toast.success(res.message || 'Message deleted successfully');
			queryClient.invalidateQueries({ queryKey: Message_QUERY_KEYS.all });
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to delete message');
		},
	});
}
