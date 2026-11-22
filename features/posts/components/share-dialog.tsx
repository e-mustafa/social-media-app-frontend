'use client';

import { Button } from '@/shared/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/shared/components/ui/dialog';
import { configEnv } from '@/shared/config/env';
import { CopyIcon, Share2Icon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface ShareDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	postId: string;
}

export default function ShareDialog({ open, onOpenChange, postId }: ShareDialogProps) {
	const t = useTranslations();
	const locale = useLocale();
	const [copied, setCopied] = useState<boolean>(false);

	const postUrl = `${configEnv.appUrl}/${locale}/posts/${postId}`;

	const handleCopy = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(postUrl);
			setCopied(true);
			toast.success(t('common.copied') || 'Copied!');
			setTimeout(() => setCopied(false), 1500);
		} catch {
			toast.error(t('common.error') || 'Failed to copy link');
		}
	}, [postUrl, t]);

	const handleNativeShare = useCallback(async () => {
		if (typeof navigator === 'undefined' || !navigator.share) {
			return;
		}
		try {
			await navigator.share({ title: t('posts.card.share') || 'Talkify Post', text: '', url: postUrl });
		} catch {
			// User cancelled the native share flow; not an error.
		}
	}, [postUrl, t]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>{t('posts.card.share') || 'Share'}</DialogTitle>
					<DialogDescription>{t('posts.share.description') || 'Share this post with friends.'}</DialogDescription>
				</DialogHeader>
				<DialogFooter className='flex gap-3 flex-col md:flex-row'>
					<Button type='button' onClick={handleCopy} disabled={copied} className='gap-2 justify-start'>
						<CopyIcon className='size-4' />
						{copied ? t('common.copied') : t('posts.share.copyLink')}
					</Button>
					{'share' in navigator ? (
						<Button type='button' variant='outline' onClick={handleNativeShare} className='gap-2 justify-start'>
							<Share2Icon className='size-4' />
							{t('posts.share.nativeShare') || 'Share via device'}
						</Button>
					) : null}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
