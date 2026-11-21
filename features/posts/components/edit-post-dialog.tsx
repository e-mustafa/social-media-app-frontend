'use client';

import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/utils/utils';
import { Loader2Icon, Globe2Icon, UsersIcon, LockIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { useUpdatePost } from '../hooks/use-posts';
import { Post, PostVisibility } from '../types';

const privacyOptions: Array<{ value: PostVisibility; icon: typeof Globe2Icon; translationKey: string }> = [
	{ value: 'public', icon: Globe2Icon, translationKey: 'posts.create.privacy.public' },
	{ value: 'friends', icon: UsersIcon, translationKey: 'posts.create.privacy.friends' },
	{ value: 'private', icon: LockIcon, translationKey: 'posts.create.privacy.private' },
];

interface EditPostDialogProps {
	post: Post;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export default function EditPostDialog({ post, open, onOpenChange }: EditPostDialogProps) {
	const t = useTranslations();
	const updatePostMutation = useUpdatePost();
	const [content, setContent] = useState(post.content);
	const [visibility, setVisibility] = useState<PostVisibility>(post.visibility);

	const handleSubmit = async () => {
		const trimmedContent = content.trim();

		if (!trimmedContent) {
			toast.warning(t('posts.create.emptyWarning') || 'Write something before saving.');
			return;
		}

		await updatePostMutation.mutateAsync({
			postId: post._id,
			payload: {
				content: trimmedContent,
				visibility,
			},
		});

		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-md bg-card-glass backdrop-blur-lg rounded-2xl'>
				<DialogHeader>
					<DialogTitle>{t('posts.card.editPost') || 'Edit Post'}</DialogTitle>
					<DialogDescription>
						{t('posts.card.editPostDesc') || 'Modify your post text and visibility below.'}
					</DialogDescription>
				</DialogHeader>

				<div className='space-y-4 py-4'>
					<Textarea
						value={content}
						onChange={(event) => setContent(event.target.value)}
						placeholder={t('posts.create.placeholder') || "What's on your mind?"}
						className='min-h-24 resize-none rounded-xl border-border/40 bg-background/40 text-base focus-visible:ring-brand-primary/40'
						maxLength={5000}
					/>

					<div className='flex flex-col gap-3 rounded-xl border border-border/20 bg-background/35 p-3'>
						<p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
							{t('posts.create.privacy.label') || 'Privacy'}
						</p>
						<RadioGroup
							value={visibility}
							onValueChange={(value) => setVisibility(value as PostVisibility)}
							className='grid grid-cols-1 gap-2 sm:grid-cols-3'
						>
							{privacyOptions.map((option) => {
								const Icon = option.icon;
								return (
									<Label
										key={option.value}
										className={cn(
											'flex cursor-pointer items-center gap-2 rounded-lg border border-border/30 bg-card/40 p-2.5 text-xs sm:text-sm transition-colors hover:bg-muted/50',
											visibility === option.value && 'border-brand-primary/50 bg-brand-primary/10 text-brand-primary',
										)}
									>
										<RadioGroupItem value={option.value} />
										<Icon className='size-3.5 sm:size-4' />
										<span>{t(option.translationKey) || option.value}</span>
									</Label>
								);
							})}
						</RadioGroup>
					</div>
				</div>

				<DialogFooter>
					<Button type='button' variant='outline' className='rounded-xl' onClick={() => onOpenChange(false)}>
						{t('common.cancel') || 'Cancel'}
					</Button>
					<Button
						type='button'
						onClick={handleSubmit}
						disabled={updatePostMutation.isPending}
						className='gap-2 rounded-xl px-5 text-white font-semibold'
					>
						{updatePostMutation.isPending ? (
							<>
								{t('common.saving') || 'Saving...'}
								<Loader2Icon className='size-4 animate-spin' />
							</>
						) : (
							t('common.save') || 'Save'
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
