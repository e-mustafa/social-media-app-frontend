import { ReactionType } from '@/features/posts/types';
import { InfiniteData, useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { commentsService } from '../services/comments.service';
import { Comment, CommentQueryParams, CommentsResponse, CreateCommentPayload, UpdateCommentPayload } from '../types';

export const COMMENTS_QUERY_KEYS = {
	all: ['comments'] as const,
	post: (postId: string, params?: CommentQueryParams) => ['comments', 'post', postId, params] as const,
	replies: (commentId: string, params?: CommentQueryParams) => ['comments', 'replies', commentId, params] as const,
};

interface CommentReactionVariables {
	commentId: string;
	reactionType: ReactionType | null;
	previousReaction?: ReactionType | null;
}

const updateCommentReaction = (
	response: CommentsResponse | InfiniteData<CommentsResponse> | undefined,
	commentId: string,
	nextReaction: ReactionType | null,
	previousReaction?: ReactionType | null,
) => {
	if (!response) return response;

	const updateComments = (comments: Comment[] | undefined): Comment[] | undefined => {
		if (!comments) return comments;
		return comments.map((comment) => {
			if (comment._id !== commentId) return comment;

			const hadReaction = Boolean(previousReaction ?? comment.userReaction);
			const hasReaction = Boolean(nextReaction);
			const countDelta = hadReaction === hasReaction ? 0 : hasReaction ? 1 : -1;

			return {
				...comment,
				userReaction: nextReaction,
				reactionsCount: Math.max((comment.reactionsCount || 0) + countDelta, 0),
			};
		});
	};

	if ('pages' in response) {
		return {
			...response,
			pages: response.pages.map((page) => ({
				...page,
				data: updateComments(page.data),
			})),
		};
	}

	return {
		...response,
		data: updateComments(response.data),
	};
};

export function usePostComments(postId: string, params?: CommentQueryParams, options?: { enabled?: boolean }) {
	return useInfiniteQuery({
		queryKey: COMMENTS_QUERY_KEYS.post(postId, params),
		queryFn: ({ pageParam = 1 }) => commentsService.getPostComments(postId, { ...params, page: pageParam }),
		enabled: options?.enabled ?? !!postId,
		initialPageParam: 1,
		getNextPageParam: (lastPage) => {
			const metadata = lastPage.metadata;
			return metadata?.hasNext ? (metadata?.page || 1) + 1 : undefined;
		},
	});
}

export function useCommentReplies(commentId: string, params?: CommentQueryParams, enabled = true) {
	return useQuery({
		queryKey: COMMENTS_QUERY_KEYS.replies(commentId, params),
		queryFn: () => commentsService.getCommentReplies(commentId, params),
		enabled: !!commentId && enabled,
	});
}

export function useCreateComment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: CreateCommentPayload) => {
			if (payload.replyToCommentId) return commentsService.createReply(payload);
			return commentsService.createComment(payload);
		},
		onSuccess: (res, payload) => {
			toast.success(res.message || 'Comment added successfully');
			queryClient.invalidateQueries({ queryKey: COMMENTS_QUERY_KEYS.all });
			if (payload.replyToCommentId) {
				queryClient.invalidateQueries({ queryKey: COMMENTS_QUERY_KEYS.replies(payload.replyToCommentId) });
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
			queryClient.invalidateQueries({ queryKey: COMMENTS_QUERY_KEYS.all });
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
			queryClient.invalidateQueries({ queryKey: COMMENTS_QUERY_KEYS.all });
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to delete comment');
		},
	});
}

export function useCommentReaction() {
	const queryClient = useQueryClient();

	return useMutation<
		unknown,
		Error,
		CommentReactionVariables,
		{ previousQueries: Array<[readonly unknown[], unknown]> }
	>({
		mutationFn: ({ commentId, reactionType }) => {
			if (!reactionType) return commentsService.removeCommentReaction(commentId);
			return commentsService.addCommentReaction(commentId, reactionType);
		},
		onMutate: async ({ commentId, reactionType, previousReaction }) => {
			await queryClient.cancelQueries({ queryKey: COMMENTS_QUERY_KEYS.all });

			const previousQueries = queryClient.getQueriesData({ queryKey: COMMENTS_QUERY_KEYS.all });
			previousQueries.forEach(([queryKey, oldData]) => {
				queryClient.setQueryData(queryKey, () =>
					updateCommentReaction(oldData as CommentsResponse | InfiniteData<CommentsResponse> | undefined, commentId, reactionType, previousReaction),
				);
			});

			return { previousQueries };
		},
		onError: (error, _variables, context) => {
			context?.previousQueries.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
			toast.error(error.message || 'Failed to update reaction');
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: COMMENTS_QUERY_KEYS.all });
		},
	});
}
