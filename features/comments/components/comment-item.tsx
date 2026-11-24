'use client';

import PostAudioPlayer from '@/features/posts/components/post-audio-player';
import PostMediaGrid from '@/features/posts/components/post-media-grid';
import { PostAttachment, ReactionType } from '@/features/posts/types';
import { LightboxMediaItem, MediaLightbox } from '@/shared/components/custom-ui/media-lightbox';
import { ReactionsPicker } from '@/shared/components/custom-ui/reactions-picker';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { defaultImages } from '@/shared/config/app-configs';
import { cn } from '@/shared/utils/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { MessageCircleIcon, Trash2Icon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { useCommentReaction, useCommentReplies, useDeleteComment } from '../hooks/use-comments';
import { Comment } from '../types';
import CommentInput from './comment-input';

interface CommentItemProps {
	comment: Comment;
	postId: string;
	depth?: number;
	canDelete?: boolean;
}

const isAudioAttachment = (attachment: PostAttachment) => {
	return (
		attachment.resourceType === 'audio' ||
		attachment.resourceType === 'raw' ||
		attachment.url.match(/\.(mp3|wav|webm|m4a|ogg)(\?.*)?$/i) !== null
	);
};

export default function CommentItem({ comment, postId, depth = 0, canDelete = false }: CommentItemProps) {
	const t = useTranslations();
	const locale = useLocale();
	const reactionMutation = useCommentReaction();
	const deleteCommentMutation = useDeleteComment();
	const [showReplyInput, setShowReplyInput] = useState(false);
	const [showReplies, setShowReplies] = useState(false);
	const [activeReaction, setActiveReaction] = useState<ReactionType | null>(comment.userReaction || null);
	const [reactionsCount, setReactionsCount] = useState(comment.reactionsCount || 0);

	const [lightboxOpen, setLightboxOpen] = useState(false);
	const [lightboxIndex, setLightboxIndex] = useState(0);

	const isVideoAttachment = (attachment: PostAttachment) => {
		return attachment.resourceType === 'video' || attachment.url.match(/\.(mp4|webm|mov)(\?.*)?$/i) !== null;
	};

	const lightboxItems = useMemo<LightboxMediaItem[]>(() => {
		return (comment.attachments || [])
			.filter((attachment) => !isAudioAttachment(attachment))
			.map((attachment) => ({
				id: attachment.id || attachment.url,
				url: attachment.url,
				type: isVideoAttachment(attachment) ? 'video' : 'image',
				alt: comment.content || 'Post attachment',
			}));
	}, [comment.attachments, comment.content]);

	useEffect(() => {
		setActiveReaction(comment.userReaction || null);
		setReactionsCount(comment.reactionsCount || 0);
	}, [comment.userReaction, comment.reactionsCount]);

	const fullName =
		`${comment.author.firstName || ''} ${comment.author.lastName || ''}`.trim() || comment.author.username || 'User';
	const initials = `${comment.author.firstName?.[0] || ''}${comment.author.lastName?.[0] || ''}`.toUpperCase() || 'U';
	const createdAt = formatDistanceToNow(new Date(comment.createdAt), {
		addSuffix: true,
		locale: locale === 'ar' ? ar : enUS,
	});
	const audioAttachments = (comment.attachments || []).filter(isAudioAttachment);
	const mediaAttachments = (comment.attachments || []).filter((attachment) => !isAudioAttachment(attachment));
	// const isEdited = Boolean(comment.editedAt || (comment.updatedAt && comment.updatedAt !== comment.createdAt));

	const handleReactionChange = (nextReaction: ReactionType | null) => {
		const previousReaction = activeReaction;
		const hadReaction = Boolean(previousReaction);
		const hasReaction = Boolean(nextReaction);
		const countDelta = hadReaction === hasReaction ? 0 : hasReaction ? 1 : -1;

		setActiveReaction(nextReaction);
		setReactionsCount((count) => Math.max(count + countDelta, 0));
		reactionMutation.mutate({ commentId: comment._id, reactionType: nextReaction, previousReaction });
	};

	return (
		<div className={cn('relative space-y-3', depth > 0 && 'ps-4 border-s border-border/30')}>
			<div className='flex flex-col gap-3 rounded-2xl border border-border/20 bg-card/50 min-w-0 flex-1 space-y-2'>
				<div className='flex flex-col gap-3 p-2'>
					<div className='flex gap-2'>
						<Avatar className='size-9 border border-border/20'>
							<AvatarImage src={comment.author?.avatar?.url || defaultImages.avatarMale} alt={fullName} />
							<AvatarFallback className='bg-primary/10 text-xs text-primary'>{initials}</AvatarFallback>
						</Avatar>

						<div className='flex flex-col'>
							<p className='truncate text-sm font-semibold text-foreground'>{fullName}</p>
							<div className='mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground'>
								<span>{createdAt}</span>
								{/* {isEdited && <Badge variant='outline'>{t('comments.edited')}</Badge>} */}
							</div>
						</div>
					</div>

					{canDelete && (
						<Button
							type='button'
							variant='ghost'
							size='icon'
							className='size-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
							onClick={() => deleteCommentMutation.mutate(comment._id)}
							aria-label={t('comments.actions.delete')}
						>
							<Trash2Icon className='size-4' />
						</Button>
					)}

					<div className='flex flex-col gap-3'>
						<p className='whitespace-pre-wrap break-words text-sm leading-6 text-foreground'>{comment.content}</p>

						{mediaAttachments.length > 0 && (
							<PostMediaGrid
								attachments={mediaAttachments}
								onOpen={(index) => {
									setLightboxIndex(index);
									setLightboxOpen(true);
								}}
							/>
						)}

						{audioAttachments.length > 0 && (
							<div className='space-y-2'>
								{audioAttachments.map((attachment) => (
									<PostAudioPlayer
										key={attachment.id || attachment.url}
										src={attachment.url}
										label={t('comments.voiceNote')}
									/>
								))}
							</div>
						)}
					</div>

					<div className='flex flex-wrap items-center gap-3 text-xs text-muted-foreground border-t border-t-accent'>
						<ReactionsPicker
							activeReaction={activeReaction}
							onChange={handleReactionChange}
							disabled={reactionMutation.isPending}
							reactionsCount={reactionsCount}
						/>

						<div className='flex gap-1 items-center'>
							<Button
								type='button'
								variant='ghost'
								size='sm'
								className='h-8 gap-1 rounded-xl'
								onClick={() => {
									setShowReplyInput((value) => !value);
									setShowReplies((value) => !value);
								}}
							>
								<MessageCircleIcon className='size-3.5' />
								{t('comments.actions.reply')}
							</Button>
							{comment.repliesCount > 0 && depth < 2 && (
								<Button
									type='button'
									variant='link'
									size='sm'
									className='h-8 px-1 text-xs'
									onClick={() => setShowReplies((value) => !value)}
								>
									{showReplies
										? t('comments.actions.hideReplies')
										: t('comments.actions.viewReplies', { count: comment.repliesCount })}
								</Button>
							)}
						</div>
					</div>

					{showReplyInput && (
						<CommentInput
							postId={postId}
							replyToCommentId={comment._id}
							compact
							onSubmitted={() => setShowReplyInput(false)}
						/>
					)}
				</div>
			</div>

			<MediaLightbox
				items={lightboxItems}
				open={lightboxOpen}
				initialIndex={lightboxIndex}
				onOpenChange={setLightboxOpen}
			/>

			{showReplies && depth < 2 && <CommentReplies parentCommentId={comment._id} postId={postId} depth={depth + 1} />}
		</div>
	);
}

function CommentReplies({ parentCommentId, postId, depth }: { parentCommentId: string; postId: string; depth: number }) {
	const t = useTranslations();
	const { data, isLoading } = useCommentReplies(parentCommentId, { limit: 5, order: 'asc' });
	const replies = data?.data || [];

	if (isLoading) return <p className='ps-12 text-xs text-muted-foreground'>{t('common.loading')}</p>;

	return (
		<div className='space-y-3 ps-2 md:ps-12'>
			{replies.map((reply) => (
				<CommentItem key={reply._id} comment={reply} postId={postId} depth={depth} />
			))}
		</div>
	);
}
