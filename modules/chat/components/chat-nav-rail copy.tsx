// components/chat/chat-nav-rail.tsx
'use client';

import { SmartTooltip } from '@/shared/components/custom-ui/smart-tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { CircleDashed, MessageSquare, Phone, Settings, Sparkles, Users2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { NavigationTab } from '../types';

interface ChatNavRailProps {
	activeTab: NavigationTab;
	onTabChange: (tab: NavigationTab) => void;
	unreadTotal?: number;
	userAvatar?: string;
}

export const ChatNavRail = ({
	activeTab,
	onTabChange,
	unreadTotal = 31,
	userAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
}: ChatNavRailProps) => {
	const t = useTranslations();
	return (
		<aside className='w-16 bg-brand-primary/10 backdrop-blur-xl border-e border-border flex flex-col justify-between items-center py-3 text-muted-foreground shrink-0 z-20'>
			{/* Top Main Navigation Items */}
			<div className='flex flex-col items-center gap-2 w-full px-2'>
				{/* Chats Tab */}
				<SmartTooltip>
					<Button
						variant={activeTab === 'chats' ? 'secondary' : 'ghost'}
						size='icon'
						onClick={() => onTabChange('chats')}
						aria-label={t('Chats')}
						className={`relative size-12 rounded-xl ${activeTab === 'chats' ? 'text-primary' : ''}`}
					>
						<MessageSquare className='size-5' />
						{unreadTotal > 0 && (
							<Badge
								variant='default'
								className='absolute top-0 end-1 size-5 p-0 flex items-center justify-center text-[10px] leading-5 font-bold bg-primary text-primary-foreground rounded-full'
							>
								{unreadTotal > 99 ? '99+' : unreadTotal}
							</Badge>
						)}
					</Button>
				</SmartTooltip>

				{/* Calls Tab */}
				<SmartTooltip>
					<Button
						variant={activeTab === 'calls' ? 'secondary' : 'ghost'}
						size='icon'
						onClick={() => onTabChange('calls')}
						aria-label={t('Calls')}
						className={`size-12 rounded-xl ${activeTab === 'calls' ? 'text-primary' : ''}`}
					>
						<Phone className='size-5' />
					</Button>
				</SmartTooltip>

				{/* Status Tab */}
				<SmartTooltip>
					<Button
						variant={activeTab === 'status' ? 'secondary' : 'ghost'}
						size='icon'
						onClick={() => onTabChange('status')}
						aria-label={t('Status')}
						className={`size-12 rounded-xl ${activeTab === 'status' ? 'text-primary' : ''}`}
					>
						<CircleDashed className='size-5' />
					</Button>
				</SmartTooltip>

				{/* Channels Tab */}
				<SmartTooltip>
					<Button
						variant={activeTab === 'channels' ? 'secondary' : 'ghost'}
						size='icon'
						onClick={() => onTabChange('channels')}
						className={`size-12 rounded-xl ${activeTab === 'channels' ? 'text-primary' : ''}`}
						aria-label={t('Channels')}
					>
						<Sparkles className='size-5' />
					</Button>
				</SmartTooltip>

				{/* Communities Tab */}
				<SmartTooltip>
					<Button
						variant={activeTab === 'communities' ? 'secondary' : 'ghost'}
						size='icon'
						onClick={() => onTabChange('communities')}
						aria-label={t('Communities')}
						className={`size-12 rounded-xl ${activeTab === 'communities' ? 'text-primary' : ''}`}
					>
						<Users2 className='size-5' />
					</Button>
				</SmartTooltip>
			</div>

			{/* Bottom Navigation Items: Settings & Profile */}
			<div className='flex flex-col items-center gap-3 w-full px-2'>
				<SmartTooltip>
					<Button
						variant={activeTab === 'settings' ? 'secondary' : 'ghost'}
						size='icon'
						onClick={() => onTabChange('settings')}
						aria-label={t('Settings')}
						className={`size-12 rounded-xl ${activeTab === 'settings' ? 'text-primary' : ''}`}
					>
						<Settings className='size-5' />
					</Button>
				</SmartTooltip>

				<div className='pt-2 border-t border-border w-full flex justify-center'>
					<Avatar className='size-8 cursor-pointer hover:opacity-80 transition-opacity border border-border'>
						<AvatarImage src={userAvatar} alt='Profile' />
						<AvatarFallback>ME</AvatarFallback>
					</Avatar>
				</div>
			</div>
		</aside>
	);
};
