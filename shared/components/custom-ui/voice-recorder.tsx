'use client';

import { SmartTooltip } from '@/shared/components/custom-ui/smart-tooltip';
import { Button } from '@/shared/components/ui/button';
import { formatTimeHelper } from '@/shared/utils/format-time';
import { cn } from '@/shared/utils/utils';
import { CheckIcon, Mic, Pause, Play, Trash2Icon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export interface RecordedVoiceNote {
	file: File;
	blob: Blob;
	preview: string;
	duration: number;
}

export interface VoiceRecorderProps {
	onRecordComplete: (record: RecordedVoiceNote) => void;
	onRemove?: () => void;
	recordedAudio?: RecordedVoiceNote | null;
	disabled?: boolean;
	className?: string;
}

export function VoiceRecorder({
	onRecordComplete,
	onRemove,
	recordedAudio,
	disabled = false,
	className,
}: VoiceRecorderProps) {
	const [isRecording, setIsRecording] = useState(false);
	const [recordingTime, setRecordingTime] = useState(0);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentPlayTime, setCurrentPlayTime] = useState(0);

	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const audioChunksRef = useRef<Blob[]>([]);
	const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const recordingTimeRef = useRef<number>(0);
	const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

	useEffect(() => {
		return () => {
			if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
			if (audioPlayerRef.current) {
				audioPlayerRef.current.pause();
				audioPlayerRef.current = null;
			}
		};
	}, []);

	const startRecording = async () => {
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

			mediaRecorder.ondataavailable = (event) => {
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

				onRecordComplete({
					file: audioFile,
					blob: audioBlob,
					preview,
					duration: finalDuration,
				});

				stream.getTracks().forEach((track) => track.stop());
			};

			mediaRecorder.start();
			setIsRecording(true);
			setRecordingTime(0);
			recordingTimeRef.current = 0;

			timerIntervalRef.current = setInterval(() => {
				setRecordingTime((prev) => {
					const updated = prev + 1;
					recordingTimeRef.current = updated;
					return updated;
				});
			}, 1000);
		} catch (err) {
			console.error('Microphone access denied:', err);
			toast.error('Microphone access denied or not available');
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

	const togglePlayRecorded = () => {
		if (!recordedAudio) return;

		if (isPlaying) {
			audioPlayerRef.current?.pause();
			setIsPlaying(false);
		} else {
			if (!audioPlayerRef.current) {
				const audio = new Audio(recordedAudio.preview);
				audioPlayerRef.current = audio;
				audio.ontimeupdate = () => {
					setCurrentPlayTime(Math.round(audio.currentTime));
				};
				audio.onended = () => {
					setIsPlaying(false);
					setCurrentPlayTime(0);
				};
			}
			audioPlayerRef.current.play();
			setIsPlaying(true);
		}
	};

	const handleRemoveRecorded = () => {
		if (isPlaying && audioPlayerRef.current) {
			audioPlayerRef.current.pause();
			setIsPlaying(false);
		}
		if (recordedAudio) {
			URL.revokeObjectURL(recordedAudio.preview);
		}
		if (onRemove) onRemove();
	};

	return (
		<div className={cn('flex items-center gap-2', className)}>
			{!isRecording && !recordedAudio && (
				<SmartTooltip content='Record voice note'>
					<Button
						type='button'
						variant='outline'
						size='icon'
						disabled={disabled}
						onClick={startRecording}
						className='size-10 rounded-xl bg-card-blur text-foreground hover:text-brand-primary border-border/40 transition-all'
						aria-label='Record voice note'
					>
						<Mic className='size-5' />
					</Button>
				</SmartTooltip>
			)}

			{isRecording && (
				<div className='flex items-center gap-2 bg-destructive/10 border border-destructive/20 px-3 py-1.5 rounded-xl animate-in zoom-in-95'>
					<span className='size-2 bg-destructive rounded-full animate-ping' />
					<span className='text-xs font-mono font-bold text-destructive'>{formatTimeHelper(recordingTime)}</span>
					<div className='flex items-center gap-1 ms-1'>
						<Button
							type='button'
							variant='ghost'
							size='icon'
							onClick={cancelRecording}
							className='size-7 rounded-lg text-destructive hover:bg-destructive/20'
						>
							<Trash2Icon className='size-3.5' />
						</Button>
						<Button
							type='button'
							variant='ghost'
							size='icon'
							onClick={stopRecording}
							className='size-7 rounded-lg text-emerald-600 hover:bg-emerald-500/20'
						>
							<CheckIcon className='size-3.5' />
						</Button>
					</div>
				</div>
			)}

			{recordedAudio && !isRecording && (
				<div className='flex items-center gap-2 bg-brand-primary/10 border border-brand-primary/20 px-3 py-1.5 rounded-xl'>
					<Button
						type='button'
						variant='ghost'
						size='icon'
						onClick={togglePlayRecorded}
						className='size-7 rounded-full bg-brand-primary text-white hover:bg-brand-primary/90'
					>
						{isPlaying ? <Pause className='size-3.5 fill-white' /> : <Play className='size-3.5 fill-white ml-0.5' />}
					</Button>
					<span className='text-xs font-mono font-semibold text-brand-primary'>
						{formatTimeHelper(isPlaying ? currentPlayTime : recordedAudio.duration)}
					</span>
					<Button
						type='button'
						variant='ghost'
						size='icon'
						onClick={handleRemoveRecorded}
						className='size-7 rounded-lg text-muted-foreground hover:text-destructive'
					>
						<Trash2Icon className='size-3.5' />
					</Button>
				</div>
			)}
		</div>
	);
}
