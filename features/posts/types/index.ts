import { IResponse } from '@/shared/types';

export type PostVisibility = 'public' | 'private' | 'friends';
export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry' | 'dislike';

export interface PostAttachment {
	id: string;
	url: string;
	resourceType: 'image' | 'video' | 'raw' | 'auto' | string;
}

export interface PostAuthor {
	_id: string;
	id?: string;
	firstName: string;
	lastName: string;
	username?: string;
	avatar?: {
		id?: string;
		url: string;
	};
}

export interface Post {
	_id: string;
	id?: string;
	content: string;
	author: PostAuthor;
	attachments?: PostAttachment[];
	isPublished: boolean;
	visibility: PostVisibility;
	reactionsCount: number;
	commentsCount: number;
	myReaction?: ReactionType | null;
	taggedUsers?: PostAuthor[];
	createdAt: string;
	updatedAt?: string;
}

export interface CreatePostPayload {
	content: string;
	visibility?: PostVisibility;
	isPublished?: boolean;
	taggedUsers?: string[];
	attachments?: File[];
}

export interface UpdatePostPayload {
	content?: string;
	visibility?: PostVisibility;
	isPublished?: boolean;
	taggedUsers?: string[];
	removedAttachmentIds?: string[];
	attachments?: File[];
}

export interface PostQueryParams {
	page?: number;
	limit?: number;
	order?: 'asc' | 'desc';
	search?: string;
}

export interface PaginatedPostsResponse extends IResponse<Post[]> {
	total?: number;
	limit?: number;
	totalPages?: number;
	page?: number;
	pagingCounter?: number;
	hasPrevPage?: boolean;
	hasNextPage?: boolean;
	prevPage?: number | null;
	nextPage?: number | null;
}
