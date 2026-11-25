import { apiClient } from '@/shared/utils/apiClient';
import { IResponse } from '@/shared/types';
import { IFriend, FriendQueryParams } from '../types';

export const friendsService = {
	async getMyFriends(params?: FriendQueryParams): Promise<IResponse<IFriend[]>> {
		const searchParams = new URLSearchParams();
		if (params?.page) searchParams.append('page', String(params.page));
		if (params?.limit) searchParams.append('limit', String(params.limit));
		if (params?.order) searchParams.append('order', params.order);

		const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
		return apiClient.get<IResponse<IFriend[]>>(`/friends${queryString}`);
	},

	async getReceivedRequests(params?: FriendQueryParams): Promise<IResponse<IFriend[]>> {
		const searchParams = new URLSearchParams();
		if (params?.page) searchParams.append('page', String(params.page));
		if (params?.limit) searchParams.append('limit', String(params.limit));
		if (params?.order) searchParams.append('order', params.order);

		const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
		return apiClient.get<IResponse<IFriend[]>>(`/friends/received${queryString}`);
	},

	async getSentRequests(params?: FriendQueryParams): Promise<IResponse<IFriend[]>> {
		const searchParams = new URLSearchParams();
		if (params?.page) searchParams.append('page', String(params.page));
		if (params?.limit) searchParams.append('limit', String(params.limit));
		if (params?.order) searchParams.append('order', params.order);

		const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
		return apiClient.get<IResponse<IFriend[]>>(`/friends/sent${queryString}`);
	},

	async sendFriendRequest(userId: string): Promise<IResponse<IFriend>> {
		return apiClient.post<IResponse<IFriend>>(`/friends/request/${userId}`, {});
	},

	async deleteFriendRequest(requestId: string): Promise<IResponse<void>> {
		return apiClient.delete<IResponse<void>>(`/friends/request/${requestId}`);
	},

	async acceptFriendRequest(requestId: string): Promise<IResponse<IFriend>> {
		return apiClient.patch<IResponse<IFriend>>(`/friends/request/accept/${requestId}`, {});
	},

	async rejectFriendRequest(requestId: string): Promise<IResponse<void>> {
		return apiClient.patch<IResponse<void>>(`/friends/request/reject/${requestId}`, {});
	},

	async unfriendUser(friendId: string): Promise<IResponse<void>> {
		return apiClient.delete<IResponse<void>>(`/friends/unfriend/${friendId}`);
	}
};
