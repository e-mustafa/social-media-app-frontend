import { BlockedUsersScreen } from '@/features/block';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();
	return {
		title: `${t('block.title') || 'Blocked Users'} | ${t('common.appName') || 'Sarahah'}`,
		description: t('block.description') || 'Manage your blocked users list',
	};
}

export default function BlockedUsersPage() {
	return <BlockedUsersScreen />;
}
