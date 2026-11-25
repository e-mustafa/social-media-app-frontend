'use client';

import { AttachedMediaFile, MediaUploader } from '@/shared/components/custom-ui/media-uploader';
import { SmartTooltip } from '@/shared/components/custom-ui/smart-tooltip';
import { RecordedVoiceNote, VoiceRecorder } from '@/shared/components/custom-ui/voice-recorder';
import EmojiPicker from '@/shared/components/emoji-picker';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { ImageIcon, Loader2Icon, SendIcon, SmileIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useCreateComment } from '../hooks/use-comments';

interface CommentInputProps {
	postId: string;
	replyToCommentId?: string;
	onSubmitted?: () => void;
	compact?: boolean;
}

export default function CommentInput({ postId, replyToCommentId, onSubmitted, compact = false }: CommentInputProps) {
	const t = useTranslations();
	const createCommentMutation = useCreateComment();
	const [content, setContent] = useState('');
	const [mediaFiles, setMediaFiles] = useState<AttachedMediaFile[]>([]);
	const [voiceNote, setVoiceNote] = useState<RecordedVoiceNote | null>(null);
	const mediaFileInputRef = useRef<HTMLInputElement | null>(null);
	const maxFiles = 4;
	const disabled = createCommentMutation.isPending || mediaFiles.length >= maxFiles;

	useEffect(() => {
		return () => {
			mediaFiles.forEach((item) => URL.revokeObjectURL(item.preview));
			if (voiceNote) URL.revokeObjectURL(voiceNote.preview);
		};
	}, [mediaFiles, voiceNote]);

	const handleSubmit = async () => {
		const trimmedContent = content.trim();
		const attachments = [...mediaFiles.map((item) => item.file), ...(voiceNote ? [voiceNote.file] : [])];

		if (trimmedContent.length < 2) {
			toast.warning(t('comments.errors.empty') || 'Comment must be at least 2 characters.');
			return;
		}

		await createCommentMutation.mutateAsync({
			postId,
			content: trimmedContent,
			replyToCommentId,
			attachments,
		});

		mediaFiles.forEach((item) => URL.revokeObjectURL(item.preview));
		if (voiceNote) URL.revokeObjectURL(voiceNote.preview);
		setContent('');
		setMediaFiles([]);
		setVoiceNote(null);
		onSubmitted?.();
	};

	return (
		<div className='space-y-3 rounded-2xl border border-border/20 bg-background/35 p-3'>
			<div className='relative'>
				<Textarea
					value={content}
					onChange={(event) => setContent(event.target.value)}
					placeholder={replyToCommentId ? t('comments.input.replyPlaceholder') : t('comments.input.placeholder')}
					className={
						compact
							? 'min-h-20 resize-none rounded-xl bg-card/50 pe-11'
							: 'min-h-28 resize-none rounded-xl bg-card/50 pe-11'
					}
					maxLength={1000}
				/>
				<EmojiPicker
					onEmojiSelect={(emoji) => setContent((value) => `${value}${emoji}`)}
					trigger={
						<Button
							type='button'
							variant='ghost'
							size='icon'
							className='absolute bottom-2 end-2 size-8 rounded-lg text-muted-foreground'
						>
							<SmileIcon className='size-4' />
						</Button>
					}
				/>
			</div>

			<MediaUploader
				files={mediaFiles}
				onFilesChange={setMediaFiles}
				disabled={createCommentMutation.isPending}
				fileInputRef={mediaFileInputRef}
			/>

			<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
				<div className='flex gap-3'>
					<VoiceRecorder
						recordedAudio={voiceNote}
						onRecordComplete={setVoiceNote}
						onRemove={() => setVoiceNote(null)}
						disabled={createCommentMutation.isPending}
					/>
					<SmartTooltip content={t('posts.create.mediaTooltip', { maxFiles }) || `Attach media (max ${maxFiles})`}>
						<Button
							type='button'
							variant='ghost'
							size='icon'
							onClick={() => mediaFileInputRef.current?.click()}
							disabled={disabled || mediaFiles.length >= maxFiles}
							className='size-10 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-colors'
						>
							<ImageIcon className='size-5' />
							<span className='sr-only'>{t('posts.create.media') || 'Attach media'}</span>
						</Button>
					</SmartTooltip>
				</div>

				<Button
					type='button'
					onClick={handleSubmit}
					disabled={createCommentMutation.isPending}
					className='gap-2 rounded-xl text-white sm:ms-auto'
				>
					{createCommentMutation.isPending ? (
						<Loader2Icon className='size-4 animate-spin' />
					) : (
						<>
							{replyToCommentId ? t('comments.actions.reply') : t('comments.actions.comment')}
							<SendIcon className='size-4 rotate-180 rtl:rotate-0' />
						</>
					)}
				</Button>
			</div>
		</div>
	);
}
