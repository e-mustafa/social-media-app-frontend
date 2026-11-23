'use client';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { APP_ROUTES } from '@/shared/config/app-configs';
import { Loader2Icon, NewspaperIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef } from 'react';
import { useFeedPosts } from '../hooks/use-posts';
import CreatePostForm from './create-post-form';
import PostCard from './post-card';

export default function FeedList() {
	const t = useTranslations();
	const router = useRouter();
	const loadMoreRef = useRef<HTMLDivElement | null>(null);
	const { user, isAuthed, isLoading: isAuthLoading } = useAuth();
	const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useFeedPosts(
		{ limit: 10, order: 'desc' },
		{ enabled: !isAuthLoading, isAuthed },
	);

	const posts = useMemo(() => data?.pages.flatMap((page) => page.data || []) || [], [data]);

	const isFeedLoading = isAuthLoading || isLoading;

	useEffect(() => {
		const target = loadMoreRef.current;
		if (!target) return;

		const observer = new IntersectionObserver((entries) => {
			const entry = entries[0];
			if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
				fetchNextPage();
			}
		});

		observer.observe(target);
		return () => observer.disconnect();
	}, [fetchNextPage, hasNextPage, isFetchingNextPage]);

	return (
		<div className='mx-auto flex w-full max-w-4xl flex-col gap-5'>
			{user && isAuthed ? (
				<CreatePostForm />
			) : (
				<div className='flex flex-col items-center justify-center py-8 text-center'>
					<Button type='button' onClick={() => router.push(APP_ROUTES.login)} className='w-full sm:w-auto'>
						{t('guest.login') || 'Log In'}
					</Button>
					<Button
						type='button'
						onClick={() => router.push(APP_ROUTES.register)}
						variant='outline'
						className='mt-3 w-full sm:w-auto'
					>
						{t('guest.register') || 'Create Account'}
					</Button>
					<p className='mt-4 text-sm text-muted-foreground'>
						{t('guest.joinDescription') || 'Join to start sharing and connecting.'}
					</p>
				</div>
			)}

			{isFeedLoading ? (
				<div className='space-y-4'>
					{Array.from({ length: 3 }).map((_, index) => (
						<div key={index} className='rounded-3xl border border-border/20 bg-card-blur p-5'>
							<div className='flex items-center gap-3'>
								<Skeleton className='size-12 rounded-full' />
								<div className='space-y-2'>
									<Skeleton className='h-4 w-36' />
									<Skeleton className='h-3 w-24' />
								</div>
							</div>
							<Skeleton className='mt-4 h-20 w-full rounded-2xl' />
						</div>
					))}
				</div>
			) : posts.length > 0 ? (
				<div className='space-y-4'>
					{posts.map((post, index) => (
						<PostCard key={post._id || index} post={post} />
					))}
				</div>
			) : (
				<div className='rounded-3xl border border-border/10 bg-card-blur/50 px-4 py-16 text-center'>
					<NewspaperIcon className='mx-auto size-12 text-muted-foreground/50' />
					<h2 className='mt-4 text-lg font-semibold text-foreground'>{t('posts.empty.title') || 'No posts to show'}</h2>
					<p className='mt-1 text-sm text-muted-foreground'>
						{t('posts.empty.description') || 'Be the first to share an update with your friends!'}
					</p>
				</div>
			)}

			{!isFeedLoading && (
				<div ref={loadMoreRef} className='flex justify-center py-2'>
					{isFetchingNextPage ? (
						<Loader2Icon className='size-6 animate-spin text-brand-primary' />
					) : hasNextPage ? (
						<Button
							type='button'
							variant='outline'
							onClick={() => fetchNextPage()}
							className='rounded-xl bg-card-blur'
						>
							{t('posts.loadMore') || 'Load More Posts'}
						</Button>
					) : null}
				</div>
			)}
		</div>
	);
}
