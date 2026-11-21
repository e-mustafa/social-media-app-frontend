import { apiClient } from '@/shared/utils/apiClient';
import { IResponse } from '@/shared/types';
import { Message, MessageQueryParams, CreateMessagePayload, PaginatedMessagesResponse, ReactionType, UpdateMessagePayload } from '../types/message.types';

export const messageService = {
	async getMessageList(chatId: string, params?: MessageQueryParams): Promise<PaginatedMessagesResponse> {
		const searchParams = new URLSearchParams();
		if (params?.page) searchParams.append('page', String(params.page));
		if (params?.limit) searchParams.append('limit', String(params.limit));
		if (params?.order) searchParams.append('order', params.order);
		if (params?.search) searchParams.append('search', params.search);

		const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
		return apiClient.get<PaginatedMessagesResponse>(`/chats/${chatId}${queryString}`);
	},

	async getMyMessages(params?: MessageQueryParams): Promise<PaginatedMessagesResponse> {
		// Backend has no HTTP endpoint for "get all my messages". Messages are retrieved per-chat via GET /chats/:chatId/messages.
		// Return an empty paginated response to avoid calling a non-existent endpoint.
		return {
			success: true,
			data: [],
			message: 'No messages endpoint available; use per-chat message retrieval',
			metadata: {
				page: 1,
				limit: 10,
				total: 0,
				totalPages: 0,
				hasNext: false,
				hasPrev: false,
			},
		};
	},

	async getUserMessages(userId: string, params?: MessageQueryParams): Promise<PaginatedMessagesResponse> {
		// Backend has no HTTP endpoint for "get user messages". Messages are retrieved per-chat via GET /chats/:chatId/messages.
		// Return an empty paginated response to avoid calling a non-existent endpoint.
		return {
			success: true,
			data: [],
			message: 'No user messages endpoint available; use per-chat message retrieval',
			metadata: {
				page: 1,
				limit: 10,
				total: 0,
				totalPages: 0,
				hasNext: false,
				hasPrev: false,
			},
		};
	},

	async getMessageById(messageId: string): Promise<IResponse<Message>> {
		// Backend has no HTTP endpoint for "get message by ID". Messages are retrieved per-chat via GET /chats/:chatId/messages.
		// Return an empty response to avoid calling a non-existent endpoint.
		return {
			success: true,
			data: undefined,
			message: 'No get-message-by-id endpoint available',
		};
	},

	async createMessage(payload: CreateMessagePayload): Promise<IResponse<Message>> {
		// Backend has no HTTP endpoint for creating messages. Messages are sent via Socket.IO (message:send event).
		// This method is preserved for interface compatibility but does not call a non-existent HTTP endpoint.
		return {
			success: true,
			data: undefined,
			message: 'Message creation is handled via Socket.IO, not HTTP',
		};
	},

	async updateMessage(messageId: string, payload: UpdateMessagePayload): Promise<IResponse<Message>> {
		// Backend has no HTTP endpoint for updating messages.
		return {
			success: true,
			data: undefined,
			message: 'No update-message endpoint available',
		};
	},

	async deleteMessage(messageId: string): Promise<IResponse<void>> {
		// Backend has no HTTP endpoint for deleting messages.
		return {
			success: true,
			data: undefined,
			message: 'No delete-message endpoint available',
		};
	},

	async addMessageReaction(messageId: string, reactionType: ReactionType): Promise<IResponse<unknown>> {
		// Backend has no HTTP endpoint for message reactions. Reactions are available for posts and comments only.
		return {
			success: true,
			data: undefined,
			message: 'No message-reaction endpoint available',
		};
	},

	async removeMessageReaction(messageId: string): Promise<IResponse<unknown>> {
		// Backend has no HTTP endpoint for removing message reactions.
		return {
			success: true,
			data: undefined,
			message: 'No remove-message-reaction endpoint available',
		};
	},
};
