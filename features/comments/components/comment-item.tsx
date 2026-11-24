'use client';

import PostAudioPlayer from '@/features/posts/components/post-audio-player';
import PostMediaGrid from '@/features/posts/components/post-media-grid';
import { PostAttachment } from '@/features/posts/types';
import { LightboxMediaItem, MediaLightbox } from '@/shared/components/custom-ui/media-lightbox';
import { ReactionsPicker } from '@/shared/components/custom-ui/reactions-picker';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { defaultImages } from '@/shared/config/app-configs';
import { cn } from '@/shared/utils/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { Loader2Icon, MessageCircleIcon, Trash2Icon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { useCommentReaction, useCommentReplies, useDeleteComment } from '../hooks/use-comments';
import { Comment } from '../types';
import CommentInput from './comment-input';

interface CommentItemProps {
	comment: Comment;
	postId: string;
	depth?: number;
	canDelete?: boolean;
}

const isAudioAttachment = (attachment: PostAttachment): boolean => {
	if (attachment.resourceType === 'audio') return true;
	if (attachment.resourceType === 'raw') return true;

	return /\.(mp3|wav|m4a|ogg|aac|flac)(?:[?#].*)?$/i.test(attachment.url);
};

const isVideoAttachment = (attachment: PostAttachment): boolean => {
	if (attachment.resourceType === 'video') return true;
	if (attachment.resourceType === 'audio') return false;

	return /\.(mp4|webm|mov|m4v)(?:[?#].*)?$/i.test(attachment.url);
};

export default function CommentItem({ comment, postId, depth = 0, canDelete = false }: CommentItemProps) {
	const t = useTranslations();
	const locale = useLocale();

	const reactionMutation = useCommentReaction();
	const deleteCommentMutation = useDeleteComment();

	const [showReplyInput, setShowReplyInput] = useState(false);
	const [showReplies, setShowReplies] = useState(false);

	const [lightboxOpen, setLightboxOpen] = useState(false);
	const [lightboxIndex, setLightboxIndex] = useState(0);

	// Derive reaction state directly from the query cache data.
	const activeReaction = comment.userReaction ?? null;
	const reactionsCount = comment.reactionsCount ?? 0;

	const author = comment.author;

	const fullName = `${author?.firstName || ''} ${author?.lastName || ''}`.trim() || author?.username || 'User';

	const initials = `${author?.firstName?.[0] || ''}${author?.lastName?.[0] || ''}`.toUpperCase() || 'U';

	const createdAt = formatDistanceToNow(new Date(comment.createdAt), {
		addSuffix: true,
		locale: locale === 'ar' ? ar : enUS,
	});

	const attachments = comment.attachments ?? [];

	const audioAttachments = useMemo(() => attachments.filter(isAudioAttachment), [attachments]);

	const mediaAttachments = useMemo(() => attachments.filter((attachment) => !isAudioAttachment(attachment)), [attachments]);

	const lightboxItems = useMemo<LightboxMediaItem[]>(
		() =>
			mediaAttachments.map((attachment) => ({
				id: attachment.id || attachment.url,
				url: attachment.url,
				type: isVideoAttachment(attachment) ? 'video' : 'image',
				alt: comment.content || 'Comment attachment',
			})),
		[mediaAttachments, comment.content],
	);

	const handleReactionChange = (nextReaction: typeof activeReaction) => {
		if (reactionMutation.isPending) return;

		reactionMutation.mutate({
			commentId: comment._id,
			reactionType: nextReaction,
		});
	};

	const handleDelete = () => {
		if (deleteCommentMutation.isPending) return;

		deleteCommentMutation.mutate(comment._id);
	};

	const handleReplySubmitted = () => {
		setShowReplyInput(false);
		setShowReplies(true);
	};

	return (
		<div className={cn('relative min-w-0 space-y-3', depth > 0 && 'border-s border-border/30 ps-4')}>
			<div className='flex min-w-0 flex-1 flex-col gap-3 space-y-2 rounded-2xl border border-border/20 bg-card/50'>
				<div className='flex flex-col gap-3 p-2'>
					<div className='flex items-start justify-between gap-2'>
						<div className='flex min-w-0 items-center gap-2'>
							<Avatar className='size-9 shrink-0 border border-border/20'>
								<AvatarImage src={author?.avatar?.url || defaultImages.avatarMale} alt={fullName} />
								<AvatarFallback className='bg-primary/10 text-xs text-primary'>{initials}</AvatarFallback>
							</Avatar>

							<div className='flex min-w-0 flex-col'>
								<p className='truncate text-sm font-semibold text-foreground'>{fullName}</p>

								<div className='mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground'>
									<span>{createdAt}</span>
								</div>
							</div>
						</div>

						{canDelete && (
							<Button
								type='button'
								variant='ghost'
								size='icon'
								className='size-8 shrink-0 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
								onClick={handleDelete}
								disabled={deleteCommentMutation.isPending}
								aria-label={t('comments.actions.delete')}
								title={t('comments.actions.delete')}
							>
								{deleteCommentMutation.isPending ? (
									<Loader2Icon className='size-4 animate-spin' />
								) : (
									<Trash2Icon className='size-4' />
								)}
							</Button>
						)}
					</div>

					<div className='flex flex-col gap-3'>
						<p className='break-words whitespace-pre-wrap text-sm leading-6 text-foreground'>{comment.content}</p>

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

					<div className='flex flex-wrap items-center gap-3 border-t border-t-accent pt-2 text-xs text-muted-foreground'>
						<ReactionsPicker
							activeReaction={activeReaction}
							onChange={handleReactionChange}
							disabled={reactionMutation.isPending}
							reactionsCount={reactionsCount}
						/>

						<div className='flex items-center gap-1'>
							<Button
								type='button'
								variant='ghost'
								size='sm'
								className='h-8 gap-1 rounded-xl'
								onClick={() => setShowReplyInput((value) => !value)}
								aria-expanded={showReplyInput}
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
									aria-expanded={showReplies}
								>
									{showReplies
										? t('comments.actions.hideReplies')
										: t('comments.actions.viewReplies', {
												count: comment.repliesCount,
											})}
								</Button>
							)}
						</div>
					</div>

					{showReplyInput && (
						<CommentInput postId={postId} replyToCommentId={comment._id} compact onSubmitted={handleReplySubmitted} />
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

	const { data, isLoading, isError, refetch } = useCommentReplies(parentCommentId, { limit: 5, order: 'asc' });

	const replies = data?.data ?? [];

	if (isLoading) {
		return <p className='ps-12 text-xs text-muted-foreground'>{t('common.loading')}</p>;
	}

	if (isError) {
		return (
			<div className='flex items-center gap-2 ps-12'>
				<p className='text-xs text-destructive'>{t('common.error')}</p>

				<Button type='button' variant='link' size='sm' className='h-auto p-0 text-xs' onClick={() => refetch()}>
					{t('common.retry')}
				</Button>
			</div>
		);
	}

	return (
		<div className='space-y-3 ps-2 md:ps-12'>
			{replies.map((reply) => (
				<CommentItem key={reply._id} comment={reply} postId={postId} depth={depth} />
			))}
		</div>
	);
}
