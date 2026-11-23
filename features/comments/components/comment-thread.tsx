'use client';

import { Skeleton } from '@/shared/components/ui/skeleton';
import { Button } from '@/shared/components/ui/button';
import { MessageCircleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePostComments } from '../hooks/use-comments';
import { useAuth } from '@/features/auth/hooks/use-auth';
import CommentInput from './comment-input';
import CommentItem from './comment-item';

interface CommentThreadProps {
	postId: string;
}

export default function CommentThread({ postId }: CommentThreadProps) {
	const t = useTranslations();
	const { isAuthed, isLoading: isAuthLoading } = useAuth();
	const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = usePostComments(postId, {
		limit: 10,
		order: 'asc',
	}, {
		enabled: !!postId && isAuthed,
	});
	const comments = data?.pages.flatMap((page) => page.data || []) || [];

	const isGuest = !isAuthed && !isAuthLoading;

	if (isAuthLoading) {
		return (
			<section className='space-y-4 sm:rounded-2xl border border-border/20 bg-background/25 sm:p-3'>
				<div className='flex items-center justify-between gap-3'>
					<h3 className='flex items-center gap-2 text-sm font-semibold text-foreground'>
						<MessageCircleIcon className='size-4 text-brand-primary' />
						{t('comments.title')}
					</h3>
				</div>
				<div className='space-y-3'>
					{Array.from({ length: 3 }).map((_, index) => (
						<div key={index} className='flex gap-3'>
							<Skeleton className='size-9 rounded-full' />
							<div className='flex-1 space-y-2'>
								<Skeleton className='h-20 rounded-2xl' />
							<Skeleton className='h-4 w-32' />
						</div>
					</div>
				))}
			</div>
		</section>
		);
	}

	return (
		<section className='space-y-4 rounded-2xl border border-border/20 bg-background/25 py-3 sm:p-3'>
			<div className='flex items-center justify-between gap-3 px-3'>
				<h3 className='flex items-center gap-2 text-sm font-semibold text-foreground'>
					<MessageCircleIcon className='size-4 text-brand-primary' />
					{t('comments.title')}
				</h3>
			</div>

			{isGuest ? (
				<div className='rounded-2xl border border-border/10 bg-card-blur/40 px-4 py-8 text-center'>
					<MessageCircleIcon className='mx-auto size-8 text-muted-foreground/50' />
					<p className='mt-2 text-sm font-medium text-muted-foreground'>{t('comments.guest')}</p>
				</div>
			) : (
				<>
					<CommentInput postId={postId} />

					{isLoading ? (
						<div className='space-y-3'>
							{Array.from({ length: 3 }).map((_, index) => (
								<div key={index} className='flex gap-3'>
									<Skeleton className='size-9 rounded-full' />
									<div className='flex-1 space-y-2'>
										<Skeleton className='h-20 rounded-2xl' />
										<Skeleton className='h-4 w-32' />
									</div>
								</div>
							))}
						</div>
					) : comments.length > 0 ? (
						<>
							<div className='space-y-4'>
								{comments.map((comment) => (
									<CommentItem key={comment._id} comment={comment} postId={postId} />
								))}
							</div>
							{hasNextPage && (
								<Button
									type='button'
									onClick={() => fetchNextPage()}
									disabled={isFetchingNextPage}
									variant='outline'
									className='w-full'
								>
									{isFetchingNextPage ? t('common.loading') : t('comments.actions.loadMore')}
								</Button>
							)}
						</>
					) : (
						<div className='rounded-2xl border border-border/10 bg-card-blur/40 px-4 py-8 text-center'>
							<MessageCircleIcon className='mx-auto size-8 text-muted-foreground/50' />
							<p className='mt-2 text-sm font-medium text-muted-foreground'>{t('comments.empty')}</p>
						</div>
					)}
				</>
			)}
		</section>
	);
}
