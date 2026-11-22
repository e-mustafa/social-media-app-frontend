import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { friendsService } from '../services/friends.service';
import { FriendQueryParams, IFriend } from '../types';
import { IResponse } from '@/shared/types';

export const FRIENDS_QUERY_KEYS = {
	all: ['friends'] as const,
	list: (params?: FriendQueryParams) => ['friends', 'list', params] as const,
	received: (params?: FriendQueryParams) => ['friends', 'received', params] as const,
	sent: (params?: FriendQueryParams) => ['friends', 'sent', params] as const,
};

export function useMyFriends(params?: FriendQueryParams) {
	return useInfiniteQuery({
		queryKey: FRIENDS_QUERY_KEYS.list(params),
		queryFn: ({ pageParam = 1 }) =>
			friendsService.getMyFriends({ ...params, page: pageParam }),
		initialPageParam: 1,
		getNextPageParam: (lastPage) => {
			const hasNext = lastPage.metadata?.hasNext ?? false;
			return hasNext ? (lastPage.metadata?.page ?? 1) + 1 : undefined;
		},
	});
}

export function useReceivedFriendRequests(params?: FriendQueryParams) {
	return useInfiniteQuery({
		queryKey: FRIENDS_QUERY_KEYS.received(params),
		queryFn: ({ pageParam = 1 }) =>
			friendsService.getReceivedRequests({ ...params, page: pageParam }),
		initialPageParam: 1,
		getNextPageParam: (lastPage) => {
			const hasNext = lastPage.metadata?.hasNext ?? false;
			return hasNext ? (lastPage.metadata?.page ?? 1) + 1 : undefined;
		},
	});
}

export function useSentFriendRequests(params?: FriendQueryParams) {
	return useInfiniteQuery({
		queryKey: FRIENDS_QUERY_KEYS.sent(params),
		queryFn: ({ pageParam = 1 }) =>
			friendsService.getSentRequests({ ...params, page: pageParam }),
		initialPageParam: 1,
		getNextPageParam: (lastPage) => {
			const hasNext = lastPage.metadata?.hasNext ?? false;
			return hasNext ? (lastPage.metadata?.page ?? 1) + 1 : undefined;
		},
	});
}

export function useSendFriendRequest() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (userId: string) => friendsService.sendFriendRequest(userId),
		onSuccess: (res) => {
			toast.success(res.message || 'Friend request sent');
			queryClient.invalidateQueries({ queryKey: FRIENDS_QUERY_KEYS.all });
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to send friend request');
		},
	});
}

export function useAcceptFriendRequest() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (requestId: string) => friendsService.acceptFriendRequest(requestId),
		onMutate: async (requestId: string) => {
			await queryClient.cancelQueries({ queryKey: FRIENDS_QUERY_KEYS.all });

			const previousReceived = queryClient.getQueryData<IResponse<IFriend[]>>(FRIENDS_QUERY_KEYS.received());

			if (previousReceived?.data) {
				queryClient.setQueryData<IResponse<IFriend[]>>(FRIENDS_QUERY_KEYS.received(), {
					...previousReceived,
					data: previousReceived.data.filter((req) => req._id !== requestId),
				});
			}

			return { previousReceived };
		},
		onSuccess: (res) => {
			toast.success(res.message || 'Friend request accepted');
		},
		onError: (error: Error, _requestId, context) => {
			if (context?.previousReceived) {
				queryClient.setQueryData(FRIENDS_QUERY_KEYS.received(), context.previousReceived);
			}
			toast.error(error.message || 'Failed to accept friend request');
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: FRIENDS_QUERY_KEYS.all });
		},
	});
}

export function useRejectFriendRequest() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (requestId: string) => friendsService.rejectFriendRequest(requestId),
		onMutate: async (requestId: string) => {
			await queryClient.cancelQueries({ queryKey: FRIENDS_QUERY_KEYS.all });

			const previousReceived = queryClient.getQueryData<IResponse<IFriend[]>>(FRIENDS_QUERY_KEYS.received());

			if (previousReceived?.data) {
				queryClient.setQueryData<IResponse<IFriend[]>>(FRIENDS_QUERY_KEYS.received(), {
					...previousReceived,
					data: previousReceived.data.filter((req) => req._id !== requestId),
				});
			}

			return { previousReceived };
		},
		onSuccess: (res) => {
			toast.success(res.message || 'Friend request rejected');
		},
		onError: (error: Error, _requestId, context) => {
			if (context?.previousReceived) {
				queryClient.setQueryData(FRIENDS_QUERY_KEYS.received(), context.previousReceived);
			}
			toast.error(error.message || 'Failed to reject friend request');
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: FRIENDS_QUERY_KEYS.all });
		},
	});
}

export function useCancelFriendRequest() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (requestId: string) => friendsService.deleteFriendRequest(requestId),
		onMutate: async (requestId: string) => {
			await queryClient.cancelQueries({ queryKey: FRIENDS_QUERY_KEYS.all });

			const previousSent = queryClient.getQueryData<IResponse<IFriend[]>>(FRIENDS_QUERY_KEYS.sent());

			if (previousSent?.data) {
				queryClient.setQueryData<IResponse<IFriend[]>>(FRIENDS_QUERY_KEYS.sent(), {
					...previousSent,
					data: previousSent.data.filter((req) => req._id !== requestId),
				});
			}

			return { previousSent };
		},
		onSuccess: (res) => {
			toast.success(res.message || 'Friend request cancelled');
		},
		onError: (error: Error, _requestId, context) => {
			if (context?.previousSent) {
				queryClient.setQueryData(FRIENDS_QUERY_KEYS.sent(), context.previousSent);
			}
			toast.error(error.message || 'Failed to cancel friend request');
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: FRIENDS_QUERY_KEYS.all });
		},
	});
}

export function useUnfriendFriendRequest() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (friendId: string) => friendsService.unfriendUser(friendId),
		onMutate: async (friendId: string) => {
			await queryClient.cancelQueries({ queryKey: FRIENDS_QUERY_KEYS.all });

			const previousFriends = queryClient.getQueryData<IResponse<IFriend[]>>(FRIENDS_QUERY_KEYS.list());

			if (previousFriends?.data) {
				queryClient.setQueryData<IResponse<IFriend[]>>(FRIENDS_QUERY_KEYS.list(), {
					...previousFriends,
					data: previousFriends.data.filter(
						(f) =>
							(typeof f.sendBy === 'object' && f.sendBy._id !== friendId) &&
							(typeof f.sendTo === 'object' && f.sendTo._id !== friendId),
					),
				});
			}

			return { previousFriends };
		},
		onSuccess: (res) => {
			toast.success(res.message || 'Friend removed');
		},
		onError: (error: Error, _friendId, context) => {
			if (context?.previousFriends) {
				queryClient.setQueryData(FRIENDS_QUERY_KEYS.list(), context.previousFriends);
			}
			toast.error(error.message || 'Failed to remove friend');
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: FRIENDS_QUERY_KEYS.all });
		},
	});
}