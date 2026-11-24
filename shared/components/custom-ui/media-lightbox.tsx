'use client';

import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/utils';
import { ChevronLeftIcon, ChevronRightIcon, Maximize2Icon, Minimize2Icon, MinusIcon, PlusIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { TouchEvent, useEffect, useMemo, useRef, useState } from 'react';

export interface LightboxMediaItem {
	id: string;
	url: string;
	type: 'image' | 'video';
	alt?: string;
}

interface MediaLightboxProps {
	items: LightboxMediaItem[];
	open: boolean;
	initialIndex?: number;
	onOpenChange: (open: boolean) => void;
}

export function MediaLightbox({ items, open, initialIndex = 0, onOpenChange }: MediaLightboxProps) {
	const t = useTranslations();
	const [activeIndex, setActiveIndex] = useState(initialIndex);
	const [zoom, setZoom] = useState(1);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const touchStartXRef = useRef<number | null>(null);
	const activeItem = items[activeIndex];

	useEffect(() => {
		if (open) {
			setActiveIndex(initialIndex);
			setZoom(1);
		}
	}, [initialIndex, open]);

	useEffect(() => {
		if (!open) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onOpenChange(false);
			if (event.key === 'ArrowRight') setActiveIndex((index) => Math.min(index + 1, items.length - 1));
			if (event.key === 'ArrowLeft') setActiveIndex((index) => Math.max(index - 1, 0));
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [items.length, onOpenChange, open]);

	const canGoPrev = activeIndex > 0;
	const canGoNext = activeIndex < items.length - 1;

	const toggleFullscreen = async () => {
		if (!containerRef.current) return;

		if (!document.fullscreenElement) {
			await containerRef.current.requestFullscreen().catch(() => undefined);
			setIsFullscreen(true);
			return;
		}

		await document.exitFullscreen().catch(() => undefined);
		setIsFullscreen(false);
	};

	const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
		const startX = touchStartXRef.current;
		if (startX === null) return;

		const endX = event.changedTouches[0]?.clientX ?? startX;
		const deltaX = endX - startX;
		touchStartXRef.current = null;

		if (Math.abs(deltaX) < 50) return;
		if (deltaX > 0 && canGoPrev) setActiveIndex((index) => index - 1);
		if (deltaX < 0 && canGoNext) setActiveIndex((index) => index + 1);
	};
	const containerClassName = useMemo(() => {
		return cn(
			'absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-xl animate-in fade-in duration-150',
			isFullscreen && 'p-0',
		);
	}, [isFullscreen]);

	if (!open || !activeItem) return null;

	return (
		<div
			ref={containerRef}
			className={containerClassName}
			role='dialog'
			aria-modal='true'
			aria-label={t('lightbox.viewer')}
			onTouchStart={(event) => {
				touchStartXRef.current = event.touches[0]?.clientX ?? null;
			}}
			onTouchEnd={handleTouchEnd}
		>
			<div className='absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 p-3 sm:p-5'>
				<div className='rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-medium text-white backdrop-blur-md'>
					{activeIndex + 1} / {items.length}
				</div>
				<div className='flex items-center gap-2'>
					<Button type='button' variant='ghost' size='icon' className='rounded-full bg-white/10 text-white hover:bg-white/20' onClick={() => setZoom((value) => Math.max(value - 0.25, 0.75))} aria-label={t('lightbox.zoomOut')}>
						<MinusIcon className='size-4' />
					</Button>
					<Button type='button' variant='ghost' size='icon' className='rounded-full bg-white/10 text-white hover:bg-white/20' onClick={() => setZoom((value) => Math.min(value + 0.25, 2.5))} aria-label={t('lightbox.zoomIn')}>
						<PlusIcon className='size-4' />
					</Button>
					<Button type='button' variant='ghost' size='icon' className='rounded-full bg-white/10 text-white hover:bg-white/20' onClick={toggleFullscreen} aria-label={t('lightbox.fullscreen')}>
						{isFullscreen ? <Minimize2Icon className='size-4' /> : <Maximize2Icon className='size-4' />}
					</Button>
					<Button type='button' variant='ghost' size='icon' className='rounded-full bg-white/10 text-white hover:bg-white/20' onClick={() => onOpenChange(false)} aria-label={t('lightbox.close')}>
						<XIcon className='size-5' />
					</Button>
				</div>
			</div>

			{canGoPrev && (
				<Button type='button' variant='ghost' size='icon' className='absolute start-3 z-10 rounded-full bg-white/10 text-white hover:bg-white/20' onClick={() => setActiveIndex((index) => index - 1)} aria-label={t('lightbox.previous')}>
					<ChevronLeftIcon className='size-6 rtl:rotate-180' />
				</Button>
			)}

			<div className='relative flex size-full max-h-[92vh] max-w-6xl items-center justify-center overflow-hidden rounded-2xl'>
				{activeItem.type === 'video' ? (
					<video src={activeItem.url} controls autoPlay className='max-h-full max-w-full rounded-xl object-contain' style={{ transform: `scale(${zoom})` }} />
				) : (
					<div className='relative h-full w-full transition-transform duration-200' style={{ transform: `scale(${zoom})` }}>
						<Image src={activeItem.url} alt={activeItem.alt || 'Media'} fill className='object-contain' sizes='100vw' priority />
					</div>
				)}
			</div>

			{canGoNext && (
				<Button type='button' variant='ghost' size='icon' className='absolute end-3 z-10 rounded-full bg-white/10 text-white hover:bg-white/20' onClick={() => setActiveIndex((index) => index + 1)} aria-label={t('lightbox.next')}>
					<ChevronRightIcon className='size-6 rtl:rotate-180' />
				</Button>
			)}
		</div>
	);
}
