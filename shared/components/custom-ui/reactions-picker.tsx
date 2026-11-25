'use client';

import { ReactionType } from '@/features/posts/types';
import { Button } from '@/shared/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { cn } from '@/shared/utils/utils';
import { ThumbsUpIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

interface ReactionOption {
	type: ReactionType;
	labelClassName: string;
}

const reactionOptions: ReactionOption[] = [
	{ type: 'like', labelClassName: 'text-blue-600 dark:text-blue-400' },
	{ type: 'love', labelClassName: 'text-rose-600 dark:text-rose-400' },
	{ type: 'haha', labelClassName: 'text-amber-600 dark:text-amber-400' },
	{ type: 'wow', labelClassName: 'text-yellow-600 dark:text-yellow-400' },
	{ type: 'sad', labelClassName: 'text-sky-600 dark:text-sky-400' },
	{ type: 'angry', labelClassName: 'text-orange-600 dark:text-orange-400' },
	{ type: 'dislike', labelClassName: 'text-red-600 dark:text-red-400' },
];

interface ReactionVisualProps {
	type: ReactionType;
	className?: string;
}

function ReactionVisual({ type, className }: ReactionVisualProps) {
	switch (type) {
		case 'like':
			return (
				<svg viewBox='0 0 24 24' className={cn('size-6 fill-blue-500', className)} aria-hidden='true'>
					<path d='M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3' />
				</svg>
			);
		case 'love':
			return (
				<svg viewBox='0 0 24 24' className={cn('size-6 fill-rose-500', className)} aria-hidden='true'>
					<path d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' />
				</svg>
			);
		case 'haha':
			return (
				<svg viewBox='0 0 24 24' className={cn('size-6', className)} aria-hidden='true'>
					<circle cx='12' cy='12' r='10' className='fill-amber-400' />
					<path
						d='M8 9.5c.7-.8 1.8-.8 2.5 0M13.5 9.5c.7-.8 1.8-.8 2.5 0'
						stroke='#451a03'
						strokeWidth='1.8'
						strokeLinecap='round'
						fill='none'
					/>
					<path d='M7.5 13.5c1 3.5 8 3.5 9 0z' className='fill-rose-500' stroke='#451a03' strokeWidth='1.4' />
				</svg>
			);
		case 'wow':
			return (
				<svg viewBox='0 0 24 24' className={cn('size-6', className)} aria-hidden='true'>
					<circle cx='12' cy='12' r='10' className='fill-yellow-400' />
					<circle cx='8.8' cy='9.5' r='1.5' className='fill-amber-950' />
					<circle cx='15.2' cy='9.5' r='1.5' className='fill-amber-950' />
					<ellipse cx='12' cy='15.2' rx='2.2' ry='3' className='fill-amber-950' />
				</svg>
			);
		case 'sad':
			return (
				<svg viewBox='0 0 24 24' className={cn('size-6', className)} aria-hidden='true'>
					<circle cx='12' cy='12' r='10' className='fill-sky-400' />
					<circle cx='8.8' cy='10' r='1.4' className='fill-slate-900' />
					<circle cx='15.2' cy='10' r='1.4' className='fill-slate-900' />
					<path d='M16 12.5c0 1.4-1.8 1.4-1.8 0 0-.7.9-1.8.9-1.8s.9 1.1.9 1.8z' className='fill-blue-600' />
					<path d='M8.5 16c1-1.5 6-1.5 7 0' stroke='#0f172a' strokeWidth='1.8' strokeLinecap='round' fill='none' />
				</svg>
			);
		case 'angry':
			return (
				<svg viewBox='0 0 24 24' className={cn('size-6', className)} aria-hidden='true'>
					<circle cx='12' cy='12' r='10' className='fill-orange-500' />
					<path d='M7.5 8.5l3 1.5M16.5 8.5l-3 1.5' stroke='#431407' strokeWidth='1.8' strokeLinecap='round' />
					<circle cx='9' cy='11' r='1.3' className='fill-red-950' />
					<circle cx='15' cy='11' r='1.3' className='fill-red-950' />
					<path
						d='M8.5 16.5c1.2-1.8 5.8-1.8 7 0'
						stroke='#431407'
						strokeWidth='1.8'
						strokeLinecap='round'
						fill='none'
					/>
				</svg>
			);
		case 'dislike':
			return (
				<svg viewBox='0 0 24 24' className={cn('size-6 fill-red-500', className)} aria-hidden='true'>
					<path d='M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3' />
				</svg>
			);
	}
}

interface ReactionsPickerProps {
	activeReaction?: ReactionType | null;
	onChange: (reaction: ReactionType | null) => void;
	disabled?: boolean;
	reactionsCount?: number;
	className?: string;
}

export function ReactionsPicker({
	activeReaction,
	onChange,
	disabled = false,
	reactionsCount = 0,
	className,
}: ReactionsPickerProps) {
	const t = useTranslations();
	const [isOpen, setIsOpen] = useState(false);
	const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const activeOption = reactionOptions.find((option) => option.type === activeReaction);

	const clearLongPressTimer = () => {
		if (longPressTimeoutRef.current) {
			clearTimeout(longPressTimeoutRef.current);
			longPressTimeoutRef.current = null;
		}
	};

	const clearCloseTimer = () => {
		if (closeTimeoutRef.current) {
			clearTimeout(closeTimeoutRef.current);
			closeTimeoutRef.current = null;
		}
	};

	useEffect(() => {
		return () => {
			clearLongPressTimer();
			clearCloseTimer();
		};
	}, []);

	const scheduleClose = () => {
		clearCloseTimer();
		closeTimeoutRef.current = setTimeout(() => setIsOpen(false), 180);
	};

	const handleDefaultToggle = () => {
		if (disabled) return;
		clearLongPressTimer();
		setIsOpen(false);
		onChange(activeReaction === 'like' ? null : 'like');
	};

	const handlePick = (reaction: ReactionType) => {
		if (disabled) return;
		clearCloseTimer();
		setIsOpen(false);
		onChange(activeReaction === reaction ? null : reaction);
	};

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<div
					className={cn('relative inline-flex', className)}
					onMouseEnter={() => {
						clearCloseTimer();
						if (!disabled) setIsOpen(true);
					}}
					onMouseLeave={scheduleClose}
				>
					<Button
						type='button'
						variant='ghost'
						className={cn('gap-2 rounded-xl text-muted-foreground', activeOption && activeOption.labelClassName)}
						disabled={disabled}
						onClick={handleDefaultToggle}
						onPointerDown={() => {
							clearLongPressTimer();
							longPressTimeoutRef.current = setTimeout(() => setIsOpen(true), 420);
						}}
						onPointerUp={clearLongPressTimer}
						onPointerCancel={clearLongPressTimer}
						aria-label={t('reactions.toggleLike')}
					>
						{activeOption ? (
							<ReactionVisual type={activeOption.type} className='size-4' />
						) : (
							<ThumbsUpIcon className='size-4' />
						)}
						<span className='hidden sm:inline'>
							{activeReaction ? t(`reactions.types.${activeReaction}`) : t('posts.card.like')}
						</span>
					</Button>
					{reactionsCount > 0 && (
						<>
							<span className='hidden sm:inline text-xs font-medium text-muted-foreground'>
								{t('reactions.count', { count: reactionsCount })}
							</span>

							<span className='sm:hidden inline'>{reactionsCount}</span>
						</>
					)}
				</div>
			</PopoverTrigger>

			<PopoverContent
				side='top'
				align='start'
				sideOffset={8}
				className='flex flex-row items-center gap-1 me-4 min-w-fit rounded-full border border-border/30 bg-card-glass/70 px-2 py-1.5 shadow-xl backdrop-blur-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-1'
				onMouseEnter={clearCloseTimer}
				onMouseLeave={scheduleClose}
			>
				{reactionOptions.map((option) => (
					<button
						key={option.type}
						type='button'
						// variant='ghost'
						// size='sm'
						disabled={disabled}
						onClick={() => handlePick(option.type)}
						className={cn(
							'flex size-10 p-0 items-center justify-center rounded-full transition-all duration-150 hover:-translate-y-1.5 hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
							activeReaction === option.type && 'bg-brand-primary/15 ring-2 ring-brand-primary/40 scale-110',
						)}
						aria-label={t(`reactions.types.${option.type}`)}
						title={t(`reactions.types.${option.type}`)}
					>
						<ReactionVisual type={option.type} className='size-8' />
					</button>
				))}
			</PopoverContent>
		</Popover>
	);
}
