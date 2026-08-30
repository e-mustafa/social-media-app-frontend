import { IMetadata, IResponse } from '@/shared/types';
import { PostAttachment, PostAuthor, ReactionType } from '@/modules/posts/types';

export interface Comment {
	_id: string;
	id?: string;
	content: string;
	author: PostAuthor;
	postId: string;
	parentId: string | null;
	attachments?: PostAttachment[];
	voiceNote?: PostAttachment | null;
	reactionsCount: number;
	repliesCount: number;
	userReaction?: ReactionType | null;
	taggedUsers?: PostAuthor[];
	editedAt?: string | null;
	createdAt: string;
	updatedAt?: string;
}

export interface CommentQueryParams {
	page?: number;
	limit?: number;
	order?: 'asc' | 'desc';
}

export interface CreateCommentPayload {
	postId: string;
	content: string;
	replyToCommentId?: string;
	taggedUsers?: string[];
	attachments?: File[];
}

export interface UpdateCommentPayload {
	commentId: string;
	content?: string;
	taggedUsers?: string[];
	removedAttachmentIds?: string[];
	attachments?: File[];
}

export interface CommentsResponse extends IResponse<Comment[]> {
	metadata?: IMetadata;
}
