export interface BlockedUser {
	_id: string;
	id?: string;
	firstName: string;
	lastName: string;
	username?: string;
	avatar?: {
		url: string;
	};
}

export interface IBlock {
	_id: string;
	blocker: string;
	blocked: BlockedUser | string;
	createdAt: string;
	updatedAt?: string;
}

export interface BlockQueryParams {
	page?: number;
	limit?: number;
	search?: string;
}
