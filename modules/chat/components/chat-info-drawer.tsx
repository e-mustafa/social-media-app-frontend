'use client';

import { MediaLightbox, LightboxMediaItem } from '@/shared/components/custom-ui/media-lightbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { cn } from '@/shared/utils/utils';
import { ArrowLeftIcon, BanIcon, BellOffIcon, ImageIcon, MicIcon, Trash2Icon, VideoIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AudioMessageBubble } from './audio-message-bubble';
import { AttachmentItem, ChatItem, Message } from '../types';
import { generateSoftDeleteFileName } from '../utils/media-soft-delete';

interface ChatInfoDrawerProps {
	conversation: ChatItem;
	messages: Message[];
	onBack: () => void;
	onBlockUser?: () => void;
	onSoftDeleteMedia?: (mediaId: string, newFileName: string) => void;
}

interface SharedMediaItem extends AttachmentItem {
	messageId: string;
}

const isLightboxMedia = (item: SharedMediaItem): item is SharedMediaItem & { type: 'image' | 'video' } => {
	return item.type === 'image' || item.type === 'video';
};

export function ChatInfoDrawer({
	conversation,
	messages,
	onBack,
	onBlockUser,
	onSoftDeleteMedia,
}: ChatInfoDrawerProps) {
	const t = useTranslations();
	const [softDeletedMap, setSoftDeletedMap] = useState<Record<string, { newName: string; isSoftDeleted: boolean }>>({});
	const [lightboxOpen, setLightboxOpen] = useState(false);
	const [lightboxIndex, setLightboxIndex] = useState(0);

	const allMediaItems = useMemo<SharedMediaItem[]>(() => {
		return messages.flatMap((message) =>
			(message.attachments || []).map((attachment) => ({
				...attachment,
				messageId: message.id,
			})),
		);
	}, [messages]);

	const mediaItems = useMemo<SharedMediaItem[]>(() => {
		return allMediaItems.filter((item) => {
			const deletedState = softDeletedMap[item.id];
			return !item.isSoftDeleted && !deletedState?.isSoftDeleted;
		});
	}, [allMediaItems, softDeletedMap]);

	const imageItems = mediaItems.filter((item) => item.type === 'image');
	const videoItems = mediaItems.filter((item) => item.type === 'video');
	const voiceItems = mediaItems.filter((item) => item.type === 'audio');
	const lightboxItems = mediaItems.filter(isLightboxMedia).map<LightboxMediaItem>((item) => ({
		id: item.id,
		url: item.url,
		type: item.type,
		alt: softDeletedMap[item.id]?.newName || item.name || conversation.name,
	}));

	const handleSoftDelete = (item: SharedMediaItem) => {
		const existingNames = Object.values(softDeletedMap).map((d) => d.newName);
		const newFileName = generateSoftDeleteFileName(item.name || 'file', existingNames);

		setSoftDeletedMap((prev) => ({
			...prev,
			[item.id]: { newName: newFileName, isSoftDeleted: true },
		}));

		if (onSoftDeleteMedia) {
			onSoftDeleteMedia(item.id, newFileName);
		}

		toast.info(t('chat.info.softDeletedToast', { fileName: newFileName }) || `File archived as ${newFileName}`);
	};

	const handleSoftDeleteAll = () => {
		const newMap: Record<string, { newName: string; isSoftDeleted: boolean }> = { ...softDeletedMap };
		const existingNames = Object.values(newMap).map((d) => d.newName);

		mediaItems.forEach((item) => {
			const newName = generateSoftDeleteFileName(item.name || 'file', existingNames);
			existingNames.push(newName);
			newMap[item.id] = { newName, isSoftDeleted: true };
			if (onSoftDeleteMedia) {
				onSoftDeleteMedia(item.id, newName);
			}
		});

		setSoftDeletedMap(newMap);
		toast.info(t('chat.info.allSoftDeletedToast') || 'All media items archived safely.');
	};

	const openLightbox = (item: SharedMediaItem) => {
		if (!isLightboxMedia(item)) return;
		const index = lightboxItems.findIndex((media) => media.id === item.id);
		setLightboxIndex(Math.max(index, 0));
		setLightboxOpen(true);
	};

	return (
		<section className='flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background text-foreground animate-in fade-in duration-200'>
			{/* Header with Back to Chat arrow button */}
			<header className='flex min-h-18 items-center justify-between border-b border-border/30 bg-card-blur px-4 py-3'>
				<div className='flex items-center gap-3'>
					<Button
						type='button'
						variant='ghost'
						size='icon'
						onClick={onBack}
						className='size-9 rounded-xl hover:bg-accent'
						aria-label={t('chat.info.backToChat') || 'Back to Chat'}
					>
						<ArrowLeftIcon className='size-5 rtl:rotate-180' />
					</Button>
					<div>
						<h2 className='text-sm font-semibold text-foreground'>{t('chat.info.title') || 'Chat Info'}</h2>
						<p className='text-xs text-muted-foreground'>{conversation.name}</p>
					</div>
				</div>
			</header>

			<ScrollArea className='min-h-0 flex-1'>
				<div className='max-w-2xl mx-auto space-y-6 p-5 sm:p-6'>
					{/* User Card */}
					<div className='flex flex-col items-center rounded-3xl border border-border/20 bg-card-blur p-6 text-center shadow-xs'>
						<div className='relative'>
							<Avatar className='size-24 border-2 border-border/40 shadow-sm'>
								<AvatarImage src={conversation.avatar} alt={conversation.name} />
								<AvatarFallback className='text-xl font-bold'>{conversation.name.slice(0, 2).toUpperCase()}</AvatarFallback>
							</Avatar>
							<span
								className={cn(
									'absolute bottom-1 end-1 size-4 rounded-full border-2 border-background',
									conversation.isOnline ? 'bg-emerald-500' : 'bg-muted-foreground/40',
								)}
							/>
						</div>
						<h2 className='mt-3 text-xl font-bold text-foreground'>{conversation.name}</h2>
						{conversation.username && <p className='text-sm text-muted-foreground'>@{conversation.username}</p>}
						{conversation.email && <p className='text-xs text-muted-foreground mt-0.5'>{conversation.email}</p>}
					</div>

					{/* Action Buttons */}
					<div className='grid grid-cols-2 gap-3'>
						<Button type='button' variant='outline' className='h-12 gap-2 rounded-2xl bg-card-blur font-medium'>
							<BellOffIcon className='size-4' />
							<span>{t('chat.info.mute') || 'Mute'}</span>
						</Button>
						<Button
							type='button'
							variant='outline'
							className='h-12 gap-2 rounded-2xl border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15 font-medium'
							onClick={onBlockUser}
						>
							<BanIcon className='size-4' />
							<span>{t('chat.info.block') || 'Block'}</span>
						</Button>
					</div>

					{/* Shared Media */}
					<section className='rounded-3xl border border-border/20 bg-card-blur p-5 space-y-4'>
						<div className='flex items-center justify-between gap-3'>
							<h3 className='font-semibold text-foreground text-sm'>{t('chat.info.sharedMedia') || 'Shared Media'}</h3>
							<Button
								type='button'
								variant='ghost'
								size='sm'
								className='h-8 rounded-xl text-destructive hover:bg-destructive/10 font-medium text-xs'
								onClick={handleSoftDeleteAll}
								disabled={mediaItems.length === 0}
							>
								<Trash2Icon className='me-1 size-3.5' />
								<span>{t('chat.info.deleteAll') || 'Delete All'}</span>
							</Button>
						</div>

						<Tabs defaultValue='images' className='w-full'>
							<TabsList className='grid w-full grid-cols-3 rounded-2xl bg-muted/60 p-1'>
								<TabsTrigger value='images' className='gap-1 rounded-xl text-xs font-medium'>
									<ImageIcon className='size-3.5' />
									<span>{t('chat.info.images') || 'Images'}</span>
								</TabsTrigger>
								<TabsTrigger value='videos' className='gap-1 rounded-xl text-xs font-medium'>
									<VideoIcon className='size-3.5' />
									<span>{t('chat.info.videos') || 'Videos'}</span>
								</TabsTrigger>
								<TabsTrigger value='voice' className='gap-1 rounded-xl text-xs font-medium'>
									<MicIcon className='size-3.5' />
									<span>{t('chat.info.voiceNotes') || 'Voice'}</span>
								</TabsTrigger>
							</TabsList>

							<TabsContent value='images' className='mt-4'>
								<MediaGrid
									items={imageItems}
									onOpen={openLightbox}
									onDelete={handleSoftDelete}
									emptyText={t('chat.info.noImages') || 'No images shared yet'}
								/>
							</TabsContent>

							<TabsContent value='videos' className='mt-4'>
								<MediaGrid
									items={videoItems}
									onOpen={openLightbox}
									onDelete={handleSoftDelete}
									emptyText={t('chat.info.noVideos') || 'No videos shared yet'}
								/>
							</TabsContent>

							<TabsContent value='voice' className='mt-4 space-y-2'>
								{voiceItems.length > 0 ? (
									voiceItems.map((item) => (
										<div key={item.id} className='flex items-center gap-2 rounded-2xl border border-border/20 bg-card/50 p-2'>
											<div className='min-w-0 flex-1'>
												<AudioMessageBubble src={item.url} duration={item.duration} isSender={false} />
											</div>
											<Button
												type='button'
												variant='ghost'
												size='icon'
												className='size-8 rounded-xl text-destructive hover:bg-destructive/10'
												onClick={() => handleSoftDelete(item)}
												aria-label={t('chat.info.deleteSingle') || 'Delete'}
											>
												<Trash2Icon className='size-4' />
											</Button>
										</div>
									))
								) : (
									<EmptyMedia text={t('chat.info.noVoiceNotes') || 'No voice notes shared yet'} />
								)}
							</TabsContent>
						</Tabs>
					</section>
				</div>
			</ScrollArea>

			<MediaLightbox items={lightboxItems} open={lightboxOpen} initialIndex={lightboxIndex} onOpenChange={setLightboxOpen} />
		</section>
	);
}

function MediaGrid({
	items,
	onOpen,
	onDelete,
	emptyText,
}: {
	items: SharedMediaItem[];
	onOpen: (item: SharedMediaItem) => void;
	onDelete: (item: SharedMediaItem) => void;
	emptyText: string;
}) {
	if (items.length === 0) return <EmptyMedia text={emptyText} />;

	return (
		<div className='grid grid-cols-3 gap-2 sm:grid-cols-4'>
			{items.map((item) => (
				<div key={item.id} className='group relative aspect-square overflow-hidden rounded-2xl border border-border/20 bg-black/10'>
					<button type='button' className='size-full cursor-pointer' onClick={() => onOpen(item)} aria-label={item.name || 'Open media'}>
						{item.type === 'video' ? (
							<video src={item.url} className='size-full object-cover' muted playsInline />
						) : (
							<Image src={item.url} alt={item.name || 'Shared media'} fill className='object-cover' sizes='33vw' />
						)}
					</button>
					<Button
						type='button'
						variant='ghost'
						size='icon'
						className='absolute end-1 top-1 size-7 rounded-full bg-black/60 text-white opacity-100 hover:bg-black/80 transition-opacity sm:opacity-0 sm:group-hover:opacity-100'
						onClick={() => onDelete(item)}
						aria-label='Delete media'
					>
						<Trash2Icon className='size-3.5' />
					</Button>
				</div>
			))}
		</div>
	);
}

function EmptyMedia({ text }: { text: string }) {
	return <div className='rounded-2xl border border-dashed border-border/30 bg-card/30 px-4 py-8 text-center text-sm text-muted-foreground'>{text}</div>;
}
