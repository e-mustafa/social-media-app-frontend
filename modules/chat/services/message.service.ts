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
		const searchParams = new URLSearchParams();
		if (params?.page) searchParams.append('page', String(params.page));
		if (params?.limit) searchParams.append('limit', String(params.limit));
		if (params?.order) searchParams.append('order', params.order);
		if (params?.search) searchParams.append('search', params.search);

		const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
		return apiClient.get<PaginatedMessagesResponse>(`/posts/mine${queryString}`);
	},

	async getUserMessages(userId: string, params?: MessageQueryParams): Promise<PaginatedMessagesResponse> {
		const searchParams = new URLSearchParams();
		if (params?.page) searchParams.append('page', String(params.page));
		if (params?.limit) searchParams.append('limit', String(params.limit));
		if (params?.order) searchParams.append('order', params.order);
		if (params?.search) searchParams.append('search', params.search);

		const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
		return apiClient.get<PaginatedMessagesResponse>(`/posts/user/${userId}${queryString}`);
	},

	async getMessageById(postId: string): Promise<IResponse<Message>> {
		return apiClient.get<IResponse<Message>>(`/posts/${postId}`);
	},

	async createMessage(payload: CreateMessagePayload): Promise<IResponse<Message>> {
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

		return apiClient.post<IResponse<Message>>('/posts', formData);
	},

	async updateMessage(postId: string, payload: UpdateMessagePayload): Promise<IResponse<Message>> {
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

		return apiClient.patch<IResponse<Message>>(`/posts/${postId}`, formData);
	},

	async deleteMessage(postId: string): Promise<IResponse<void>> {
		return apiClient.delete<IResponse<void>>(`/posts/${postId}`);
	},

	async addMessageReaction(postId: string, reactionType: ReactionType): Promise<IResponse<unknown>> {
		return apiClient.post<IResponse<unknown>>(`/posts/${postId}/reactions`, { reactionType });
	},

	async removeMessageReaction(postId: string): Promise<IResponse<unknown>> {
		return apiClient.delete<IResponse<unknown>>(`/posts/${postId}/reactions`);
	},
};
