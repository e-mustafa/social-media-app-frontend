import { IMetadata, IResponse } from '@/shared/types';

export type MessageVisibility = 'public' | 'private' | 'friends';
export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry' | 'dislike';

export interface MessageAttachment {
   id: string;
   url: string;
   resourceType: 'image' | 'video' | 'raw' | 'auto' | string;
}

export interface MessageAuthor {
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

export interface Message {
   _id: string;
   id?: string;
   content: string;
   author: MessageAuthor;
   attachments?: MessageAttachment[];
   isPublished: boolean;
   visibility: MessageVisibility;
   reactionsCount: number;
   commentsCount: number;
   myReaction?: ReactionType | null;
   taggedUsers?: MessageAuthor[];
   createdAt: string;
   updatedAt?: string;
}

export interface CreateMessagePayload {
   content: string;
   visibility?: MessageVisibility;
   isPublished?: boolean;
   taggedUsers?: string[];
   attachments?: File[];
}

export interface UpdateMessagePayload {
   content?: string;
   visibility?: MessageVisibility;
   isPublished?: boolean;
   taggedUsers?: string[];
   removedAttachmentIds?: string[];
   attachments?: File[];
}

export interface MessageQueryParams {
   page?: number;
   limit?: number;
   order?: 'asc' | 'desc';
   search?: string;
}

export interface PaginatedMessagesResponse extends IResponse<Message[]> {
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
