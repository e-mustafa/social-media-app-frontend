'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { formatTimeHelper } from '@/shared/utils/format-time';
import { cn } from '@/shared/utils/utils';
import { MicIcon, MicOffIcon, PhoneOffIcon, VideoIcon, VideoOffIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { IChat } from '../types/chat.types';

export type CallType = 'voice' | 'video';

interface CallScreenModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	conversation: IChat;
	type: CallType;
	mode?: 'incoming' | 'outgoing';
}

export function CallScreenModal({ open, onOpenChange, conversation, type, mode = 'outgoing' }: CallScreenModalProps) {
	const t = useTranslations();
	const [duration, setDuration] = useState(0);
	const [isMicMuted, setIsMicMuted] = useState(false);
	const [isCameraEnabled, setIsCameraEnabled] = useState(type === 'video');

	const participant = conversation.participants?.[0];
	const displayName = conversation.name || participant?.name || participant?.firstName || 'Chat';
	const avatarUrl = conversation.avatar || (typeof participant?.avatar === 'string' ? participant.avatar : participant?.avatar?.url) || '';

	useEffect(() => {
		if (!open) {
			setDuration(0);
			setIsMicMuted(false);
			setIsCameraEnabled(type === 'video');
			return;
		}

		const interval = setInterval(() => setDuration((value) => value + 1), 1000);
		return () => clearInterval(interval);
	}, [open, type]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className='overflow-hidden border-border/20 bg-card-glass p-0 text-center backdrop-blur-2xl sm:max-w-md'
				showCloseButton={false}
			>
				<div
					className={cn(
						'relative px-6 py-8',
						type === 'video'
							? 'bg-linear-to-br from-brand-primary/20 via-background/40 to-background'
							: 'bg-linear-to-br from-accent/30 via-background/60 to-background',
					)}
				>
					<div className='absolute inset-0 bg-radial from-brand-primary/20 via-transparent to-transparent opacity-70 blur-2xl' />
					<div className='relative z-10 space-y-6'>
						<DialogHeader className='items-center text-center'>
							<DialogTitle>{type === 'video' ? t('chat.call.videoCall') || 'Video Call' : t('chat.call.voiceCall') || 'Voice Call'}</DialogTitle>
							<DialogDescription>
								{mode === 'incoming' ? t('chat.call.incoming') || 'Incoming call...' : t('chat.call.outgoing') || 'Outgoing call...'}
							</DialogDescription>
						</DialogHeader>

						<div className='mx-auto flex flex-col items-center'>
							<Avatar className='size-28 border-4 border-white/20 shadow-2xl'>
								<AvatarImage src={avatarUrl} alt={displayName} />
								<AvatarFallback className='text-2xl'>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
							</Avatar>
							<h2 className='mt-4 text-xl font-bold text-foreground'>{displayName}</h2>
							<p className='mt-1 font-mono text-sm text-muted-foreground'>{formatTimeHelper(duration)}</p>
						</div>

						<div className='flex items-center justify-center gap-3'>
							<Button
								type='button'
								variant='outline'
								size='icon'
								className={cn(
									'size-12 rounded-full bg-background/60 cursor-pointer',
									isMicMuted && 'bg-destructive/10 text-destructive',
								)}
								onClick={() => setIsMicMuted((value) => !value)}
								aria-label={t('chat.call.muteMic') || 'Mute microphone'}
							>
								{isMicMuted ? <MicOffIcon className='size-5' /> : <MicIcon className='size-5' />}
							</Button>
							<Button
								type='button'
								variant='outline'
								size='icon'
								className={cn(
									'size-12 rounded-full bg-background/60 cursor-pointer',
									!isCameraEnabled && 'bg-muted text-muted-foreground',
								)}
								onClick={() => setIsCameraEnabled((value) => !value)}
								aria-label={t('chat.call.toggleCamera') || 'Toggle camera'}
							>
								{isCameraEnabled ? <VideoIcon className='size-5' /> : <VideoOffIcon className='size-5' />}
							</Button>
							<Button
								type='button'
								size='icon'
								className='size-14 rounded-full bg-destructive text-white hover:bg-destructive/90 cursor-pointer'
								onClick={() => onOpenChange(false)}
								aria-label={t('chat.call.endCall') || 'End call'}
							>
								<PhoneOffIcon className='size-6' />
							</Button>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
