import { cn } from '@/shared/utils/utils';
import { PlayIcon } from 'lucide-react';
import Image from 'next/image';
import { PostAttachment } from '../types';

interface PostMediaGridProps {
	attachments: PostAttachment[];
	onOpen?: (index: number) => void;
}

const isVideoAttachment = (attachment: PostAttachment) => {
	return attachment.resourceType === 'video' || attachment.url.match(/\.(mp4|webm|mov)(\?.*)?$/i) !== null;
};

export default function PostMediaGrid({ attachments, onOpen }: PostMediaGridProps) {
	const media = attachments.filter((attachment) => attachment.resourceType !== 'audio' && attachment.resourceType !== 'raw');
	const count = media.length;

	if (count === 0) return null;

	const gridLayoutClass = count === 1 ? 'grid-cols-1' : count === 2 ? 'grid-cols-2' : 'grid-cols-2 grid-rows-2';

	return (
		<div className={cn('grid gap-2 overflow-hidden rounded-2xl border border-border/20', gridLayoutClass)}>
			{media.slice(0, 4).map((item, index) => {
				const isLargeItemForThree = count === 3 && index === 0;
				const isVideo = isVideoAttachment(item);

				return (
					<div
						key={item.id || item.url}
						onClick={() => onOpen?.(index)}
						className={cn(
							'relative group overflow-hidden bg-black/10 w-full cursor-zoom-in',
							isLargeItemForThree ? 'row-span-2 h-full min-h-[320px]' : 'h-[160px] md:h-[220px]',
							count === 1 && 'h-[280px] md:h-[420px]',
							count === 2 && 'h-[190px] md:h-[280px]',
						)}
					>
						{isVideo ? (
							<div className='relative size-full'>
								<video src={item.url} className='size-full object-cover' preload='metadata' muted playsInline />
								<div className='pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100'>
									<div className='flex size-12 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur-md'>
										<PlayIcon className='size-5 fill-current' />
									</div>
								</div>
							</div>
						) : (
							<Image
								src={item.url}
								alt='Post attachment'
								fill
								className='object-cover transition-transform duration-500 group-hover:scale-105'
								sizes='(max-width: 768px) 100vw, 50vw'
							/>
						)}
						{attachments.length > 4 && index === 3 && (
							<div className='absolute inset-0 flex items-center justify-center bg-black/60 text-2xl font-bold text-white'>
								+{attachments.length - 4}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}
