import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { userSearchService, UserSearchParams, PaginatedUsersResponse } from '../services/user-search.service';
import { FriendUser } from '@/features/friends/types';

export const USER_SEARCH_QUERY_KEYS = {
	all: ['user-search'] as const,
	search: (params?: UserSearchParams) => ['user-search', 'search', params] as const,
	user: (userId: string) => ['user-search', 'user', userId] as const,
};

export function useSearchUsers(params?: UserSearchParams) {
	const searchQuery = params?.search?.trim();

	return useInfiniteQuery({
		queryKey: USER_SEARCH_QUERY_KEYS.search(params),
		queryFn: async ({ pageParam = 1 }) => {
			if (!searchQuery || searchQuery.length < 1) {
				const emptyResponse: PaginatedUsersResponse = {
					success: true,
					data: [],
					message: '',
					page: 1,
					limit: 10,
					total: 0,
					totalPages: 0,
					hasNext: false,
					hasPrev: false,
				};
				return emptyResponse;
			}
			return userSearchService.searchUsers({ ...params, page: pageParam });
		},
		getNextPageParam: (lastPage) => {
			const hasNext = lastPage.metadata?.hasNext ?? false;
			return hasNext ? (lastPage.metadata?.page ?? 1) + 1 : undefined;
		},
		initialPageParam: 1,
		enabled: Boolean(searchQuery && searchQuery.length >= 1),
	});
}

export function useSearchFriends(params?: UserSearchParams) {
	return useInfiniteQuery({
		queryKey: USER_SEARCH_QUERY_KEYS.search({ ...params, search: params?.search }),
		queryFn: async ({ pageParam = 1 }) => {
			const searchQuery = params?.search?.trim();
			if (!searchQuery || searchQuery.length < 1) {
				const emptyResponse: PaginatedUsersResponse = {
					success: true,
					data: [],
					message: '',
					page: 1,
					limit: 10,
					total: 0,
					totalPages: 0,
					hasNext: false,
					hasPrev: false,
				};
				return emptyResponse;
			}
			return userSearchService.searchUsers({ ...params, page: pageParam });
		},
		getNextPageParam: (lastPage) => {
			const hasNext = lastPage.metadata?.hasNext ?? false;
			return hasNext ? (lastPage.metadata?.page ?? 1) + 1 : undefined;
		},
		initialPageParam: 1,
		enabled: Boolean(params?.search && params.search.length >= 1),
	});
}

export function useUserById(userId?: string) {
	return useQuery({
		queryKey: USER_SEARCH_QUERY_KEYS.user(userId || ''),
		queryFn: () => userSearchService.getUserById(userId!),
		enabled: Boolean(userId),
	});
}

export function getFlattenedUsers(data: PaginatedUsersResponse[] | undefined): FriendUser[] {
	if (!data) return [];
	return data.flatMap((page) => page.data || []);
}