'use client';

import { SmartTooltip } from '@/shared/components/custom-ui/smart-tooltip';
import EmojiPicker from '@/shared/components/emoji-picker';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
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

/* ==========================================================================
   SUB-COMPONENTS (Pure & Memory Leak Safe)
   ========================================================================== */

// 1. Simple Image Preview Component
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
		<div className='relative aspect-square rounded-2xl overflow-hidden border border-border/60 group bg-muted/30 shadow-xs flex flex-col justify-between transition-all duration-200 hover:border-brand-primary/40 animate-in zoom-in-95 duration-150'>
			{isImage ? (
				<ImagePreview src={preview} alt={file.name} />
			) : (
				<div className='w-full h-full flex flex-col items-center justify-center p-3 text-center gap-2 bg-gradient-to-b from-brand-primary/5 to-brand-primary/10 relative'>
					<FileMusicIcon
						className={cn(
							'size-7 text-brand-primary/70 transition-transform duration-300',
							isPlaying && 'scale-110 text-brand-primary animate-pulse',
						)}
					/>

					<Button
						type='button'
						variant='ghost'
						size='icon'
						onClick={() => onTogglePlay(idx, file)}
						disabled={isLoading}
						className='rounded-full size-10 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary flex items-center justify-center transition-all shadow-xs cursor-pointer'
					>
						{isPlaying ? (
							<Pause className='size-5 fill-brand-primary text-brand-primary' />
						) : (
							<Play className='size-5 fill-brand-primary text-brand-primary ml-0.5' />
						)}
					</Button>

					<div className='flex flex-col gap-0.5 mt-1 max-w-full px-1'>
						<span className='text-[11px] font-semibold text-foreground max-w-[110px] truncate block dir-auto'>
							{file.name.startsWith('voice-note-') ? voiceNoteLabel : file.name}
						</span>
						<span className='text-[10px] text-muted-foreground font-mono dir-ltr'>
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
				<XIcon className='size-3.5' />
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
		<div className='relative aspect-square rounded-2xl overflow-hidden border-2 border-dashed border-rose-500/50 bg-rose-500/5 p-3 flex flex-col justify-between items-center shadow-xs animate-in zoom-in-95 duration-200'>
			{/* Pulse badge indicating active capture */}
			<div className='flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full'>
				<span className='size-1.5 bg-rose-500 rounded-full animate-ping' />
				<span className='text-[9px] font-semibold text-rose-600 uppercase tracking-wider dir-auto'>
					{t('messages.voiceRecording.live') || 'تسجيل مباشر'}
				</span>
			</div>

			{/* Dynamic Waveform Visualizer */}
			<div className='flex items-end gap-1 h-8 px-2 my-auto'>
				<div className='w-1 h-3 bg-rose-500 rounded-full animate-pulse' />
				<div className='w-1 h-6 bg-rose-500 rounded-full animate-pulse delay-75' />
				<div className='w-1 h-4 bg-rose-500 rounded-full animate-pulse delay-150' />
				<div className='w-1 h-7 bg-rose-500 rounded-full animate-pulse delay-100' />
				<div className='w-1 h-3 bg-rose-500 rounded-full animate-pulse' />
			</div>

			{/* Timer & Controls */}
			<div className='w-full flex flex-col items-center gap-1.5'>
				<span className='text-xs font-mono font-bold text-rose-600 dir-ltr'>{formatTimeHelper(recordingTime)}</span>

				<div className='flex gap-2 w-full justify-center'>
					<SmartTooltip>
						<Button
							type='button'
							variant='ghost'
							size='icon'
							aria-label={t('messages.voiceRecording.cancel')}
							onClick={onCancel}
							className='size-8 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 cursor-pointer'
						>
							<Trash2Icon className='size-4' />
						</Button>
					</SmartTooltip>
					<SmartTooltip>
						<Button
							type='button'
							variant='ghost'
							size='icon'
							aria-label={t('messages.voiceRecording.send')}
							onClick={onStop}
							className='size-8 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 cursor-pointer'
						>
							<CheckIcon className='size-4' />
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

	// Check combined attachments limit (Max 4 items total)
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const selectedFiles = Array.from(e.target.files);

			if (attachments.length + selectedFiles.length > 4) {
				toast.warning(t('messages.errors.maxFilesWarning') || 'You can only attach up to 4 files.');
				return;
			}

			// Map incoming files to AttachedFile structure instantly
			const newAttachments: AttachedFile[] = selectedFiles.map((file) => {
				const preview = URL.createObjectURL(file);

				// Pre-calculate duration for audio files
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

		// Revoke memory reference immediately
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

	// Audio Recording Controllers
	const startRecording = async () => {
		if (attachments.length >= 4) {
			toast.warning(t('messages.errors.maxFilesWarning') || 'You can only attach up to 4 files.');
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

				// Create object URL directly upon creation
				const preview = URL.createObjectURL(audioFile);
				const finalDuration = recordingTimeRef.current;

				setAudioDurations((prev) => ({
					...prev,
					[fileName]: finalDuration,
				}));

				setAttachments((prev) => {
					if (prev.length >= 4) {
						URL.revokeObjectURL(preview); // Instant cleanup if array overflows
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

	// Gesture recognition for recording trigger
	const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
		if (isLoading) return;
		e.preventDefault();

		if (attachments.length >= 4) {
			toast.warning(t('messages.errors.maxFilesWarning') || 'You can only attach up to 4 files.');
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
			// 1. Wait for API response
			await onSend({
				messageText,
				audioBlob: voiceNote ? voiceNote.file : null,
				attachments: remaining.map((att) => att.file),
			});

			// 2. Clear inputs only on success
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
			// 3. Keep state intact if request fails
			console.error('Failed to submit message:', error);
		}
	};

	// Keyboard shortcut handler (Ctrl+Enter or Cmd+Enter to send)
	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
			e.preventDefault();
			if (!isLoading && !isRecording && (messageText.trim() || attachments.length > 0)) {
				handleSend();
			}
		}
	};

	const maxMessageLength = appConfig?.messages?.maxLength || 1000;

	return (
		<div className='flex flex-col gap-3 w-full'>
			<div
				className={cn(
					'w-full flex flex-col gap-3 bg-card/60 backdrop-blur-md border border-border/60 rounded-3xl p-4 shadow-lg transition-all duration-200',
					isLoading && 'opacity-70 pointer-events-none',
				)}
			>
				{/* Input Section - Textarea & Action Controls */}
				<div className='w-full flex flex-col sm:flex-row gap-3 items-end'>
					<div className='relative group w-full flex-1'>
						<Textarea
							value={messageText}
							onChange={(e) => setMessageText(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder={t('messages.attachments.textareaPlaceholder') || 'اكتب رسالتك هنا...'}
							rows={5}
							maxLength={maxMessageLength}
							className='min-h-[120px] pb-10 rounded-2xl bg-background/50 focus-visible:ring-2 focus-visible:ring-brand-primary/50 border border-border/50 resize-none text-base transition-all'
						/>
						<div className='absolute bottom-2.5 left-3 right-3 flex justify-between items-center pointer-events-none'>
							<span className='text-[10px] text-muted-foreground bg-background/80 px-2 py-0.5 rounded-md backdrop-blur-xs border border-border/30 font-mono dir-ltr pointer-events-auto'>
								{messageText.length}/{maxMessageLength}
							</span>
							<div className='pointer-events-auto'>
								<EmojiPicker
									onEmojiSelect={handleEmojiSelect}
									trigger={
										<Button
											type='button'
											variant='ghost'
											size='icon'
											className='size-8 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer transition-colors'
										>
											<SmileIcon className='size-5' />
										</Button>
									}
								/>
							</div>
						</div>
					</div>

					{/* Side Action Buttons */}
					<div className='flex sm:flex-col gap-2.5 self-stretch justify-end'>
						<input
							type='file'
							ref={fileInputRef}
							onChange={handleFileChange}
							multiple
							disabled={isLoading}
							accept='image/*,audio/*'
							className='hidden'
						/>
						<SmartTooltip>
							<Button
								type='button'
								variant='ghost'
								size='icon'
								aria-label={t('messages.attachments.add') || 'إضافة مرفقات'}
								onClick={() => fileInputRef.current?.click()}
								disabled={attachments.length >= 4 || isRecording || isLoading}
								className='size-11 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-2xl transition-colors cursor-pointer border border-border/40'
							>
								<Paperclip className='size-5' />
							</Button>
						</SmartTooltip>

						<SmartTooltip>
							<Button
								type='button'
								variant='outline'
								aria-label={t('messages.voiceRecording.start') || 'تسجيل صوتي'}
								onPointerDown={handlePointerDown}
								onPointerUp={handlePointerUp}
								size='icon'
								disabled={isLoading || (attachments.length >= 4 && !isRecording)}
								className={cn(
									'rounded-2xl size-11 transition-all shadow-md active:scale-95 cursor-pointer touch-none select-none border-0',
									isRecording
										? 'bg-rose-500 hover:bg-rose-600 scale-105 text-white animate-pulse'
										: 'bg-brand-primary text-brand-primary-foreground hover:bg-brand-primary/90',
								)}
							>
								<Mic className='size-5' />
							</Button>
						</SmartTooltip>
					</div>
				</div>

				{/* Attachments & Active Voice Note Preview Grid */}
				{(attachments.length > 0 || isRecording) && (
					<div className='space-y-2.5 border-t border-border/40 pt-3.5 mt-1 animate-in fade-in slide-in-from-bottom-2 duration-200'>
						<div className='flex items-center justify-between text-xs text-muted-foreground px-1'>
							<span className='font-medium dir-auto'>
								{t('messages.attachments.title') || 'المرفقات'} ({attachments.length + (isRecording ? 1 : 0)}/4)
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

						<div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
							{/* 1. Attached Files List */}
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

							{/* 2. Active Recording Card */}
							{isRecording && (
								<ActiveRecordingCard
									recordingTime={recordingTime}
									onCancel={cancelRecording}
									onStop={stopRecording}
								/>
							)}
						</div>
					</div>
				)}
			</div>

			{/* Main Submit Button */}
			<Button
				onClick={handleSend}
				size='lg'
				disabled={isLoading || isRecording || (!messageText.trim() && attachments.length === 0)}
				className='w-full sm:w-auto ms-auto rounded-2xl text-brand-primary-foreground bg-brand-primary hover:bg-brand-primary/90 px-7 gap-2.5 font-semibold min-w-[130px] transition-all duration-200 active:scale-95 shadow-md cursor-pointer'
			>
				{isLoading ? (
					<>
						<span>{t('messages.send.sending') || 'جاري الإرسال...'}</span>
						<Loader2Icon className='size-4 animate-spin' />
					</>
				) : (
					<>
						<span>{t('messages.send.button') || 'إرسال الصراحة'}</span>
						<SendIcon className='size-4 transform rotate-180 rtl:rotate-0' />
					</>
				)}
			</Button>
		</div>
	);
}
