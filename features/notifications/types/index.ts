import { IMetadata, IResponse } from '@/shared/types';

export type NotificationType =
	| 'FRIEND_REQUEST'
	| 'FRIEND_ACCEPTED'
	| 'POST_REACT'
	| 'POST_COMMENT'
	| 'POST_TAGGED'
	| 'COMMENT_REACT'
	| 'COMMENT_REPLAY'
	| 'COMMENT_TAGGED';

export interface NotificationSender {
	_id: string;
	firstName: string;
	lastName: string;
	username?: string;
	avatar?: {
		id?: string;
		url: string;
	};
}

export interface Notification {
	_id: string;
	sendTo: string;
	sendBy: NotificationSender;
	type: NotificationType;
	title: string;
	body: string;
	readAt: string | null;
	requestId?: string;
	postId?: string;
	commentId?: string;
	replyId?: string;
	reactionId?: string;
	createdAt: string;
	updatedAt?: string;
}

export interface NotificationQueryParams {
	page?: number;
	limit?: number;
	order?: 'asc' | 'desc';
	unreadOnly?: boolean;
}

export interface NotificationsResponse extends IResponse<Notification[]> {
	metadata?: IMetadata;
	unread: number;
}

export interface InfiniteNotificationsResponse {
	pages: Array<NotificationsResponse>;
	pageParams: number[];
}

export type UnreadCountResponse = IResponse<number>;

export type MarkAsReadResponse = IResponse<Notification>;

export type DeleteNotificationResponse = IResponse<boolean>;