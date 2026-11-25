import { apiClient } from '@/shared/utils/apiClient';
import { IResponse } from '@/shared/types';
import { FriendUser, FriendQueryParams } from '@/features/friends/types';

export interface UserSearchParams extends FriendQueryParams {
	search?: string;
}

export interface PaginatedUsersResponse extends IResponse<FriendUser[]> {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
}

export const userSearchService = {
	/**
	 * GET /api/users
	 * Search users by name/username (excludes blocked users and self)
	 */
	async searchUsers(params?: UserSearchParams): Promise<PaginatedUsersResponse> {
		const searchParams = new URLSearchParams();
		if (params?.page) searchParams.append('page', String(params.page));
		if (params?.limit) searchParams.append('limit', String(params.limit));
		if (params?.order) searchParams.append('order', params.order);
		if (params?.search) searchParams.append('search', params.search);

		const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
		return apiClient.get<PaginatedUsersResponse>(`/users${queryString}`);
	},

	/**
	 * GET /api/users/:userId
	 * Get single user profile
	 */
	async getUserById(userId: string): Promise<IResponse<FriendUser>> {
		return apiClient.get<IResponse<FriendUser>>(`/users/${userId}`);
	},
};