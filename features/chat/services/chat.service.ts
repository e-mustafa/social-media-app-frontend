import { apiClient } from '@/shared/utils/apiClient';
import { IResponse } from '@/shared/types';
import { ChatQueryParams, IChat, IMessage, PaginatedChatsResponse, PaginatedMessagesResponse } from '../types/chat.types';

export const chatService = {
	/**
	 * GET /api/chats
	 * Fetch user conversations list
	 */
	async getChats(params?: ChatQueryParams): Promise<PaginatedChatsResponse> {
		const searchParams = new URLSearchParams();
		if (params?.page) searchParams.append('page', String(params.page));
		if (params?.limit) searchParams.append('limit', String(params.limit));
		if (params?.order) searchParams.append('order', params.order);
		if (params?.search) searchParams.append('search', params.search);

		const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
		return apiClient.get<PaginatedChatsResponse>(`/chats${queryString}`);
	},

	/**
	 * GET /api/chats/:chatId/messages
	 * Fetch paginated messages for a conversation
	 */
	async getChatMessages(chatId: string, params?: ChatQueryParams): Promise<PaginatedMessagesResponse> {
		const searchParams = new URLSearchParams();
		if (params?.page) searchParams.append('page', String(params.page));
		if (params?.limit) searchParams.append('limit', String(params.limit));
		if (params?.order) searchParams.append('order', params.order);

		const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
		return apiClient.get<PaginatedMessagesResponse>(`/chats/${chatId}/messages${queryString}`);
	},

	/**
	 * GET /api/chats/:chatId
	 * Fetch single chat conversation by ID
	 */
	async getChatById(chatId: string): Promise<IResponse<IChat>> {
		return apiClient.get<IResponse<IChat>>(`/chats/${chatId}`);
	},

	/**
	 * POST /api/chats
	 * Create or get direct conversation with user
	 */
	async createChat(recipientId: string): Promise<IResponse<IChat>> {
		return apiClient.post<IResponse<IChat>>('/chats', { recipientId });
	},
};
