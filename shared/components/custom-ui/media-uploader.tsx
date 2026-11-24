'use client';

import { cn } from '@/shared/utils/utils';
import { ImageIcon, PlayIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React from 'react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { SmartTooltip } from '@/shared/components/custom-ui/smart-tooltip';

export interface AttachedMediaFile {
	file: File;
	preview: string;
}

export interface MediaUploaderProps {
	files: AttachedMediaFile[];
	onFilesChange: (files: AttachedMediaFile[]) => void;
	maxFiles?: number;
	disabled?: boolean;
	accept?: string;
	className?: string;
	fileInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function MediaUploader({
	files,
	onFilesChange,
	maxFiles = 4,
	disabled = false,
	accept = 'image/*,video/mp4,video/webm',
	className,
	fileInputRef,
}: MediaUploaderProps) {
	const t = useTranslations();
	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files) return;

		const selectedFiles = Array.from(e.target.files).filter(
			(file) => file.type.startsWith('image/') || file.type === 'video/mp4' || file.type === 'video/webm',
		);

		if (selectedFiles.length === 0) {
			toast.warning('Only image files, MP4 videos, and WEBM videos are supported.');
			return;
		}

		if (files.length + selectedFiles.length > maxFiles) {
			toast.warning(`You can only attach up to ${maxFiles} media files.`);
			return;
		}

		const newAttachedFiles: AttachedMediaFile[] = selectedFiles.map((file) => ({
			file,
			preview: URL.createObjectURL(file),
		}));

		onFilesChange([...files, ...newAttachedFiles]);
		if (fileInputRef?.current) {
			fileInputRef.current.value = '';
		}
	};

	const removeFile = (index: number) => {
		const target = files[index];
		if (target) {
			URL.revokeObjectURL(target.preview);
		}
		onFilesChange(files.filter((_, i) => i !== index));
	};

	return (
		<div className={cn('space-y-3 w-full', className)}>
			<input
				type='file'
				ref={fileInputRef}
				onChange={handleFileSelect}
				multiple
				disabled={disabled || files.length >= maxFiles}
				accept={accept}
				className='hidden'
			/>

			<SmartTooltip content={t('posts.create.mediaTooltip', { maxFiles }) || `Attach media (max ${maxFiles})`}>
				<Button
					type='button'
					variant='ghost'
					size='icon'
					onClick={() => fileInputRef?.current?.click()}
					disabled={disabled || files.length >= maxFiles}
					className='size-10 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-colors'
				>
					<ImageIcon className='size-5' />
					<span className='sr-only'>{t('posts.create.media') || 'Attach media'}</span>
				</Button>
			</SmartTooltip>

			{files.length > 0 && (
				<div className='grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2'>
					{files.map((item, index) => {
						const isVideo = item.file.type.startsWith('video/');

						return (
							<div
								key={`${item.file.name}-${index}`}
								className='relative aspect-square rounded-xl overflow-hidden border border-border/40 group bg-muted/20 shadow-xs animate-in zoom-in-95 duration-150'
							>
								{isVideo ? (
									<div className='relative size-full'>
										<video
											src={item.preview}
											className='size-full object-cover'
											preload='metadata'
											muted
											playsInline
										/>
										<div className='absolute inset-0 flex items-center justify-center bg-black/30'>
											<div className='flex size-10 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur-md'>
												<PlayIcon className='size-4 fill-current' />
											</div>
										</div>
									</div>
								) : (
									<img
										src={item.preview}
										alt={item.file.name}
										className='size-full object-cover transition-transform duration-300 group-hover:scale-105'
									/>
								)}
								<button
									type='button'
									onClick={() => removeFile(index)}
									disabled={disabled}
									className='absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-black/80 rounded-full text-white transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 shadow-md z-10'
									aria-label={t('posts.create.removeMedia') || 'Remove media'}
								>
									<XIcon className='size-3.5' />
								</button>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
