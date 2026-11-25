import { FriendsScreen } from '@/features/friends';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();
	return {
		title: `${t('friends.title') || 'Friends'} | ${t('common.appName')}`,
		description: t('friends.description') || 'Manage your friends list and requests',
	};
}

export default function FriendsPage() {
	return <FriendsScreen />;
}
