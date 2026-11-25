export interface FriendUser {
	_id: string;
	id?: string;
	firstName: string;
	lastName: string;
	username?: string;
	avatar?: {
		url: string;
	};
	covers?: {
		url: string;
	}[];
	gender?: string;
}

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface IFriend {
	_id: string;
	sendBy: FriendUser | string;
	sendTo: FriendUser | string;
	status: FriendRequestStatus;
	createdAt: string;
	updatedAt?: string;
}

export interface FriendQueryParams {
	page?: number;
	limit?: number;
	order?: 'asc' | 'desc';
}
