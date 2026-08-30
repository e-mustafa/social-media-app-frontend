import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { blockService } from '../services/block.service';
import { BlockQueryParams } from '../types';
import { FRIENDS_QUERY_KEYS } from '@/modules/friends/hooks/use-friends';

export const BLOCK_QUERY_KEYS = {
	all: ['block'] as const,
	list: (params?: BlockQueryParams) => ['block', 'list', params] as const,
};

export function useBlockedUsers(params?: BlockQueryParams) {
	return useQuery({
		queryKey: BLOCK_QUERY_KEYS.list(params),
		queryFn: () => blockService.getBlockedUsers(params),
	});
}

export function useBlockUser() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (userId: string) => blockService.blockUser(userId),
		onSuccess: (res) => {
			toast.success(res.message || 'User blocked successfully');
			queryClient.invalidateQueries({ queryKey: BLOCK_QUERY_KEYS.all });
			queryClient.invalidateQueries({ queryKey: FRIENDS_QUERY_KEYS.all });
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to block user');
		},
	});
}

export function useUnblockUser() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (userId: string) => blockService.unblockUser(userId),
		onSuccess: (res) => {
			toast.success(res.message || 'User unblocked successfully');
			queryClient.invalidateQueries({ queryKey: BLOCK_QUERY_KEYS.all });
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to unblock user');
		},
	});
}
