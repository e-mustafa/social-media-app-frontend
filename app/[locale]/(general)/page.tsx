import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { FeedScreen } from '@/modules/posts';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: `${t('posts.feedTitle')} | ${t('common.appName')}`,
		description: t('posts.empty.description'),
	};
}

export default function FeedPage() {
	return <FeedScreen />;
}
