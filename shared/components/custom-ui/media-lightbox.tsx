'use client';

import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/utils';
import { ChevronLeftIcon, ChevronRightIcon, Maximize2Icon, Minimize2Icon, MinusIcon, PlusIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import type { TouchEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

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

interface MediaLightboxViewerProps {
	items: LightboxMediaItem[];
	initialIndex: number;
	onOpenChange: (open: boolean) => void;
}

const MIN_ZOOM = 0.75;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.25;
const SWIPE_THRESHOLD = 50;

function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max);
}

export function MediaLightbox({ items, open, initialIndex = 0, onOpenChange }: MediaLightboxProps) {
	if (!open || items.length === 0) return null;

	// A new key creates a fresh viewer session when the initial slide
	// or the media collection changes.
	const sessionKey = JSON.stringify({
		initialIndex,
		itemIds: items.map((item) => item.id),
	});

	return <MediaLightboxViewer key={sessionKey} items={items} initialIndex={initialIndex} onOpenChange={onOpenChange} />;
}

function MediaLightboxViewer({ items, initialIndex, onOpenChange }: MediaLightboxViewerProps) {
	const t = useTranslations();

	const [activeIndex, setActiveIndex] = useState(() =>
		clamp(Number.isFinite(initialIndex) ? Math.trunc(initialIndex) : 0, 0, items.length - 1),
	);

	const [zoom, setZoom] = useState(1);
	const [isFullscreen, setIsFullscreen] = useState(false);

	const containerRef = useRef<HTMLDivElement | null>(null);
	const closeButtonRef = useRef<HTMLButtonElement | null>(null);
	const touchStartXRef = useRef<number | null>(null);

	const activeItem = items[activeIndex];

	const canGoPrev = activeIndex > 0;
	const canGoNext = activeIndex < items.length - 1;

	// Navigate to a specific slide and reset zoom.
	const navigateTo = useCallback(
		(index: number) => {
			const nextIndex = clamp(index, 0, items.length - 1);

			setActiveIndex(nextIndex);
			setZoom(1);
		},
		[items.length],
	);

	const goToPrev = useCallback(() => {
		if (canGoPrev) navigateTo(activeIndex - 1);
	}, [activeIndex, canGoPrev, navigateTo]);

	const goToNext = useCallback(() => {
		if (canGoNext) navigateTo(activeIndex + 1);
	}, [activeIndex, canGoNext, navigateTo]);

	// Synchronize fullscreen state with the browser Fullscreen API.
	useEffect(() => {
		const container = containerRef.current;

		if (!container) return;

		const handleFullscreenChange = () => {
			setIsFullscreen(document.fullscreenElement === container);
		};

		document.addEventListener('fullscreenchange', handleFullscreenChange);

		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);

			// Exit fullscreen if the viewer is unmounted while fullscreen is active.
			if (document.fullscreenElement === container) {
				void document.exitFullscreen().catch(() => undefined);
			}
		};
	}, []);

	// Manage focus, keyboard navigation, and body scrolling.
	useEffect(() => {
		const container = containerRef.current;

		if (!container) return;

		const previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

		const previousOverflow = document.body.style.overflow;

		document.body.style.overflow = 'hidden';

		closeButtonRef.current?.focus();

		const isEditableTarget = (target: EventTarget | null) => {
			if (!(target instanceof HTMLElement)) return false;

			return (
				target.isContentEditable ||
				Boolean(target.closest('input, textarea, select, video, [role="slider"], [contenteditable="true"]'))
			);
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				event.preventDefault();

				// Let the first Escape exit fullscreen.
				if (document.fullscreenElement === container) {
					void document.exitFullscreen().catch(() => undefined);
					return;
				}

				onOpenChange(false);
				return;
			}

			if (event.key === 'Tab') {
				const focusableElements = Array.from(
					container.querySelectorAll<HTMLElement>(
						'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
					),
				).filter((element) => element.getClientRects().length > 0);

				if (focusableElements.length === 0) {
					event.preventDefault();
					container.focus();
					return;
				}

				const firstElement = focusableElements[0];
				const lastElement = focusableElements[focusableElements.length - 1];

				if (event.shiftKey && document.activeElement === firstElement) {
					event.preventDefault();
					lastElement.focus();
				} else if (!event.shiftKey && document.activeElement === lastElement) {
					event.preventDefault();
					firstElement.focus();
				}

				return;
			}

			if (isEditableTarget(event.target)) return;

			if (event.key === 'ArrowRight' && canGoNext) {
				event.preventDefault();
				goToNext();
			}

			if (event.key === 'ArrowLeft' && canGoPrev) {
				event.preventDefault();
				goToPrev();
			}
		};

		document.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('keydown', handleKeyDown);

			document.body.style.overflow = previousOverflow;

			// Restore focus to the element that opened the viewer.
			if (previousActiveElement?.isConnected) {
				previousActiveElement.focus();
			}
		};
	}, [canGoNext, canGoPrev, goToNext, goToPrev, onOpenChange]);

	const toggleFullscreen = async () => {
		const container = containerRef.current;

		if (!container) return;

		try {
			if (document.fullscreenElement === container) {
				await document.exitFullscreen();
			} else if (!document.fullscreenElement) {
				await container.requestFullscreen();
			}
		} catch {
			// Fullscreen may be unavailable or denied by the browser.
		}
	};

	const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
		const target = event.target;

		// Do not interfere with video controls or interactive elements.
		if (target instanceof Element && target.closest('video, button, a, input, textarea, select')) {
			touchStartXRef.current = null;
			return;
		}

		touchStartXRef.current = event.touches[0]?.clientX ?? null;
	};

	const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
		const startX = touchStartXRef.current;

		if (startX === null) return;

		const endX = event.changedTouches[0]?.clientX ?? startX;
		const deltaX = endX - startX;

		touchStartXRef.current = null;

		if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;

		if (deltaX > 0) {
			goToPrev();
		} else {
			goToNext();
		}
	};

	return (
		<div
			ref={containerRef}
			className={cn(
				'absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-xl animate-in fade-in duration-150 outline-none',
				isFullscreen && 'p-0',
			)}
			role='dialog'
			aria-modal='true'
			aria-label={t('lightbox.viewer')}
			tabIndex={-1}
			onTouchStart={handleTouchStart}
			onTouchEnd={handleTouchEnd}
			onTouchCancel={() => {
				touchStartXRef.current = null;
			}}
		>
			{/* Top toolbar */}
			<div className='absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 p-3 sm:p-5'>
				<div
					className='rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-medium text-white backdrop-blur-md'
					aria-live='polite'
					aria-atomic='true'
				>
					{activeIndex + 1} / {items.length}
				</div>

				<div className='flex items-center gap-2'>
					<Button
						type='button'
						variant='ghost'
						size='icon'
						className='rounded-full bg-white/10 text-white hover:bg-white/20'
						onClick={() => setZoom((value) => Math.max(value - ZOOM_STEP, MIN_ZOOM))}
						disabled={zoom <= MIN_ZOOM}
						aria-label={t('lightbox.zoomOut')}
					>
						<MinusIcon className='size-4' />
					</Button>

					<Button
						type='button'
						variant='ghost'
						size='icon'
						className='rounded-full bg-white/10 text-white hover:bg-white/20'
						onClick={() => setZoom((value) => Math.min(value + ZOOM_STEP, MAX_ZOOM))}
						disabled={zoom >= MAX_ZOOM}
						aria-label={t('lightbox.zoomIn')}
					>
						<PlusIcon className='size-4' />
					</Button>

					<Button
						type='button'
						variant='ghost'
						size='icon'
						className='rounded-full bg-white/10 text-white hover:bg-white/20'
						onClick={toggleFullscreen}
						aria-label={t('lightbox.fullscreen')}
						aria-pressed={isFullscreen}
					>
						{isFullscreen ? <Minimize2Icon className='size-4' /> : <Maximize2Icon className='size-4' />}
					</Button>

					<Button
						ref={closeButtonRef}
						type='button'
						variant='ghost'
						size='icon'
						className='rounded-full bg-white/10 text-white hover:bg-white/20'
						onClick={() => onOpenChange(false)}
						aria-label={t('lightbox.close')}
					>
						<XIcon className='size-5' />
					</Button>
				</div>
			</div>

			{/* Previous button */}
			{canGoPrev && (
				<Button
					type='button'
					variant='ghost'
					size='icon'
					className='absolute start-3 z-10 rounded-full bg-white/10 text-white hover:bg-white/20'
					onClick={goToPrev}
					aria-label={t('lightbox.previous')}
				>
					<ChevronLeftIcon className='size-6 rtl:rotate-180' />
				</Button>
			)}

			{/* Active media */}
			<div className='relative flex size-full max-h-[92vh] max-w-6xl items-center justify-center overflow-hidden rounded-2xl'>
				{activeItem.type === 'video' ? (
					<video
						key={activeItem.id}
						src={activeItem.url}
						controls
						autoPlay
						playsInline
						className='max-h-full max-w-full rounded-xl object-contain transition-transform duration-200'
						style={{ transform: `scale(${zoom})` }}
					/>
				) : (
					<div
						className='relative h-full w-full transition-transform duration-200'
						style={{ transform: `scale(${zoom})` }}
					>
						<Image
							src={activeItem.url}
							alt={activeItem.alt || 'Media'}
							fill
							className='object-contain'
							sizes='100vw'
							priority
						/>
					</div>
				)}
			</div>

			{/* Next button */}
			{canGoNext && (
				<Button
					type='button'
					variant='ghost'
					size='icon'
					className='absolute end-3 z-10 rounded-full bg-white/10 text-white hover:bg-white/20'
					onClick={goToNext}
					aria-label={t('lightbox.next')}
				>
					<ChevronRightIcon className='size-6 rtl:rotate-180' />
				</Button>
			)}
		</div>
	);
}
