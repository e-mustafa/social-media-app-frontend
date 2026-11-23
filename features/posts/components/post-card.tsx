'use client';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { CommentThread } from '@/features/comments';
import { AuthRequiredDialog } from '@/features/shared/components/auth-required-dialog';
import { Link } from '@/i18n/navigation';
import { LightboxMediaItem, MediaLightbox } from '@/shared/components/custom-ui/media-lightbox';
import { ReactionsPicker } from '@/shared/components/custom-ui/reactions-picker';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Separator } from '@/shared/components/ui/separator';
import { cn } from '@/shared/utils/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import {
	Edit3Icon,
	Globe2Icon,
	LockIcon,
	MessageCircleIcon,
	MoreHorizontalIcon,
	Share2Icon,
	Trash2Icon,
	UsersIcon,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { usePostReactionMutation } from '../hooks/use-post-reactions';
import { useDeletePost } from '../hooks/use-posts';
import { Post, PostAttachment, PostVisibility, ReactionType } from '../types';
import EditPostDialog from './edit-post-dialog';
import PostAudioPlayer from './post-audio-player';
import PostMediaGrid from './post-media-grid';
import ShareDialog from './share-dialog';

interface PostCardProps {
	post: Post;
	canDelete?: boolean;
	showComments?: boolean;
	className?: string;
}

const visibilityConfig: Record<PostVisibility, { icon: typeof Globe2Icon; variant: 'default' | 'secondary' | 'outline' }> = {
	public: { icon: Globe2Icon, variant: 'default' },
	friends: { icon: UsersIcon, variant: 'secondary' },
	private: { icon: LockIcon, variant: 'outline' },
};

const isAudioAttachment = (attachment: PostAttachment) => {
	return (
		attachment.resourceType === 'audio' ||
		attachment.resourceType === 'raw' ||
		attachment.url.match(/\.(mp3|wav|webm|m4a|ogg)(\?.*)?$/i) !== null
	);
};

const isVideoAttachment = (attachment: PostAttachment) => {
	return attachment.resourceType === 'video' || attachment.url.match(/\.(mp4|webm|mov)(\?.*)?$/i) !== null;
};

export default function PostCard({ post, canDelete = false, showComments = false, className }: PostCardProps) {
	const t = useTranslations();
	const locale = useLocale();
	const deletePostMutation = useDeletePost();
	const reactionMutation = usePostReactionMutation();
	const [activeReaction, setActiveReaction] = useState<ReactionType | null>(post.myReaction || null);
	const [reactionsCount, setReactionsCount] = useState(post.reactionsCount || 0);
	const [lightboxOpen, setLightboxOpen] = useState(false);
	const [lightboxIndex, setLightboxIndex] = useState(0);
	const [editOpen, setEditOpen] = useState(false);
	const [commentsOpen, setCommentsOpen] = useState(showComments);
	const [shareOpen, setShareOpen] = useState(false);
	const { user: currentUser, isLoading: isAuthLoading, isAuthed } = useAuth();
	const isAuthor = currentUser && (currentUser._id === post.author._id || currentUser.id === post.author.id);
	const isEdited = post.updatedAt && new Date(post.updatedAt).getTime() !== new Date(post.createdAt).getTime();
	const fullName = `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim() || post.author.username || 'User';
	const initials = `${post.author.firstName?.[0] || ''}${post.author.lastName?.[0] || ''}`.toUpperCase() || 'U';
	const avatarUrl = post.author.avatar?.url || '/images/default-avatar.png';
	const createdAt = formatDistanceToNow(new Date(post.createdAt), {
		addSuffix: true,
		locale: locale === 'ar' ? ar : enUS,
	});
	const activeVisibility = visibilityConfig[post.visibility] || visibilityConfig.public;
	const VisibilityIcon = activeVisibility.icon;
	const audioAttachments = (post.attachments || []).filter(isAudioAttachment);
	const lightboxItems = useMemo<LightboxMediaItem[]>(() => {
		return (post.attachments || [])
			.filter((attachment) => !isAudioAttachment(attachment))
			.map((attachment) => ({
				id: attachment.id || attachment.url,
				url: attachment.url,
				type: isVideoAttachment(attachment) ? 'video' : 'image',
				alt: post.content || 'Post attachment',
			}));
	}, [post.attachments, post.content]);

	const [authDialogOpen, setAuthDialogOpen] = useState(false);

	const requireAuth = (action: () => void) => {
		if (isAuthLoading) return;
		if (!isAuthed) {
			setAuthDialogOpen(true);
			return;
		}
		action();
	};

	useEffect(() => {
		setActiveReaction(post.myReaction || null);
		setReactionsCount(post.reactionsCount || 0);
	}, [post.myReaction, post.reactionsCount]);

	const handleReactionChange = (nextReaction: ReactionType | null) => {
		const previousReaction = activeReaction;
		const hadReaction = Boolean(previousReaction);
		const hasReaction = Boolean(nextReaction);
		const countDelta = hadReaction === hasReaction ? 0 : hasReaction ? 1 : -1;

		setActiveReaction(nextReaction);
		setReactionsCount((count) => Math.max(count + countDelta, 0));
		reactionMutation.mutate({ postId: post._id, reactionType: nextReaction, previousReaction });
	};

	return (
		<Card className={cn('overflow-hidden rounded-3xl border-border/20 bg-card-blur p-0 shadow-sm gap-0', className)}>
			<div className='flex flex-col gap-4 p-3 sm:p-5'>
				<div className='flex items-start justify-between gap-3'>
					<div className='flex min-w-0 items-center gap-3'>
						<Avatar className='size-12 border border-border/20'>
							<AvatarImage src={avatarUrl} alt={fullName} />
							<AvatarFallback className='bg-primary/10 text-primary'>{initials}</AvatarFallback>
						</Avatar>
						<div className='min-w-0'>
							{post.author.username ? (
								<Link
									href={`/u/${post.author.username}`}
									className='block truncate font-semibold text-foreground hover:underline'
								>
									{fullName}
								</Link>
							) : (
								<p className='truncate font-semibold text-foreground'>{fullName}</p>
							)}
							<div className='mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
								<span>{createdAt}</span>
								{isEdited && (
									<span className='text-[10px] text-muted-foreground'>({t('comments.edited') || 'Edited'})</span>
								)}
								<Badge variant={activeVisibility.variant} className='gap-1'>
									<VisibilityIcon className='size-3' />
									{t(`posts.create.privacy.${post.visibility}`) || post.visibility}
								</Badge>
							</div>
						</div>
					</div>

					{(canDelete || isAuthor) && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									type='button'
									variant='ghost'
									size='icon'
									className='size-9 rounded-xl text-muted-foreground'
									aria-label={t('posts.card.options') || 'Options'}
								>
									<MoreHorizontalIcon className='size-4' />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align='end'
								className='bg-card-glass backdrop-blur-lg rounded-xl border border-border/30 w-44 z-50'
							>
								{isAuthor && (
									<DropdownMenuItem
										onClick={() => setEditOpen(true)}
										className='flex items-center gap-2 cursor-pointer'
									>
										<Edit3Icon className='size-4 text-brand-primary' />
										<span>{t('posts.card.edit') || 'Edit Post'}</span>
									</DropdownMenuItem>
								)}
								<DropdownMenuItem
									onClick={() => deletePostMutation.mutate(post._id)}
									disabled={deletePostMutation.isPending}
									className='flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive'
								>
									<Trash2Icon className='size-4' />
									<span>{t('posts.card.delete') || 'Delete Post'}</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>

				{post.content && (
					<p className='whitespace-pre-wrap wrap-break-word text-sm leading-7 text-foreground'>{post.content}</p>
				)}

				{post.attachments && post.attachments.length > 0 && (
					<PostMediaGrid
						attachments={post.attachments}
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
								label={t('posts.card.voiceNote') || 'Voice Note'}
							/>
						))}
					</div>
				)}

				<div className='flex flex-col gap-2'>
					<Separator />
					<div className='grid grid-cols-3 gap-2'>
						<ReactionsPicker
							activeReaction={activeReaction}
							onChange={(nextReaction) => requireAuth(() => handleReactionChange(nextReaction))}
							disabled={reactionMutation.isPending}
							reactionsCount={reactionsCount}
							className='justify-center'
						/>
						<Button
							type='button'
							variant='ghost'
							className='gap-2 rounded-xl text-muted-foreground'
							onClick={() => requireAuth(() => setCommentsOpen((prev) => !prev))}
						>
							<MessageCircleIcon className='size-4' />
							{post.commentsCount > 0 && (
								<span className='hidden sm:inline text-xs font-medium text-muted-foreground'>
									{t('comments.count', { count: post.commentsCount })}
								</span>
							)}
							<span className='hidden md:inline'>{t('posts.card.comment') || 'Comment'}</span>
						</Button>
						<Button
							type='button'
							variant='ghost'
							className='gap-2 rounded-xl text-muted-foreground'
							onClick={() => setShareOpen(true)}
						>
							<Share2Icon className='size-4' />
							<span className='hidden sm:inline text-xs font-medium text-muted-foreground'>
								{t('posts.card.share') || 'Share'}
							</span>
						</Button>
					</div>
				</div>
			</div>
			{commentsOpen && (
				<div className='border-t border-border/20 p-2 sm:p-5'>
					<CommentThread postId={post._id} />
				</div>
			)}
			<MediaLightbox
				items={lightboxItems}
				open={lightboxOpen}
				initialIndex={lightboxIndex}
				onOpenChange={setLightboxOpen}
			/>
			{isAuthor && <EditPostDialog post={post} open={editOpen} onOpenChange={setEditOpen} />}
			<AuthRequiredDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
			<ShareDialog open={shareOpen} onOpenChange={setShareOpen} postId={post._id} />
		</Card>
	);
}
