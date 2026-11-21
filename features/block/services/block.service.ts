import { apiClient } from '@/shared/utils/apiClient';
import { IResponse } from '@/shared/types';
import { IBlock, BlockQueryParams } from '../types';

export const blockService = {
	async getBlockedUsers(params?: BlockQueryParams): Promise<IResponse<IBlock[]>> {
		const searchParams = new URLSearchParams();
		if (params?.page) searchParams.append('page', String(params.page));
		if (params?.limit) searchParams.append('limit', String(params.limit));
		if (params?.search) searchParams.append('search', params.search);

		const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
		return apiClient.get<IResponse<IBlock[]>>(`/block${queryString}`);
	},

	async blockUser(userId: string): Promise<IResponse<IBlock>> {
		return apiClient.post<IResponse<IBlock>>(`/block/${userId}`, {});
	},

	async unblockUser(userId: string): Promise<IResponse<boolean>> {
		return apiClient.delete<IResponse<boolean>>(`/block/${userId}`);
	},
};
