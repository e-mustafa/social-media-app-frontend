import { IMetadata, IResponse } from '@/shared/types';

export type ChatVisibility = 'public' | 'private' | 'friends';
export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry' | 'dislike';

export interface ChatAttachment {
   id: string;
   url: string;
   resourceType: 'image' | 'video' | 'raw' | 'auto' | string;
}

export interface ChatAuthor {
   _id: string;
   id?: string;
   firstName: string;
   lastName: string;
   username?: string;
   avatar?: {
      id?: string;
      url: string;
   };
   name?: string;
}

export interface Chat {
   _id: string;
   id?: string;
   content: string;
   author: ChatAuthor;
   attachments?: ChatAttachment[];
   isPublished: boolean;
   visibility: ChatVisibility;
   reactionsCount: number;
   commentsCount: number;
   myReaction?: ReactionType | null;
   taggedUsers?: ChatAuthor[];
   createdAt: string;
   updatedAt?: string;
}

export interface CreateChatPayload {
   content: string;
   visibility?: ChatVisibility;
   isPublished?: boolean;
   taggedUsers?: string[];
   attachments?: File[];
}

export interface UpdateChatPayload {
   content?: string;
   visibility?: ChatVisibility;
   isPublished?: boolean;
   taggedUsers?: string[];
   removedAttachmentIds?: string[];
   attachments?: File[];
}

export interface ChatQueryParams {
   page?: number;
   limit?: number;
   order?: 'asc' | 'desc';
   search?: string;
}

export interface PaginatedChatsResponse extends IResponse<Chat[]> {
   totalDocs?: number;
   limit?: number;
   totalPages?: number;
   page?: number;
   pagingCounter?: number;
   hasPrevPage?: boolean;
   hasNextPage?: boolean;
   prevPage?: number | null;
   nextPage?: number | null;
}
