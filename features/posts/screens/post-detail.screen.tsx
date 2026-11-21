'use client';

import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { ArrowLeftIcon, FileQuestionIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { usePost } from '../hooks/use-posts';
import PostCard from '../components/post-card';

interface PostDetailScreenProps {
	postId: string;
}

export default function PostDetailScreen({ postId }: PostDetailScreenProps) {
	const t = useTranslations();
	const router = useRouter();
	const { data, isLoading, isError } = usePost(postId);
	const post = data?.data;

	return (
		<main className='min-h-[calc(100vh-4rem)] w-full bg-radial from-brand-primary/5 via-transparent to-transparent'>
			<div className='mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6'>
				<Button type='button' variant='ghost' className='w-fit gap-2 rounded-xl' onClick={() => router.back()}>
					<ArrowLeftIcon className='size-4 rtl:rotate-180' />
					{t('common.goBack') || 'Go Back'}
				</Button>

				{isLoading ? (
					<div className='rounded-3xl border border-border/20 bg-card-blur p-5'>
						<div className='flex items-center gap-3'>
							<Skeleton className='size-12 rounded-full' />
							<div className='space-y-2'>
								<Skeleton className='h-4 w-36' />
								<Skeleton className='h-3 w-24' />
							</div>
						</div>
						<Skeleton className='mt-4 h-40 w-full rounded-2xl' />
					</div>
				) : post ? (
					<PostCard post={post} showComments />
				) : (
					<div className='rounded-3xl border border-border/10 bg-card-blur/50 px-4 py-16 text-center'>
						<FileQuestionIcon className='mx-auto size-12 text-muted-foreground/50' />
						<h1 className='mt-4 text-lg font-semibold text-foreground'>
							{isError ? t('common.error') || 'An unexpected error occurred' : t('posts.detail.notFound') || 'Post not found'}
						</h1>
					</div>
				)}
			</div>
		</main>
	);
}
