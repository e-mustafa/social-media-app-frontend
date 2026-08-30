import { apiClient } from '@/shared/utils/apiClient';
import { IResponse } from '@/shared/types';
import { Chat, ChatQueryParams, CreateChatPayload, PaginatedChatsResponse, ReactionType, UpdateChatPayload } from '../types/chat.types';

export const chatService = {
	async getChatList(params?: ChatQueryParams): Promise<PaginatedChatsResponse> {
		const searchParams = new URLSearchParams();
		if (params?.page) searchParams.append('page', String(params.page));
		if (params?.limit) searchParams.append('limit', String(params.limit));
		if (params?.order) searchParams.append('order', params.order);
		if (params?.search) searchParams.append('search', params.search);

		const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
		return apiClient.get<PaginatedChatsResponse>(`/chats${queryString}`);
	},

	async getMyChats(params?: ChatQueryParams): Promise<PaginatedChatsResponse> {
		const searchParams = new URLSearchParams();
		if (params?.page) searchParams.append('page', String(params.page));
		if (params?.limit) searchParams.append('limit', String(params.limit));
		if (params?.order) searchParams.append('order', params.order);
		if (params?.search) searchParams.append('search', params.search);

		const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
		return apiClient.get<PaginatedChatsResponse>(`/posts/mine${queryString}`);
	},

	async getUserChats(userId: string, params?: ChatQueryParams): Promise<PaginatedChatsResponse> {
		const searchParams = new URLSearchParams();
		if (params?.page) searchParams.append('page', String(params.page));
		if (params?.limit) searchParams.append('limit', String(params.limit));
		if (params?.order) searchParams.append('order', params.order);
		if (params?.search) searchParams.append('search', params.search);

		const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
		return apiClient.get<PaginatedChatsResponse>(`/posts/user/${userId}${queryString}`);
	},

	async getChatById(postId: string): Promise<IResponse<Chat>> {
		return apiClient.get<IResponse<Chat>>(`/posts/${postId}`);
	},

	async createChat(payload: CreateChatPayload): Promise<IResponse<Chat>> {
		const formData = new FormData();
		formData.append('content', payload.content);

		if (payload.visibility) {
			formData.append('visibility', payload.visibility);
		}

		if (payload.isPublished !== undefined) {
			formData.append('isPublished', String(payload.isPublished));
		}

		if (payload.taggedUsers && payload.taggedUsers.length > 0) {
			payload.taggedUsers.forEach((userId) => {
				formData.append('taggedUsers[]', userId);
			});
		}

		if (payload.attachments && payload.attachments.length > 0) {
			payload.attachments.forEach((file) => {
				formData.append('attachments', file);
			});
		}

		return apiClient.post<IResponse<Chat>>('/posts', formData);
	},

	async updateChat(postId: string, payload: UpdateChatPayload): Promise<IResponse<Chat>> {
		const formData = new FormData();

		if (payload.content !== undefined) {
			formData.append('content', payload.content);
		}

		if (payload.visibility !== undefined) {
			formData.append('visibility', payload.visibility);
		}

		if (payload.isPublished !== undefined) {
			formData.append('isPublished', String(payload.isPublished));
		}

		if (payload.taggedUsers && payload.taggedUsers.length > 0) {
			payload.taggedUsers.forEach((userId) => {
				formData.append('taggedUsers[]', userId);
			});
		}

		if (payload.removedAttachmentIds && payload.removedAttachmentIds.length > 0) {
			payload.removedAttachmentIds.forEach((id) => {
				formData.append('removedAttachmentIds[]', id);
			});
		}

		if (payload.attachments && payload.attachments.length > 0) {
			payload.attachments.forEach((file) => {
				formData.append('attachments', file);
			});
		}

		return apiClient.patch<IResponse<Chat>>(`/posts/${postId}`, formData);
	},

	async deleteChat(postId: string): Promise<IResponse<void>> {
		return apiClient.delete<IResponse<void>>(`/posts/${postId}`);
	},

	async addChatReaction(postId: string, reactionType: ReactionType): Promise<IResponse<unknown>> {
		return apiClient.post<IResponse<unknown>>(`/posts/${postId}/reactions`, { reactionType });
	},

	async removeChatReaction(postId: string): Promise<IResponse<unknown>> {
		return apiClient.delete<IResponse<unknown>>(`/posts/${postId}/reactions`);
	},
};
