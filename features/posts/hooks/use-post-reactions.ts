import { InfiniteData, QueryKey, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { postsService } from '../services/posts.service';
import { PaginatedPostsResponse, Post, ReactionType } from '../types';
import { POSTS_QUERY_KEYS } from './use-posts';

export const POST_REACTION_MUTATION_KEY = ['posts', 'reaction'] as const;

interface ReactionMutationVariables {
	postId: string;
	reactionType: ReactionType | null;
}

interface ReactionSnapshot {
	myReaction: Post['myReaction'];
	reactionsCount: Post['reactionsCount'];
}

interface ReactionMutationContext {
	previousQueries: Array<[QueryKey, ReactionSnapshot]>;
}

type InfinitePostsData = InfiniteData<PaginatedPostsResponse>;

const isRecord = (value: unknown): value is Record<string, unknown> => {
	return typeof value === 'object' && value !== null;
};

const isPost = (value: unknown): value is Post => {
	return isRecord(value) && typeof value._id === 'string';
};

const isInfinitePostsData = (value: unknown): value is InfinitePostsData => {
	return isRecord(value) && Array.isArray(value.pages);
};

const findPostInData = (data: unknown, postId: string): Post | undefined => {
	if (isPost(data)) {
		return data._id === postId ? data : undefined;
	}

	if (!isRecord(data)) return undefined;

	if (Array.isArray(data.pages)) {
		for (const page of data.pages) {
			const post = findPostInData(page, postId);

			if (post) return post;
		}

		return undefined;
	}

	if (Array.isArray(data.data)) {
		return data.data.find((item): item is Post => isPost(item) && item._id === postId);
	}

	if (isRecord(data.data)) {
		return findPostInData(data.data, postId);
	}

	return undefined;
};

const applyReactionToPost = (post: Post, nextReaction: ReactionType | null): Post => {
	const previousReaction = post.myReaction ?? null;

	const hadReaction = Boolean(previousReaction);
	const hasReaction = Boolean(nextReaction);

	const countDelta = hadReaction === hasReaction ? 0 : hasReaction ? 1 : -1;

	return {
		...post,
		myReaction: nextReaction,
		reactionsCount: Math.max((post.reactionsCount ?? 0) + countDelta, 0),
	};
};

const updatePostInData = (data: unknown, postId: string, updater: (post: Post) => Post): unknown => {
	if (isPost(data)) {
		return data._id === postId ? updater(data) : data;
	}

	if (!isRecord(data)) return data;

	if (Array.isArray(data.pages)) {
		return {
			...data,
			pages: data.pages.map((page) => updatePostInData(page, postId, updater)),
		};
	}

	if (Array.isArray(data.data)) {
		return {
			...data,
			data: data.data.map((post) => (isPost(post) && post._id === postId ? updater(post) : post)),
		};
	}

	if (isRecord(data.data)) {
		return {
			...data,
			data: updatePostInData(data.data, postId, updater),
		};
	}

	return data;
};

const restoreReactionToPost = (post: Post, snapshot: ReactionSnapshot): Post => ({
	...post,
	myReaction: snapshot.myReaction,
	reactionsCount: snapshot.reactionsCount,
});

export function usePostReactionMutation() {
	const queryClient = useQueryClient();

	return useMutation<unknown, Error, ReactionMutationVariables, ReactionMutationContext>({
		mutationKey: POST_REACTION_MUTATION_KEY,

		mutationFn: ({ postId, reactionType }) => {
			if (!reactionType) {
				return postsService.removePostReaction(postId);
			}

			return postsService.addPostReaction(postId, reactionType);
		},

		onMutate: async ({ postId, reactionType }) => {
			await queryClient.cancelQueries({
				queryKey: POSTS_QUERY_KEYS.all,
			});

			const previousQueries = queryClient.getQueriesData({
				queryKey: POSTS_QUERY_KEYS.all,
			});

			const snapshots: ReactionMutationContext['previousQueries'] = [];

			previousQueries.forEach(([queryKey, oldData]) => {
				const previousPost = findPostInData(oldData, postId);

				if (!previousPost) return;

				snapshots.push([
					queryKey,
					{
						myReaction: previousPost.myReaction,
						reactionsCount: previousPost.reactionsCount,
					},
				]);

				queryClient.setQueryData(queryKey, (currentData: unknown) =>
					updatePostInData(currentData, postId, (post) => applyReactionToPost(post, reactionType)),
				);
			});

			return {
				previousQueries: snapshots,
			};
		},

		onError: (error, variables, context) => {
			context?.previousQueries.forEach(([queryKey, snapshot]) => {
				queryClient.setQueryData(queryKey, (currentData: unknown) =>
					updatePostInData(currentData, variables.postId, (post) => restoreReactionToPost(post, snapshot)),
				);
			});

			toast.error(error.message || 'Failed to update reaction');
		},

		onSettled: () => {
			// Wait until the last concurrent reaction mutation settles.
			if (
				queryClient.isMutating({
					mutationKey: POST_REACTION_MUTATION_KEY,
				}) === 1
			) {
				return queryClient.invalidateQueries({
					queryKey: POSTS_QUERY_KEYS.all,
				});
			}
		},
	});
}
