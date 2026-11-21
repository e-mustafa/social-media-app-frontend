import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PostDetailScreen } from '@/modules/posts';

interface PostDetailPageProps {
	params: Promise<{
		postId: string;
	}>;
}

export async function generateMetadata({ params }: PostDetailPageProps): Promise<Metadata> {
	const [{ postId }, t] = await Promise.all([params, getTranslations()]);

	return {
		title: `${t('posts.detail.title')} | ${t('common.appName')}`,
		description: t('posts.detail.description', { postId }),
	};
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
	const { postId } = await params;

	return <PostDetailScreen postId={postId} />;
}
