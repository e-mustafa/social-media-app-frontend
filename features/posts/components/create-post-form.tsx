'use client';

import { AttachedMediaFile, MediaUploader } from '@/shared/components/custom-ui/media-uploader';
import { SmartTooltip } from '@/shared/components/custom-ui/smart-tooltip';
import { RecordedVoiceNote, VoiceRecorder } from '@/shared/components/custom-ui/voice-recorder';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/utils/utils';
import { Globe2Icon, ImageIcon, Loader2Icon, LockIcon, SendIcon, UsersIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useCreatePost } from '../hooks/use-posts';
import { PostVisibility } from '../types';

const privacyOptions: Array<{ value: PostVisibility; icon: typeof Globe2Icon; translationKey: string }> = [
	{ value: 'public', icon: Globe2Icon, translationKey: 'posts.create.privacy.public' },
	{ value: 'friends', icon: UsersIcon, translationKey: 'posts.create.privacy.friends' },
	{ value: 'private', icon: LockIcon, translationKey: 'posts.create.privacy.private' },
];

interface CreatePostFormProps {
	className?: string;
}

export default function CreatePostForm({ className }: CreatePostFormProps) {
	const t = useTranslations();
	const createPostMutation = useCreatePost();
	const [content, setContent] = useState('');
	const [visibility, setVisibility] = useState<PostVisibility>('public');
	const [mediaFiles, setMediaFiles] = useState<AttachedMediaFile[]>([]);
	const [voiceNote, setVoiceNote] = useState<RecordedVoiceNote | null>(null);

	const maxFiles = 4;
	const disabled = createPostMutation.isPending || mediaFiles.length >= maxFiles;

	const fileInputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		return () => {
			mediaFiles.forEach((item) => URL.revokeObjectURL(item.preview));
			if (voiceNote) URL.revokeObjectURL(voiceNote.preview);
		};
	}, [mediaFiles, voiceNote]);

	const handleSubmit = async () => {
		const trimmedContent = content.trim();
		const attachments = [...mediaFiles.map((item) => item.file), ...(voiceNote ? [voiceNote.file] : [])];

		if (!trimmedContent && attachments.length === 0) {
			toast.warning(t('posts.create.emptyWarning') || 'Write something or attach media before posting.');
			return;
		}

		await createPostMutation.mutateAsync({
			content: trimmedContent || 'Shared media',
			visibility,
			isPublished: true,
			attachments,
		});

		mediaFiles.forEach((item) => URL.revokeObjectURL(item.preview));
		if (voiceNote) URL.revokeObjectURL(voiceNote.preview);
		setContent('');
		setMediaFiles([]);
		setVoiceNote(null);
		setVisibility('public');
	};

	return (
		<section className={cn('rounded-3xl border border-border/20 bg-card-blur p-4 shadow-sm sm:p-5', className)}>
			<div className='space-y-4'>
				<Textarea
					value={content}
					onChange={(event) => setContent(event.target.value)}
					placeholder={t('posts.create.placeholder') || "What's on your mind?"}
					className='min-h-32 resize-none rounded-2xl border-border/40 bg-background/40 text-base focus-visible:ring-brand-primary/40'
					maxLength={5000}
				/>

				<div className='flex flex-col gap-3 rounded-2xl border border-border/20 bg-background/30 p-3'>
					<p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
						{t('posts.create.privacy.label') || 'Privacy'}
					</p>
					<RadioGroup
						value={visibility}
						onValueChange={(value) => setVisibility(value as PostVisibility)}
						className='grid grid-cols-1 gap-2 sm:grid-cols-3'
					>
						{privacyOptions.map((option) => {
							const Icon = option.icon;
							return (
								<Label
									key={option.value}
									className={cn(
										'flex cursor-pointer items-center gap-2 rounded-xl border border-border/30 bg-card/40 p-3 text-sm transition-colors hover:bg-muted/50',
										visibility === option.value &&
											'border-brand-primary/50 bg-brand-primary/10 text-brand-primary',
									)}
								>
									<RadioGroupItem value={option.value} />
									<Icon className='size-4' />
									<span>{t(option.translationKey) || option.value}</span>
								</Label>
							);
						})}
					</RadioGroup>
				</div>

				<MediaUploader
					files={mediaFiles}
					fileInputRef={fileInputRef}
					onFilesChange={setMediaFiles}
					disabled={createPostMutation.isPending}
				/>

				<div className='flex flex-col gap-3 border-t border-border/30 pt-4 sm:flex-row sm:items-center sm:justify-between'>
					<div className='flex gap-3'>
						<VoiceRecorder
							recordedAudio={voiceNote}
							onRecordComplete={setVoiceNote}
							onRemove={() => setVoiceNote(null)}
							disabled={createPostMutation.isPending}
						/>

						<SmartTooltip content={`Attach media (max ${maxFiles})`}>
							<Button
								type='button'
								variant='ghost'
								size='icon'
								onClick={() => fileInputRef.current?.click()}
								disabled={disabled || mediaFiles.length >= maxFiles}
								className='size-10 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-colors'
							>
								<ImageIcon className='size-5' />
								<span className='sr-only'>Attach media</span>
							</Button>
						</SmartTooltip>
					</div>
					
					<Button
						type='button'
						onClick={handleSubmit}
						disabled={createPostMutation.isPending}
						className='gap-2 rounded-xl px-6 font-semibold text-white sm:ms-auto'
					>
						{createPostMutation.isPending ? (
							<>
								{t('posts.create.posting') || 'Posting...'}
								<Loader2Icon className='size-4 animate-spin' />
							</>
						) : (
							<>
								{t('posts.create.submit') || 'Post'}
								<SendIcon className='size-4 rotate-180 rtl:rotate-0' />
							</>
						)}
					</Button>
				</div>
			</div>
		</section>
	);
}
