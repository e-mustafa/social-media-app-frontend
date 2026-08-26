'use client';

import { SmartTooltip } from '@/shared/components/custom-ui/smart-tooltip';
import EmojiPicker from '@/shared/components/emoji-picker';
import { Button } from '@/shared/components/ui/button';
import { appConfig } from '@/shared/config/app-configs';
import { formatTimeHelper } from '@/shared/utils/format-time';
import { cn } from '@/shared/utils/utils';
import {
	CheckIcon,
	FileMusicIcon,
	Loader2Icon,
	Mic,
	Paperclip,
	Pause,
	Play,
	SendIcon,
	SmileIcon,
	Trash2Icon,
	XIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface MessageInputProps {
	onSend: (data: { messageText: string; audioBlob: Blob | null; attachments: File[] }) => Promise<void> | void;
	isLoading?: boolean;
}

interface AttachedFile {
	file: File;
	preview: string;
}

const MAX_FILE_ATTACHMENTS = 10;
const MAX_VOICE_ATTACHMENTS = 1;

/* ==========================================================================
   SUB-COMPONENTS (Pure & Memory Leak Safe)
   ========================================================================== */

// 1. Image Preview Component
const ImagePreview = ({ src, alt }: { src: string; alt: string }) => {
	return <img src={src} alt={alt} className='w-full h-full object-cover animate-in fade-in duration-200' />;
};

// 2. Individual Attachment Card Component
interface AttachmentCardProps {
	attachment: AttachedFile;
	idx: number;
	isPlaying: boolean;
	duration: number;
	isLoading: boolean;
	onTogglePlay: (index: number, file: File) => void;
	onRemove: (index: number) => void;
	voiceNoteLabel: string;
}

const AttachmentCard = ({
	attachment,
	idx,
	isPlaying,
	duration,
	isLoading,
	onTogglePlay,
	onRemove,
	voiceNoteLabel,
}: AttachmentCardProps) => {
	const { file, preview } = attachment;
	const isImage = file.type.startsWith('image/');

	return (
		<div className='relative aspect-square rounded-xl overflow-hidden border border-border/60 group bg-card shadow-xs flex flex-col justify-between transition-all duration-200 hover:border-brand-primary/40 animate-in zoom-in-95 duration-150'>
			{isImage ? (
				<ImagePreview src={preview} alt={file.name} />
			) : (
				<div className='w-full h-full flex flex-col items-center justify-center p-2 text-center gap-1.5 bg-gradient-to-b from-brand-primary/5 to-brand-primary/10 relative'>
					<FileMusicIcon
						className={cn(
							'size-6 text-brand-primary/70 transition-transform duration-300',
							isPlaying && 'scale-110 text-brand-primary animate-pulse',
						)}
					/>

					<Button
						type='button'
						variant='ghost'
						size='icon'
						onClick={() => onTogglePlay(idx, file)}
						disabled={isLoading}
						className='rounded-full size-8 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary flex items-center justify-center transition-all shadow-xs cursor-pointer'
					>
						{isPlaying ? (
							<Pause className='size-4 fill-brand-primary text-brand-primary' />
						) : (
							<Play className='size-4 fill-brand-primary text-brand-primary ml-0.5' />
						)}
					</Button>

					<div className='flex flex-col gap-0.5 max-w-full px-1'>
						<span className='text-[10px] font-semibold text-foreground max-w-[90px] truncate block dir-auto'>
							{file.name.startsWith('voice-note-') ? voiceNoteLabel : file.name}
						</span>
						<span className='text-[9px] text-muted-foreground font-mono dir-ltr'>
							{duration ? formatTimeHelper(duration) : '--:--'}
						</span>
					</div>
				</div>
			)}

			{/* Remove individual attachment button */}
			<button
				type='button'
				onClick={() => onRemove(idx)}
				className='absolute top-1.5 right-1.5 p-1 bg-background/80 hover:bg-destructive hover:text-destructive-foreground backdrop-blur-md rounded-full text-foreground transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 shadow-md z-10 cursor-pointer border border-border/50'
			>
				<XIcon className='size-3' />
			</button>
		</div>
	);
};

// 3. Active Recording Card Component
interface ActiveRecordingCardProps {
	recordingTime: number;
	onCancel: () => void;
	onStop: () => void;
}

const ActiveRecordingCard = ({ recordingTime, onCancel, onStop }: ActiveRecordingCardProps) => {
	const t = useTranslations();
	return (
		<div className='relative aspect-square rounded-xl overflow-hidden border-2 border-dashed border-rose-500/50 bg-rose-500/5 p-2 flex flex-col justify-between items-center shadow-xs animate-in zoom-in-95 duration-200'>
			{/* Pulse badge indicating active capture */}
			<div className='flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full'>
				<span className='size-1.5 bg-rose-500 rounded-full animate-ping' />
				<span className='text-[8px] font-semibold text-rose-600 uppercase tracking-wider dir-auto'>
					{t('messages.voiceRecording.live') || 'تسجيل مباشر'}
				</span>
			</div>

			{/* Dynamic Waveform Visualizer */}
			<div className='flex items-end gap-1 h-6 px-2 my-auto'>
				<div className='w-1 h-2 bg-rose-500 rounded-full animate-pulse' />
				<div className='w-1 h-5 bg-rose-500 rounded-full animate-pulse delay-75' />
				<div className='w-1 h-3 bg-rose-500 rounded-full animate-pulse delay-150' />
				<div className='w-1 h-6 bg-rose-500 rounded-full animate-pulse delay-100' />
				<div className='w-1 h-2 bg-rose-500 rounded-full animate-pulse' />
			</div>

			{/* Timer & Controls */}
			<div className='w-full flex flex-col items-center gap-1'>
				<span className='text-[10px] font-mono font-bold text-rose-600 dir-ltr'>{formatTimeHelper(recordingTime)}</span>

				<div className='flex gap-1.5 w-full justify-center'>
					<SmartTooltip>
						<Button
							type='button'
							variant='ghost'
							size='icon'
							aria-label={t('messages.voiceRecording.cancel')}
							onClick={onCancel}
							className='size-7 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 cursor-pointer'
						>
							<Trash2Icon className='size-3.5' />
						</Button>
					</SmartTooltip>
					<SmartTooltip>
						<Button
							type='button'
							variant='ghost'
							size='icon'
							aria-label={t('messages.voiceRecording.send')}
							onClick={onStop}
							className='size-7 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 cursor-pointer'
						>
							<CheckIcon className='size-3.5' />
						</Button>
					</SmartTooltip>
				</div>
			</div>
		</div>
	);
};

/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */

export default function MessageInput({ onSend, isLoading = false }: MessageInputProps) {
	const t = useTranslations();

	// Form and attachment states
	const [messageText, setMessageText] = useState('');
	const [attachments, setAttachments] = useState<AttachedFile[]>([]);
	const [audioDurations, setAudioDurations] = useState<Record<string, number>>({});

	// Live audio recording states
	const [isRecording, setIsRecording] = useState(false);
	const [recordingTime, setRecordingTime] = useState(0);

	// Audio playback states
	const [playingIndex, setPlayingIndex] = useState<number | null>(null);

	// Unified React refs
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const audioChunksRef = useRef<Blob[]>([]);
	const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const recordingTimeRef = useRef<number>(0);

	// Gesture and pointer triggers
	const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const isHoldModeRef = useRef(false);

	// Dynamic ref to attachments for safe cleanup during component unmount
	const attachmentsRef = useRef<AttachedFile[]>(attachments);
	useEffect(() => {
		attachmentsRef.current = attachments;
	}, [attachments]);

	// Derived state flags for attachment rules
	const hasVoiceNote = attachments.some((att) => att.file.name.startsWith('voice-note-'));
	const currentMaxAllowed = hasVoiceNote || isRecording ? MAX_VOICE_ATTACHMENTS : MAX_FILE_ATTACHMENTS;

	// Adjust Textarea height dynamically as user types
	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto';
			textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
		}
	}, [messageText]);

	// Clean up object URLs on component unmount
	useEffect(() => {
		return () => {
			if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
			if (audioPlayerRef.current) {
				audioPlayerRef.current.pause();
			}
			attachmentsRef.current.forEach((att) => URL.revokeObjectURL(att.preview));
		};
	}, []);

	const handleEmojiSelect = (emoji: string) => {
		setMessageText((prev) => prev + emoji);
	};

	// Handle standard file picker selection (Up to 10 files, blocked if voice note exists)
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const selectedFiles = Array.from(e.target.files);

			if (hasVoiceNote || isRecording) {
				toast.warning(t('messages.errors.voiceNoteOnly') || 'Cannot attach files when a voice note is present.');
				return;
			}

			if (attachments.length + selectedFiles.length > MAX_FILE_ATTACHMENTS) {
				toast.warning(t('messages.errors.maxFilesWarning') || 'You can attach up to 10 files max.');
				return;
			}

			const newAttachments: AttachedFile[] = selectedFiles.map((file) => {
				const preview = URL.createObjectURL(file);

				if (file.type.startsWith('audio/')) {
					const tempAudio = new Audio(preview);
					tempAudio.onloadedmetadata = () => {
						setAudioDurations((prev) => ({
							...prev,
							[file.name]: Math.round(tempAudio.duration),
						}));
					};
				}

				return { file, preview };
			});

			setAttachments((prev) => [...prev, ...newAttachments]);
		}
	};

	const removeAttachment = (index: number) => {
		const target = attachments[index];

		if (playingIndex === index) {
			audioPlayerRef.current?.pause();
			setPlayingIndex(null);
		}

		URL.revokeObjectURL(target.preview);

		setAttachments((prev) => prev.filter((_, i) => i !== index));
		setAudioDurations((prev) => {
			const copy = { ...prev };
			delete copy[target.file.name];
			return copy;
		});
	};

	const handleClearAll = () => {
		attachments.forEach((att) => URL.revokeObjectURL(att.preview));
		setAttachments([]);
		setAudioDurations({});
		setPlayingIndex(null);
		if (audioPlayerRef.current) {
			audioPlayerRef.current.pause();
			audioPlayerRef.current = null;
		}
	};

	// Audio Recording Controllers (Exclusive mode: Blocked if file attachments exist)
	const startRecording = async () => {
		if (attachments.length > 0) {
			toast.warning(t('messages.errors.noVoiceWithFiles') || 'Cannot record voice note when other files are attached.');
			return;
		}

		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			audioChunksRef.current = [];

			let options: MediaRecorderOptions = {};
			if (MediaRecorder.isTypeSupported('audio/webm')) {
				options = { mimeType: 'audio/webm' };
			} else if (MediaRecorder.isTypeSupported('audio/mp4')) {
				options = { mimeType: 'audio/mp4' };
			}

			const mediaRecorder = new MediaRecorder(stream, options);
			mediaRecorderRef.current = mediaRecorder;

			mediaRecorder.ondataavailable = (event: BlobEvent) => {
				if (event.data.size > 0) {
					audioChunksRef.current.push(event.data);
				}
			};

			mediaRecorder.onstop = () => {
				const mimeType = mediaRecorder.mimeType || 'audio/webm';
				const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';

				const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
				const fileName = `voice-note-${Date.now()}.${extension}`;
				const audioFile = new File([audioBlob], fileName, { type: mimeType });

				const preview = URL.createObjectURL(audioFile);
				const finalDuration = recordingTimeRef.current;

				setAudioDurations((prev) => ({
					...prev,
					[fileName]: finalDuration,
				}));

				setAttachments((prev) => {
					if (prev.length >= MAX_VOICE_ATTACHMENTS) {
						URL.revokeObjectURL(preview);
						return prev;
					}
					return [...prev, { file: audioFile, preview }];
				});

				stream.getTracks().forEach((track) => track.stop());
			};

			mediaRecorder.start();
			setIsRecording(true);
			setRecordingTime(0);
			recordingTimeRef.current = 0;

			timerIntervalRef.current = setInterval(() => {
				setRecordingTime((prev) => {
					const updatedTime = prev + 1;
					recordingTimeRef.current = updatedTime;
					return updatedTime;
				});
			}, 1000);
		} catch (err) {
			console.error('Microphone access denied:', err);
			toast.error(t('messages.errors.micAccessDenied') || 'Microphone access denied.');
		}
	};

	const stopRecording = () => {
		if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
		mediaRecorderRef.current.stop();
		setIsRecording(false);
		if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
	};

	const cancelRecording = () => {
		if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;

		mediaRecorderRef.current.onstop = () => {
			if (mediaRecorderRef.current) {
				const stream = mediaRecorderRef.current.stream;
				stream.getTracks().forEach((track) => track.stop());
			}
		};

		mediaRecorderRef.current.stop();
		setIsRecording(false);
		setRecordingTime(0);
		recordingTimeRef.current = 0;

		if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
	};

	// Audio Playback Controls
	const togglePlayAttachment = (index: number, file: File) => {
		if (playingIndex === index) {
			audioPlayerRef.current?.pause();
			setPlayingIndex(null);
		} else {
			if (audioPlayerRef.current) {
				audioPlayerRef.current.pause();
			}

			const targetPreview = attachments[index].preview;
			const audio = new Audio(targetPreview);
			audioPlayerRef.current = audio;
			setPlayingIndex(index);

			audio.play();
			audio.onended = () => {
				setPlayingIndex(null);
			};
		}
	};

	// Pointer event gesture handler for recording
	const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
		if (isLoading) return;
		e.preventDefault();

		if (attachments.length > 0) {
			toast.warning(t('messages.errors.noVoiceWithFiles') || 'Cannot record voice note when other files are attached.');
			return;
		}

		e.currentTarget.setPointerCapture(e.pointerId);
		isHoldModeRef.current = false;

		holdTimeoutRef.current = setTimeout(() => {
			isHoldModeRef.current = true;
			startRecording();
		}, 350);
	};

	const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
		if (isLoading) return;
		e.preventDefault();
		e.currentTarget.releasePointerCapture(e.pointerId);

		if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);

		if (isHoldModeRef.current) {
			stopRecording();
		} else {
			if (isRecording) {
				stopRecording();
			} else {
				startRecording();
			}
		}
	};

	const handleSend = async () => {
		if (isLoading) return;

		const voiceNote = attachments.find((att) => att.file.name.startsWith('voice-note-'));
		const remaining = attachments.filter((att) => !att.file.name.startsWith('voice-note-'));

		try {
			await onSend({
				messageText,
				audioBlob: voiceNote ? voiceNote.file : null,
				attachments: remaining.map((att) => att.file),
			});

			// Clear inputs only on success
			attachments.forEach((att) => URL.revokeObjectURL(att.preview));

			setMessageText('');
			setAttachments([]);
			setAudioDurations({});
			setPlayingIndex(null);
			if (audioPlayerRef.current) {
				audioPlayerRef.current.pause();
				audioPlayerRef.current = null;
			}
		} catch (error) {
			console.error('Failed to submit message:', error);
		}
	};

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!isLoading && !isRecording && (messageText.trim() || attachments.length > 0)) {
			handleSend();
		}
	};

	// Keyboard shortcut handler (Enter to send, Shift+Enter for new line)
	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			if (!isLoading && !isRecording && (messageText.trim() || attachments.length > 0)) {
				handleSend();
			}
		}
	};

	const maxMessageLength = appConfig?.messages?.maxLength || 1000;
	const hasContent = messageText.trim().length > 0 || attachments.length > 0;

	return (
		<form onSubmit={handleSubmit} className='flex flex-col gap-2 w-full'>
			{/* Attachment Previews Grid */}
			{(attachments.length > 0 || isRecording) && (
				<div className='p-2.5 bg-muted/60 border border-border/60 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-200'>
					<div className='flex items-center justify-between text-xs text-muted-foreground mb-2 px-1'>
						<span className='font-medium dir-auto'>
							{t('messages.attachments.title') || 'المرفقات'} ({attachments.length + (isRecording ? 1 : 0)}/
							{currentMaxAllowed})
						</span>
						{attachments.length > 0 && !isRecording && (
							<Button
								type='button'
								variant='ghost'
								size='sm'
								className='h-auto p-1 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-md cursor-pointer transition-colors'
								onClick={handleClearAll}
							>
								{t('common.clearAll') || 'مسح الكل'}
							</Button>
						)}
					</div>

					<div className='grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5'>
						{attachments.map((attachment, idx) => (
							<AttachmentCard
								key={attachment.file.name + idx}
								attachment={attachment}
								idx={idx}
								isPlaying={playingIndex === idx}
								duration={audioDurations[attachment.file.name] || 0}
								isLoading={isLoading}
								onTogglePlay={togglePlayAttachment}
								onRemove={removeAttachment}
								voiceNoteLabel={t('messages.voiceRecorded') || 'تسجيل صوتي'}
							/>
						))}

						{isRecording && (
							<ActiveRecordingCard recordingTime={recordingTime} onCancel={cancelRecording} onStop={stopRecording} />
						)}
					</div>
				</div>
			)}

			{/* Main Single Bar WhatsApp Layout */}
			<div className='flex items-end gap-1.5 sm:gap-2 w-full'>
				{/* Emoji & File Attachment Actions */}
				<div className='flex items-center gap-0.5 mb-1 shrink-0'>
					<EmojiPicker
						onEmojiSelect={handleEmojiSelect}
						trigger={
							<Button
								type='button'
								variant='ghost'
								size='icon'
								aria-label='Add Emoji'
								className='size-9 rounded-full text-muted-foreground hover:text-foreground cursor-pointer transition-colors'
							>
								<SmileIcon className='size-5' />
							</Button>
						}
					/>

					<input
						type='file'
						ref={fileInputRef}
						onChange={handleFileChange}
						multiple
						disabled={isLoading || hasVoiceNote || isRecording}
						accept='image/*,audio/*'
						className='hidden'
					/>
					<SmartTooltip>
						<Button
							type='button'
							variant='ghost'
							size='icon'
							aria-label={t('messages.attachments.add') || 'Attach File'}
							onClick={() => fileInputRef.current?.click()}
							disabled={attachments.length >= MAX_FILE_ATTACHMENTS || isRecording || hasVoiceNote || isLoading}
							className='size-9 rounded-full text-muted-foreground hover:text-foreground cursor-pointer transition-colors disabled:opacity-40'
						>
							<Paperclip className='size-5' />
						</Button>
					</SmartTooltip>
				</div>

				{/* Text Input Field Container (Auto-Expanding) */}
				<div className='flex-1 bg-muted/50 border border-border/80 focus-within:border-brand-primary/60 rounded-2xl p-2 transition-colors flex items-center min-h-[42px]'>
					<textarea
						ref={textareaRef}
						rows={1}
						value={messageText}
						onChange={(e) => setMessageText(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder={t('messages.attachments.textareaPlaceholder') || 'اكتب رسالتك هنا...'}
						maxLength={maxMessageLength}
						className='w-full bg-transparent border-0 outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground max-h-32 min-h-[24px] leading-6 py-0 px-1'
					/>
				</div>

				{/* Dynamic Action Button: Send Button OR Mic Button */}
				{hasContent || isLoading ? (
					<Button
						type='submit'
						size='icon'
						disabled={isLoading || isRecording}
						className='rounded-full size-10 shrink-0 bg-brand-primary text-brand-primary-foreground hover:bg-brand-primary/90 transition-all duration-200 shadow-xs mb-0.5 cursor-pointer'
						title='Send message'
					>
						{isLoading ? (
							<Loader2Icon className='size-5 animate-spin' />
						) : (
							<SendIcon className='size-4 transform rotate-180 rtl:rotate-0 ms-0.5' />
						)}
					</Button>
				) : (
					<Button
						type='button'
						size='icon'
						onPointerDown={handlePointerDown}
						onPointerUp={handlePointerUp}
						disabled={isLoading || (attachments.length > 0 && !isRecording)}
						className={cn(
							'rounded-full size-10 shrink-0 transition-all duration-200 shadow-xs mb-0.5 cursor-pointer touch-none select-none border-0',
							isRecording
								? 'bg-rose-500 hover:bg-rose-600 scale-105 text-white animate-pulse'
								: 'bg-brand-primary text-brand-primary-foreground hover:bg-brand-primary/90 disabled:opacity-40',
						)}
						title='Record voice message'
					>
						<Mic className='size-5' />
					</Button>
				)}
			</div>
		</form>
	);
}
