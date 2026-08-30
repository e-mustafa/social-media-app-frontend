import { apiClient } from '@/shared/utils/apiClient';
import { IResponse } from '@/shared/types';
import { CreatePostPayload, PaginatedPostsResponse, Post, PostQueryParams, ReactionType, UpdatePostPayload } from '../types';

export const postsService = {
	async getFeedPosts(params?: PostQueryParams): Promise<PaginatedPostsResponse> {
		const searchParams = new URLSearchParams();
		if (params?.page) searchParams.append('page', String(params.page));
		if (params?.limit) searchParams.append('limit', String(params.limit));
		if (params?.order) searchParams.append('order', params.order);
		if (params?.search) searchParams.append('search', params.search);

		const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
		return apiClient.get<PaginatedPostsResponse>(`/posts${queryString}`);
	},

	async getMyPosts(params?: PostQueryParams): Promise<PaginatedPostsResponse> {
		const searchParams = new URLSearchParams();
		if (params?.page) searchParams.append('page', String(params.page));
		if (params?.limit) searchParams.append('limit', String(params.limit));
		if (params?.order) searchParams.append('order', params.order);
		if (params?.search) searchParams.append('search', params.search);

		const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
		return apiClient.get<PaginatedPostsResponse>(`/posts/mine${queryString}`);
	},

	async getUserPosts(userId: string, params?: PostQueryParams): Promise<PaginatedPostsResponse> {
		const searchParams = new URLSearchParams();
		if (params?.page) searchParams.append('page', String(params.page));
		if (params?.limit) searchParams.append('limit', String(params.limit));
		if (params?.order) searchParams.append('order', params.order);
		if (params?.search) searchParams.append('search', params.search);

		const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
		return apiClient.get<PaginatedPostsResponse>(`/posts/user/${userId}${queryString}`);
	},

	async getPostById(postId: string): Promise<IResponse<Post>> {
		return apiClient.get<IResponse<Post>>(`/posts/${postId}`);
	},

	async createPost(payload: CreatePostPayload): Promise<IResponse<Post>> {
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

		return apiClient.post<IResponse<Post>>('/posts', formData);
	},

	async updatePost(postId: string, payload: UpdatePostPayload): Promise<IResponse<Post>> {
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

		return apiClient.patch<IResponse<Post>>(`/posts/${postId}`, formData);
	},

	async deletePost(postId: string): Promise<IResponse<void>> {
		return apiClient.delete<IResponse<void>>(`/posts/${postId}`);
	},

	async addPostReaction(postId: string, reactionType: ReactionType): Promise<IResponse<unknown>> {
		return apiClient.post<IResponse<unknown>>(`/posts/${postId}/reactions`, { reactionType });
	},

	async removePostReaction(postId: string): Promise<IResponse<unknown>> {
		return apiClient.delete<IResponse<unknown>>(`/posts/${postId}/reactions`);
	},
};
