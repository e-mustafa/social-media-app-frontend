import { InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { postsService } from '../services/posts.service';
import { PaginatedPostsResponse, ReactionType } from '../types';
import { POSTS_QUERY_KEYS } from './use-posts';

interface ReactionMutationVariables {
	postId: string;
	reactionType: ReactionType | null;
	previousReaction?: ReactionType | null;
}

interface ReactionMutationContext {
	previousFeed?: InfiniteData<PaginatedPostsResponse>;
}

const updateFeedReaction = (
	oldData: InfiniteData<PaginatedPostsResponse> | undefined,
	postId: string,
	nextReaction: ReactionType | null,
	previousReaction?: ReactionType | null,
) => {
	if (!oldData) return oldData;

	return {
		...oldData,
		pages: oldData.pages.map((page) => ({
			...page,
			data: page.data?.map((post) => {
				if (post._id !== postId) return post;

				const hadReaction = Boolean(previousReaction ?? post.myReaction);
				const hasReaction = Boolean(nextReaction);
				const countDelta = hadReaction === hasReaction ? 0 : hasReaction ? 1 : -1;

				return {
					...post,
					myReaction: nextReaction,
					reactionsCount: Math.max((post.reactionsCount || 0) + countDelta, 0),
				};
			}),
		})),
	};
};

export function usePostReactionMutation() {
	const queryClient = useQueryClient();

	return useMutation<unknown, Error, ReactionMutationVariables, ReactionMutationContext>({
		mutationFn: ({ postId, reactionType }) => {
			if (!reactionType) return postsService.removePostReaction(postId);
			return postsService.addPostReaction(postId, reactionType);
		},
		onMutate: async ({ postId, reactionType, previousReaction }) => {
			await queryClient.cancelQueries({ queryKey: POSTS_QUERY_KEYS.all });
			const previousFeed = queryClient.getQueryData<InfiniteData<PaginatedPostsResponse>>(POSTS_QUERY_KEYS.feed({ limit: 10, order: 'desc' }));

			queryClient.setQueryData<InfiniteData<PaginatedPostsResponse>>(
				POSTS_QUERY_KEYS.feed({ limit: 10, order: 'desc' }),
				(oldData) => updateFeedReaction(oldData, postId, reactionType, previousReaction),
			);

			return { previousFeed };
		},
		onError: (error, _variables, context) => {
			if (context?.previousFeed) {
				queryClient.setQueryData(POSTS_QUERY_KEYS.feed({ limit: 10, order: 'desc' }), context.previousFeed);
			}
			toast.error(error.message || 'Failed to update reaction');
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: POSTS_QUERY_KEYS.all });
		},
	});
}
