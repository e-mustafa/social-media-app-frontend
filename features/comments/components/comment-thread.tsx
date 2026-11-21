'use client';

import { Skeleton } from '@/shared/components/ui/skeleton';
import { MessageCircleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePostComments } from '../hooks/use-comments';
import CommentInput from './comment-input';
import CommentItem from './comment-item';

interface CommentThreadProps {
	postId: string;
}

export default function CommentThread({ postId }: CommentThreadProps) {
	const t = useTranslations();
	const { data, isLoading } = usePostComments(postId, { limit: 10, order: 'asc' });
	const comments = data?.data || [];

	return (
		<section className='space-y-4 rounded-2xl border border-border/20 bg-background/25 p-3'>
			<div className='flex items-center justify-between gap-3'>
				<h3 className='flex items-center gap-2 text-sm font-semibold text-foreground'>
					<MessageCircleIcon className='size-4 text-brand-primary' />
					{t('comments.title')}
				</h3>
			</div>

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
				<div className='space-y-4'>
					{comments.map((comment) => (
						<CommentItem key={comment._id} comment={comment} postId={postId} />
					))}
				</div>
			) : (
				<div className='rounded-2xl border border-border/10 bg-card-blur/40 px-4 py-8 text-center'>
					<MessageCircleIcon className='mx-auto size-8 text-muted-foreground/50' />
					<p className='mt-2 text-sm font-medium text-muted-foreground'>{t('comments.empty')}</p>
				</div>
			)}
		</section>
	);
}
