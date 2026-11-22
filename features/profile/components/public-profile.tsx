'use client';

import { useAuth } from '@/features/auth/hooks/use-auth';
import CreatePostForm from '@/features/posts/components/create-post-form';
import PostCard from '@/features/posts/components/post-card';
import { useUserPosts, useUserTaggedPosts } from '@/features/posts/hooks/use-posts';
import { usePublicProfile } from '@/features/profile/hooks/use-public';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { NewspaperIcon, TagIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import ProfileActionBar from './profile-action-bar';
import PublicProfileNotFound from './public-profile-not-found';
import PublicProfileSkeleton from './public-profile-skeleton';
import UserSection from './user-section';

interface PublicProfileProps {
	username: string;
}

export default function PublicProfile({ username }: PublicProfileProps) {
	const t = useTranslations();
	const [activeTab, setActiveTab] = useState<'posts' | 'tagged'>('posts');

	const { user: authedUser, isLoading: isAuthLoading } = useAuth();
	const { data: targetUser, isLoading: isTargetUserLoading } = usePublicProfile(username || '');

	const targetUserId = targetUser?._id || targetUser?.id || '';
	const isSelf = Boolean(
		authedUser && targetUser && (authedUser.username === targetUser.username || authedUser._id === targetUserId),
	);

	const { data: userPostsData, isLoading: isLoadingUserPosts } = useUserPosts(targetUserId);
	const { data: taggedPostsData, isLoading: isLoadingTaggedPosts } = useUserTaggedPosts(targetUserId);

	const userPosts = userPostsData?.data || [];
	const taggedPosts = taggedPostsData?.data || [];

	if (isAuthLoading || isTargetUserLoading) {
		return <PublicProfileSkeleton />;
	}

	if (!targetUser) {
		return <PublicProfileNotFound />;
	}

	return (
		<div className='w-full mx-auto px-4 py-8 space-y-8 overflow-hidden page-animation'>
			<UserSection user={targetUser} />

			{!isSelf && authedUser && (
				<div className='flex justify-end pt-2'>
					<ProfileActionBar targetUserId={targetUserId} />
				</div>
			)}

			{isSelf && <CreatePostForm />}

			<Tabs
				value={activeTab}
				onValueChange={(val) => setActiveTab(val as 'posts' | 'tagged')}
				className='w-full space-y-6'
			>
				<TabsList className='grid w-full grid-cols-2 bg-card-blur border border-border/20 p-1 rounded-2xl h-12'>
					<TabsTrigger
						value='posts'
						className='gap-2 rounded-xl font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground'
					>
						<NewspaperIcon className='size-4' />
						<span>{t('profile.tabs.posts') || 'User Posts'}</span>
					</TabsTrigger>
					<TabsTrigger
						value='tagged'
						className='gap-2 rounded-xl font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground'
					>
						<TagIcon className='size-4' />
						<span>{t('profile.tabs.tagged') || 'Tagged Posts'}</span>
					</TabsTrigger>
				</TabsList>

				<TabsContent value='posts' className='space-y-4 m-0'>
					{isLoadingUserPosts ? (
						Array.from({ length: 2 }).map((_, idx) => (
							<div key={idx} className='p-5 rounded-3xl border border-border/20 bg-card-blur space-y-3'>
								<div className='flex items-center gap-3'>
									<Skeleton className='size-12 rounded-full' />
									<div className='space-y-2'>
										<Skeleton className='h-4 w-32' />
										<Skeleton className='h-3 w-20' />
									</div>
								</div>
								<Skeleton className='h-24 w-full rounded-2xl' />
							</div>
						))
					) : userPosts.length > 0 ? (
						userPosts.map((post) => <PostCard key={post._id} post={post} canDelete={isSelf} />)
					) : (
						<div className='text-center py-12 px-4 rounded-3xl border border-border/10 bg-card-blur/50 space-y-3'>
							<NewspaperIcon className='size-10 text-muted-foreground mx-auto opacity-50' />
							<p className='text-sm text-muted-foreground font-medium'>
								{t('profile.emptyPosts') || 'No posts published yet.'}
							</p>
						</div>
					)}
				</TabsContent>

				<TabsContent value='tagged' className='space-y-4 m-0'>
					{isLoadingTaggedPosts ? (
						Array.from({ length: 2 }).map((_, idx) => (
							<div key={idx} className='p-5 rounded-3xl border border-border/20 bg-card-blur space-y-3'>
								<div className='flex items-center gap-3'>
									<Skeleton className='size-12 rounded-full' />
									<div className='space-y-2'>
										<Skeleton className='h-4 w-32' />
										<Skeleton className='h-3 w-20' />
									</div>
								</div>
								<Skeleton className='h-24 w-full rounded-2xl' />
							</div>
						))
					) : taggedPosts.length > 0 ? (
						taggedPosts.map((post) => <PostCard key={post._id} post={post} />)
					) : (
						<div className='text-center py-12 px-4 rounded-3xl border border-border/10 bg-card-blur/50 space-y-3'>
							<TagIcon className='size-10 text-muted-foreground mx-auto opacity-50' />
							<p className='text-sm text-muted-foreground font-medium'>
								{t('profile.emptyTagged') || 'No tagged posts found.'}
							</p>
						</div>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}
