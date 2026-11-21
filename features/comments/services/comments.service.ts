import { ReactionType } from '@/features/posts/types';
import { IResponse } from '@/shared/types';
import { apiClient } from '@/shared/utils/apiClient';
import { Comment, CommentQueryParams, CommentsResponse, CreateCommentPayload, UpdateCommentPayload } from '../types';

const toQueryString = (params?: CommentQueryParams) => {
	const searchParams = new URLSearchParams();
	if (params?.page) searchParams.append('page', String(params.page));
	if (params?.limit) searchParams.append('limit', String(params.limit));
	if (params?.order) searchParams.append('order', params.order);
	return searchParams.toString() ? `?${searchParams.toString()}` : '';
};

const appendCommentPayload = (
	formData: FormData,
	payload: Omit<CreateCommentPayload, 'postId'> | Omit<UpdateCommentPayload, 'commentId'>,
) => {
	if (payload.content !== undefined) formData.append('content', payload.content);

	if (payload.taggedUsers && payload.taggedUsers.length > 0) {
		payload.taggedUsers.forEach((userId) => formData.append('taggedUsers[]', userId));
	}

	if ('removedAttachmentIds' in payload && payload.removedAttachmentIds && payload.removedAttachmentIds.length > 0) {
		payload.removedAttachmentIds.forEach((id) => formData.append('removedAttachmentIds[]', id));
	}

	if (payload.attachments && payload.attachments.length > 0) {
		payload.attachments.forEach((file) => formData.append('attachments', file));
	}
};

export const commentsService = {
	async getPostComments(postId: string, params?: CommentQueryParams): Promise<CommentsResponse> {
		return apiClient.get<CommentsResponse>(`/posts/${postId}/comments${toQueryString(params)}`);
	},

	async getCommentReplies(commentId: string, params?: CommentQueryParams): Promise<CommentsResponse> {
		return apiClient.get<CommentsResponse>(`/comments/${commentId}/replies${toQueryString(params)}`);
	},

	async createComment(payload: CreateCommentPayload): Promise<IResponse<Comment>> {
		const formData = new FormData();
		appendCommentPayload(formData, payload);
		return apiClient.post<IResponse<Comment>>(`/posts/${payload.postId}/comments`, formData);
	},

	async createReply(payload: CreateCommentPayload): Promise<IResponse<Comment>> {
		if (!payload.replyToCommentId) throw new Error('Reply target comment is required');

		const formData = new FormData();
		appendCommentPayload(formData, payload);
		return apiClient.post<IResponse<Comment>>(`/comments/${payload.replyToCommentId}/replies`, formData);
	},

	async updateComment(payload: UpdateCommentPayload): Promise<IResponse<Comment>> {
		const formData = new FormData();
		appendCommentPayload(formData, payload);
		return apiClient.patch<IResponse<Comment>>(`/comments/${payload.commentId}`, formData);
	},

	async deleteComment(commentId: string): Promise<IResponse<void>> {
		return apiClient.delete<IResponse<void>>(`/comments/${commentId}`);
	},

	async addCommentReaction(commentId: string, reactionType: ReactionType): Promise<IResponse<unknown>> {
		return apiClient.post<IResponse<unknown>>(`/comments/${commentId}/reactions`, { reactionType });
	},

	async removeCommentReaction(commentId: string): Promise<IResponse<unknown>> {
		return apiClient.delete<IResponse<unknown>>(`/comments/${commentId}/reactions`);
	},
};
