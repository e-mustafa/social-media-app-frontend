import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ReactionType } from '@/modules/posts/types';
import { commentsService } from '../services/comments.service';
import { CommentQueryParams, CommentsResponse, CreateCommentPayload, UpdateCommentPayload } from '../types';

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
	response: CommentsResponse | undefined,
	commentId: string,
	nextReaction: ReactionType | null,
	previousReaction?: ReactionType | null,
) => {
	if (!response?.data) return response;

	return {
		...response,
		data: response.data.map((comment) => {
			if (comment._id !== commentId) return comment;

			const hadReaction = Boolean(previousReaction ?? comment.userReaction);
			const hasReaction = Boolean(nextReaction);
			const countDelta = hadReaction === hasReaction ? 0 : hasReaction ? 1 : -1;

			return {
				...comment,
				userReaction: nextReaction,
				reactionsCount: Math.max((comment.reactionsCount || 0) + countDelta, 0),
			};
		}),
	};
};

export function usePostComments(postId: string, params?: CommentQueryParams) {
	return useQuery({
		queryKey: COMMENTS_QUERY_KEYS.post(postId, params),
		queryFn: () => commentsService.getPostComments(postId, params),
		enabled: !!postId,
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

	return useMutation<unknown, Error, CommentReactionVariables, { previousQueries: Array<[readonly unknown[], CommentsResponse | undefined]> }>({
		mutationFn: ({ commentId, reactionType }) => {
			if (!reactionType) return commentsService.removeCommentReaction(commentId);
			return commentsService.addCommentReaction(commentId, reactionType);
		},
		onMutate: async ({ commentId, reactionType, previousReaction }) => {
			await queryClient.cancelQueries({ queryKey: COMMENTS_QUERY_KEYS.all });

			const previousQueries = queryClient.getQueriesData<CommentsResponse>({ queryKey: COMMENTS_QUERY_KEYS.all });
			previousQueries.forEach(([queryKey]) => {
				queryClient.setQueryData<CommentsResponse>(queryKey, (oldData) =>
					updateCommentReaction(oldData, commentId, reactionType, previousReaction),
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
