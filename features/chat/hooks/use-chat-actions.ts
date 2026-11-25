import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { chatService, CreateGroupPayload } from '../services/chat.service';
import { CHAT_QUERY_KEYS } from './use-chat';
import { IChat } from '../types/chat.types';
import { IResponse } from '@/shared/types';

export function useCreateGroup() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: CreateGroupPayload) => chatService.createGroup(payload),
		onSuccess: (res: IResponse<IChat>) => {
			if (res.data) {
				queryClient.setQueryData<IChat[]>(CHAT_QUERY_KEYS.list(), (old) => {
					if (!old) return [res.data!];
					return [res.data!, ...old];
				});
			}
			toast.success(res.message || 'Group created successfully');
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to create group');
		},
	});
}

export function useLeaveChat() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (chatId: string) => chatService.leaveChat(chatId),
		onMutate: async (chatId: string) => {
			await queryClient.cancelQueries({ queryKey: CHAT_QUERY_KEYS.all });
			const previousChats = queryClient.getQueryData<IChat[]>(CHAT_QUERY_KEYS.list());
			queryClient.setQueryData<IChat[]>(CHAT_QUERY_KEYS.list(), (old) =>
				old?.filter((chat) => (chat._id || chat.id) !== chatId) || []
			);
			return { previousChats };
		},
		onSuccess: (res) => {
			toast.success(res.message || 'Left conversation');
		},
		onError: (error: Error, _chatId, context) => {
			if (context?.previousChats) {
				queryClient.setQueryData(CHAT_QUERY_KEYS.list(), context.previousChats);
			}
			toast.error(error.message || 'Failed to leave conversation');
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.all });
		},
	});
}

export function useDeleteChat() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (chatId: string) => chatService.deleteChat(chatId),
		onMutate: async (chatId: string) => {
			await queryClient.cancelQueries({ queryKey: CHAT_QUERY_KEYS.all });
			const previousChats = queryClient.getQueryData<IChat[]>(CHAT_QUERY_KEYS.list());
			queryClient.setQueryData<IChat[]>(CHAT_QUERY_KEYS.list(), (old) =>
				old?.filter((chat) => (chat._id || chat.id) !== chatId) || []
			);
			return { previousChats };
		},
		onSuccess: (res) => {
			toast.success(res.message || 'Conversation deleted');
		},
		onError: (error: Error, _chatId, context) => {
			if (context?.previousChats) {
				queryClient.setQueryData(CHAT_QUERY_KEYS.list(), context.previousChats);
			}
			toast.error(error.message || 'Failed to delete conversation');
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.all });
		},
	});
}

export function useStartDirectChat() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (recipientId: string): Promise<IResponse<IChat>> => {
			// Backend creates direct chats lazily via Socket.IO when sending first message.
			// We fetch the chat list to find if a conversation already exists with this user.
			const res = await chatService.getChats({ limit: 100 });
			const existingChat = res.data?.find((chat) =>
				!chat.isGroup &&
				chat.participants?.some((p) => (p._id || p.id) === recipientId)
			);
			if (existingChat) {
				return { success: true, data: existingChat, message: 'Existing conversation found' };
			}
			// Return a minimal chat object; actual chat will be created on first message via Socket.IO
			const minimalChat: IChat = {
				_id: '',
				id: '',
				participants: [],
				isGroup: false,
			};
			return { success: true, data: minimalChat, message: 'New conversation will be created on first message' };
		},
		onSuccess: (res: IResponse<IChat>) => {
			if (res.data && res.data._id) {
				queryClient.setQueryData<IChat[]>(CHAT_QUERY_KEYS.list(), (old) => {
					if (!old) return [res.data!];
					const exists = old.some((c) => (c._id || c.id) === (res.data!._id || res.data!.id));
					if (exists) return old;
					return [res.data!, ...old];
				});
			}
			toast.success(res.message || 'Conversation started');
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to start conversation');
		},
	});
}