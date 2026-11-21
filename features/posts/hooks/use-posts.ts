import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { postsService } from '../services/posts.service';
import { CreatePostPayload, PostQueryParams, UpdatePostPayload } from '../types';

export const POSTS_QUERY_KEYS = {
	all: ['posts'] as const,
	feed: (params?: Omit<PostQueryParams, 'page'>, isAuthed?: boolean) =>
		['posts', 'feed', { ...params, isAuthed }] as const,
	mine: (params?: PostQueryParams) => ['posts', 'mine', params] as const,
	user: (userId: string, params?: PostQueryParams) => ['posts', 'user', userId, params] as const,
	detail: (postId: string) => ['posts', 'detail', postId] as const,
};

export function useFeedPosts(
	params?: Omit<PostQueryParams, 'page'>,
	options?: { enabled?: boolean; isAuthed?: boolean }
) {
	return useInfiniteQuery({
		queryKey: POSTS_QUERY_KEYS.feed(params, options?.isAuthed),
		queryFn: ({ pageParam = 1 }) =>
			postsService.getFeedPosts({
				...params,
				page: pageParam,
			}),
		enabled: options?.enabled ?? true,
		initialPageParam: 1,
		getNextPageParam: (lastPage) => {
			if (lastPage.hasNextPage && lastPage.page) {
				return lastPage.page + 1;
			}
			return undefined;
		},
	});
}

export function useUserPosts(userId: string, params?: PostQueryParams) {
	return useQuery({
		queryKey: POSTS_QUERY_KEYS.user(userId, params),
		queryFn: () => postsService.getUserPosts(userId, params),
		enabled: !!userId,
	});
}

export function useUserTaggedPosts(userId: string, params?: PostQueryParams) {
	const queryClient = useQueryClient();
	return useQuery({
		queryKey: ['posts', 'user', 'tagged', userId, params],
		queryFn: async () => {
			// Fetch all feed/public posts and filter where the user is tagged, or search from feed query
			const response = await postsService.getFeedPosts({ limit: 100 });
			const tagged = (response.data || []).filter((post) =>
				post.taggedUsers?.some((u) => u._id === userId || u.id === userId),
			);
			return { ...response, data: tagged };
		},
		enabled: !!userId,
	});
}

export function useMyPosts(params?: PostQueryParams) {
	return useQuery({
		queryKey: POSTS_QUERY_KEYS.mine(params),
		queryFn: () => postsService.getMyPosts(params),
	});
}

export function usePost(postId: string) {
	return useQuery({
		queryKey: POSTS_QUERY_KEYS.detail(postId),
		queryFn: () => postsService.getPostById(postId),
		enabled: !!postId,
	});
}

export function useCreatePost() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: CreatePostPayload) => postsService.createPost(payload),
		onSuccess: (res) => {
			toast.success(res.message || 'Post created successfully');
			queryClient.invalidateQueries({ queryKey: POSTS_QUERY_KEYS.all });
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to create post');
		},
	});
}

export function useUpdatePost() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ postId, payload }: { postId: string; payload: UpdatePostPayload }) =>
			postsService.updatePost(postId, payload),
		onSuccess: (res) => {
			toast.success(res.message || 'Post updated successfully');
			queryClient.invalidateQueries({ queryKey: POSTS_QUERY_KEYS.all });
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to update post');
		},
	});
}

export function useDeletePost() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (postId: string) => postsService.deletePost(postId),
		onSuccess: (res) => {
			toast.success(res.message || 'Post deleted successfully');
			queryClient.invalidateQueries({ queryKey: POSTS_QUERY_KEYS.all });
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to delete post');
		},
	});
}
