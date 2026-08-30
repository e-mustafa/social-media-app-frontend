'use client';

import { Button } from '@/shared/components/ui/button';
import { formatTimeHelper } from '@/shared/utils/format-time';
import { PauseIcon, PlayIcon, Volume2Icon } from 'lucide-react';
import { useRef, useState } from 'react';

interface PostAudioPlayerProps {
	src: string;
	label: string;
}

export default function PostAudioPlayer({ src, label }: PostAudioPlayerProps) {
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);

	const progress = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

	const togglePlayback = () => {
		if (!audioRef.current) return;

		if (isPlaying) {
			audioRef.current.pause();
			setIsPlaying(false);
			return;
		}

		audioRef.current.play();
		setIsPlaying(true);
	};

	return (
		<div className='flex items-center gap-3 rounded-2xl border border-brand-primary/20 bg-brand-primary/10 p-3'>
			<audio
				ref={audioRef}
				src={src}
				className='hidden'
				onLoadedMetadata={(event) => setDuration(Math.round(event.currentTarget.duration || 0))}
				onTimeUpdate={(event) => setCurrentTime(Math.round(event.currentTarget.currentTime))}
				onEnded={() => {
					setIsPlaying(false);
					setCurrentTime(0);
				}}
			/>

			<Button
				type='button'
				variant='ghost'
				size='icon'
				onClick={togglePlayback}
				className='size-10 rounded-full bg-brand-primary text-white hover:bg-brand-primary/90 shrink-0'
				aria-label={label}
			>
				{isPlaying ? <PauseIcon className='size-5 fill-white' /> : <PlayIcon className='size-5 fill-white ms-0.5' />}
			</Button>

			<div className='min-w-0 flex-1 space-y-1.5'>
				<div className='flex items-center justify-between gap-3 text-xs font-medium text-brand-primary'>
					<span className='inline-flex items-center gap-1.5 truncate'>
						<Volume2Icon className='size-3.5 shrink-0' />
						{label}
					</span>
					<span className='font-mono text-[11px] text-muted-foreground'>
						{formatTimeHelper(isPlaying ? currentTime : duration)}
					</span>
				</div>
				<div className='h-1.5 overflow-hidden rounded-full bg-background/60'>
					<div className='h-full rounded-full bg-brand-primary transition-all duration-150' style={{ width: `${progress}%` }} />
				</div>
			</div>
		</div>
	);
}
