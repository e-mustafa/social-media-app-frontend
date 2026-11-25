import { apiClient } from '@/shared/utils/apiClient';
import { IResponse } from '@/shared/types';
import { ChatQueryParams, IChat, PaginatedChatsResponse, PaginatedMessagesResponse } from '../types/chat.types';

export interface CreateGroupPayload {
	participants: string[];
	groupName: string;
	groupImg?: File;
}

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
	 * POST /api/chats/create-group
	 * Create a new group chat
	 */
	async createGroup(payload: CreateGroupPayload): Promise<IResponse<IChat>> {
		const formData = new FormData();
		formData.append('participants', JSON.stringify(payload.participants));
		formData.append('groupName', payload.groupName);
		if (payload.groupImg) {
			formData.append('groupImg', payload.groupImg);
		}
		return apiClient.post<IResponse<IChat>>('/chats/create-group', formData, {
			headers: { 'Content-Type': 'multipart/form-data' },
		});
	},

	/**
	 * POST /api/chats/:chatId/leave
	 * Leave a conversation (direct or group)
	 * Note: Backend endpoint may not exist yet
	 */
	async leaveChat(chatId: string): Promise<IResponse<void>> {
		return apiClient.post<IResponse<void>>(`/chats/${chatId}/leave`, {});
	},

	/**
	 * DELETE /api/chats/:chatId
	 * Delete a conversation
	 * Note: Backend endpoint may not exist yet
	 */
	async deleteChat(chatId: string): Promise<IResponse<void>> {
		return apiClient.delete<IResponse<void>>(`/chats/${chatId}`);
	},
};
