// components/chat/audio-message-bubble.tsx
'use client';

import { formatTimeHelper } from '@/shared/utils/format-time';
import { Pause, Play } from 'lucide-react';
import { useRef, useState } from 'react';

interface AudioMessageBubbleProps {
	src: string;
	duration?: number;
	isSender: boolean;
}

export const AudioMessageBubble = ({ src, duration = 0, isSender }: AudioMessageBubbleProps) => {
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	// Toggle audio playback state
	const togglePlay = () => {
		if (!audioRef.current) return;
		if (isPlaying) {
			audioRef.current.pause();
		} else {
			audioRef.current.play();
		}
		setIsPlaying(!isPlaying);
	};

	// Handle time update during playback
	const handleTimeUpdate = () => {
		if (audioRef.current) {
			setCurrentTime(audioRef.current.currentTime);
		}
	};

	// Reset state when audio finishes playing
	const handleEnded = () => {
		setIsPlaying(false);
		setCurrentTime(0);
	};

	const activeDuration = duration || (audioRef.current?.duration ? Math.round(audioRef.current.duration) : 0);

	return (
		<div className='flex items-center gap-3 min-w-[220px] py-1'>
			<audio ref={audioRef} src={src} onTimeUpdate={handleTimeUpdate} onEnded={handleEnded} className='hidden' />
			<button
				type='button'
				onClick={togglePlay}
				className={`size-10 rounded-full flex items-center justify-center transition-colors ${
					isSender ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-primary/10 hover:bg-primary/20 text-primary'
				}`}
			>
				{isPlaying ? <Pause className='size-5 fill-current' /> : <Play className='size-5 fill-current ml-0.5' />}
			</button>

			<div className='flex-1 flex flex-col gap-1'>
				{/* Fake Waveform / Progress Bar */}
				<div className='relative w-full h-1.5 bg-black/20 rounded-full overflow-hidden'>
					<div
						className={`h-full transition-all duration-100 ${isSender ? 'bg-white' : 'bg-emerald-500'}`}
						style={{ width: `${activeDuration > 0 ? (currentTime / activeDuration) * 100 : 0}%` }}
					/>
				</div>
				<div className='flex justify-between items-center text-[10px] opacity-80'>
					<span>{formatTimeHelper(isPlaying ? Math.round(currentTime) : activeDuration)}</span>
				</div>
			</div>
		</div>
	);
};
