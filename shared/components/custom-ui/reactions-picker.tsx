'use client';

import { ReactionType } from '@/features/posts/types';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/utils';
import { ThumbsUpIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

interface ReactionOption {
	type: ReactionType;
	emoji: string;
	className: string;
}

const reactionOptions: ReactionOption[] = [
	{ type: 'like', emoji: '👍', className: 'text-blue-500' },
	{ type: 'love', emoji: '❤️', className: 'text-rose-500' },
	{ type: 'haha', emoji: '😂', className: 'text-amber-500' },
	{ type: 'wow', emoji: '😮', className: 'text-yellow-500' },
	{ type: 'sad', emoji: '😢', className: 'text-sky-500' },
	{ type: 'angry', emoji: '😡', className: 'text-orange-600' },
	{ type: 'dislike', emoji: '👎', className: 'text-red-600' },
];

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
	const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

	const scheduleClose = () => {
		clearCloseTimer();
		closeTimeoutRef.current = setTimeout(() => setIsOpen(false), 180);
	};

	const handleDefaultToggle = () => {
		if (disabled || isOpen) return;
		onChange(activeReaction === 'like' ? null : 'like');
	};

	const handlePick = (reaction: ReactionType) => {
		if (disabled) return;
		onChange(activeReaction === reaction ? null : reaction);
		setIsOpen(false);
	};

	return (
		<div
			className={cn('relative inline-flex', className)}
			onMouseEnter={() => setIsOpen(true)}
			onMouseLeave={scheduleClose}
		>
			{isOpen && (
				<div
					className='absolute bottom-full start-0 z-40 mb-2 flex items-center gap-1 rounded-full border border-border/30 bg-card-glass px-2 py-1.5 shadow-xl backdrop-blur-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-1'
					onMouseEnter={clearCloseTimer}
					onMouseLeave={scheduleClose}
				>
					{reactionOptions.map((option) => (
						<button
							key={option.type}
							type='button'
							disabled={disabled}
							onClick={() => handlePick(option.type)}
							className={cn(
								'flex size-10 items-center justify-center rounded-full text-2xl transition-all hover:-translate-y-1 hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
								activeReaction === option.type && 'bg-brand-primary/10 scale-110',
							)}
							aria-label={t(`reactions.types.${option.type}`)}
						>
							{option.emoji}
						</button>
					))}
				</div>
			)}

			<div className='flex items-center'>
				<Button
					type='button'
					variant='ghost'
					className={cn('gap-2 rounded-xl text-muted-foreground', activeOption && activeOption.className)}
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
					{activeOption ? <span className='text-base'>{activeOption.emoji}</span> : <ThumbsUpIcon className='size-4' />}
					<span className='hidden sm:inline'>
						{activeReaction ? t(`reactions.types.${activeReaction}`) : t('posts.card.like')}
					</span>
					{/* {activeReaction === 'love' && <HeartIcon className='hidden size-4 sm:block' />} */}
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
		</div>
	);
}
