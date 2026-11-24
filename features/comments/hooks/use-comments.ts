import { ReactionType } from '@/features/posts/types';
import { InfiniteData, QueryKey, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { commentsService } from '../services/comments.service';
import { Comment, CommentQueryParams, CommentsResponse, CreateCommentPayload, UpdateCommentPayload } from '../types';

export const COMMENTS_QUERY_KEYS = {
	all: ['comments'] as const,
	post: (postId: string, params?: CommentQueryParams) => ['comments', 'post', postId, params] as const,
	replies: (commentId: string, params?: CommentQueryParams) => ['comments', 'replies', commentId, params] as const,
};

const COMMENT_REACTION_MUTATION_KEY = ['comments', 'reaction'] as const;

interface CommentReactionVariables {
	commentId: string;
	reactionType: ReactionType | null;
}

interface CommentReactionContext {
	previousQueries: Array<[QueryKey, CommentsCacheData | undefined]>;
}

type CommentsCacheData = CommentsResponse | InfiniteData<CommentsResponse>;

const isInfiniteCommentsData = (data: CommentsCacheData): data is InfiniteData<CommentsResponse> => {
	return 'pages' in data && Array.isArray(data.pages);
};

const updateCommentsList = (
	comments: Comment[] | undefined,
	commentId: string,
	updater: (comment: Comment) => Comment,
): Comment[] | undefined => {
	if (!comments) return comments;

	return comments.map((comment) => (comment._id === commentId ? updater(comment) : comment));
};

const updateCommentInCache = (
	response: CommentsCacheData | undefined,
	commentId: string,
	updater: (comment: Comment) => Comment,
): CommentsCacheData | undefined => {
	if (!response) return response;

	if (isInfiniteCommentsData(response)) {
		return {
			...response,
			pages: response.pages.map((page) => ({
				...page,
				data: updateCommentsList(page.data, commentId, updater),
			})),
		};
	}

	return {
		...response,
		data: updateCommentsList(response.data, commentId, updater),
	};
};

const findCommentInCache = (response: CommentsCacheData | undefined, commentId: string): Comment | undefined => {
	if (!response) return undefined;

	const pages = isInfiniteCommentsData(response) ? response.pages : [response];

	for (const page of pages) {
		const comment = page.data?.find((item) => item._id === commentId);

		if (comment) return comment;
	}

	return undefined;
};

const applyReactionToComment = (comment: Comment, nextReaction: ReactionType | null): Comment => {
	const previousReaction = comment.userReaction ?? null;

	const hadReaction = Boolean(previousReaction);
	const hasReaction = Boolean(nextReaction);

	const countDelta = hadReaction === hasReaction ? 0 : hasReaction ? 1 : -1;

	return {
		...comment,
		userReaction: nextReaction,
		reactionsCount: Math.max((comment.reactionsCount ?? 0) + countDelta, 0),
	};
};

const restoreCommentReaction = (
	currentData: CommentsCacheData | undefined,
	previousData: CommentsCacheData | undefined,
	commentId: string,
): CommentsCacheData | undefined => {
	const previousComment = findCommentInCache(previousData, commentId);

	if (!previousComment) return currentData;

	return updateCommentInCache(currentData, commentId, (comment) => ({
		...comment,
		userReaction: previousComment.userReaction ?? null,
		reactionsCount: previousComment.reactionsCount ?? 0,
	}));
};

export function usePostComments(postId: string, params?: CommentQueryParams, options?: { enabled?: boolean }) {
	return useInfiniteQuery({
		queryKey: COMMENTS_QUERY_KEYS.post(postId, params),
		queryFn: ({ pageParam = 1 }) => commentsService.getPostComments(postId, { ...params, page: pageParam }),
		enabled: options?.enabled ?? Boolean(postId),
		initialPageParam: 1,
		getNextPageParam: (lastPage) => {
			const metadata = lastPage.metadata;

			return metadata?.hasNext ? (metadata.page || 1) + 1 : undefined;
		},
	});
}

export function useCommentReplies(commentId: string, params?: CommentQueryParams, enabled = true) {
	return useQuery({
		queryKey: COMMENTS_QUERY_KEYS.replies(commentId, params),
		queryFn: () => commentsService.getCommentReplies(commentId, params),
		enabled: Boolean(commentId) && enabled,
	});
}

export function useCreateComment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: CreateCommentPayload) => {
			if (payload.replyToCommentId) {
				return commentsService.createReply(payload);
			}

			return commentsService.createComment(payload);
		},

		onSuccess: (res, payload) => {
			toast.success(res.message || 'Comment added successfully');

			queryClient.invalidateQueries({
				queryKey: COMMENTS_QUERY_KEYS.all,
			});

			if (payload.replyToCommentId) {
				queryClient.invalidateQueries({
					queryKey: COMMENTS_QUERY_KEYS.replies(payload.replyToCommentId),
				});
			}
		},

		onError: (error: Error) => {
			toast.error(error.message || 'Failed to add comment');
		},
	});
}

export function useUpdateComment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: UpdateCommentPayload) => commentsService.updateComment(payload),

		onSuccess: (res) => {
			toast.success(res.message || 'Comment updated successfully');

			queryClient.invalidateQueries({
				queryKey: COMMENTS_QUERY_KEYS.all,
			});
		},

		onError: (error: Error) => {
			toast.error(error.message || 'Failed to update comment');
		},
	});
}

export function useDeleteComment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (commentId: string) => commentsService.deleteComment(commentId),

		onSuccess: (res) => {
			toast.success(res.message || 'Comment deleted successfully');

			queryClient.invalidateQueries({
				queryKey: COMMENTS_QUERY_KEYS.all,
			});
		},

		onError: (error: Error) => {
			toast.error(error.message || 'Failed to delete comment');
		},
	});
}

export function useCommentReaction() {
	const queryClient = useQueryClient();

	return useMutation<unknown, Error, CommentReactionVariables, CommentReactionContext>({
		mutationKey: COMMENT_REACTION_MUTATION_KEY,

		mutationFn: ({ commentId, reactionType }) => {
			if (!reactionType) {
				return commentsService.removeCommentReaction(commentId);
			}

			return commentsService.addCommentReaction(commentId, reactionType);
		},

		onMutate: async ({ commentId, reactionType }) => {
			await queryClient.cancelQueries({
				queryKey: COMMENTS_QUERY_KEYS.all,
			});

			const previousQueries = queryClient.getQueriesData<CommentsCacheData>({
				queryKey: COMMENTS_QUERY_KEYS.all,
			});

			previousQueries.forEach(([queryKey]) => {
				queryClient.setQueryData<CommentsCacheData>(queryKey, (oldData) =>
					updateCommentInCache(oldData, commentId, (comment) => applyReactionToComment(comment, reactionType)),
				);
			});

			return { previousQueries };
		},

		onError: (error, variables, context) => {
			context?.previousQueries.forEach(([queryKey, previousData]) => {
				queryClient.setQueryData<CommentsCacheData>(queryKey, (currentData) =>
					restoreCommentReaction(currentData, previousData, variables.commentId),
				);
			});

			toast.error(error.message || 'Failed to update reaction');
		},

		onSettled: () => {
			// Refetch only after all concurrent reaction mutations have settled.
			if (
				queryClient.isMutating({
					mutationKey: COMMENT_REACTION_MUTATION_KEY,
				}) === 1
			) {
				return queryClient.invalidateQueries({
					queryKey: COMMENTS_QUERY_KEYS.all,
				});
			}
		},
	});
}
