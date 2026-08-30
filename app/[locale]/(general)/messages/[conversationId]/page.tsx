import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ChatScreen } from '@/modules/chat';

interface ConversationPageProps {
	params: Promise<{
		conversationId: string;
	}>;
}

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();
	return {
		title: `${t('chat.metadata.title')} | ${t('common.appName')}`,
		description: t('chat.metadata.description'),
	};
}

export default async function ConversationPage({ params }: ConversationPageProps) {
	const { conversationId } = await params;
	return <ChatScreen conversationId={conversationId} />;
}
