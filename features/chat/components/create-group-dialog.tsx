'use client';

import { useState, useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import { XIcon, SearchIcon, Loader2Icon, UserPlusIcon, ImageIcon, UsersIcon, CheckIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Separator } from '@/shared/components/ui/separator';
import { cn } from '@/shared/utils/utils';
import { useSearchFriends, getFlattenedUsers } from '../hooks/use-user-search';
import { useCreateGroup } from '../hooks/use-chat-actions';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { APP_ROUTES } from '@/shared/config/app-configs';

interface CreateGroupDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function CreateGroupDialog({ open, onOpenChange }: CreateGroupDialogProps) {
	const t = useTranslations();
	const router = useRouter();
	const { user } = useAuth();
	const [searchQuery, setSearchQuery] = useState('');
	const [groupName, setGroupName] = useState('');
	const [groupImage, setGroupImage] = useState<File | null>(null);
	const [groupImagePreview, setGroupImagePreview] = useState<string | null>(null);
	const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

	const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } = useSearchFriends({
		search: searchQuery,
		limit: 20,
	});
	const createGroupMutation = useCreateGroup();

	const friends = getFlattenedUsers(data?.pages);
	const filteredFriends = friends.filter((friend) => friend._id !== user?.id);

	const isFormValid = groupName.trim().length >= 3 && selectedUserIds.length > 0;

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (!file.type.startsWith('image/')) {
				return;
			}
			if (file.size > 5 * 1024 * 1024) {
				return;
			}
			setGroupImage(file);
			setGroupImagePreview(URL.createObjectURL(file));
		}
	};

	const toggleUserSelection = useCallback((userId: string) => {
		setSelectedUserIds((prev) =>
			prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
		);
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!isFormValid) return;

		createGroupMutation.mutate(
			{
				participants: selectedUserIds,
				groupName: groupName.trim(),
				groupImg: groupImage || undefined,
			},
			{
				onSuccess: (res) => {
					if (res.data?._id) {
						onOpenChange(false);
						router.push(`${APP_ROUTES.chat}/${res.data._id}`);
					}
				},
			}
		);
	};

	const handleSearchChange = (value: string) => {
		setSearchQuery(value);
	};

	const removeImage = () => {
		setGroupImage(null);
		setGroupImagePreview(null);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='max-w-md max-h-[90vh] sm:max-w-lg' showCloseButton={false}>
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle className='flex items-center justify-between'>
							{t('chat.createGroup.title') || 'Create Group'}
							<Button
								type='button'
								variant='ghost'
								size='icon'
								className='h-8 w-8'
								onClick={() => onOpenChange(false)}
								aria-label={t('common.close') || 'Close'}
							>
								<XIcon className='size-4' />
							</Button>
						</DialogTitle>
						<DialogDescription>
							{t('chat.createGroup.description') || 'Create a new group chat with your friends'}
						</DialogDescription>
					</DialogHeader>

					<div className='space-y-4 py-2'>
						{/* Group Image */}
						<div className='flex items-center justify-center'>
							<div className='relative'>
								<button
									type='button'
									onClick={() => document.getElementById('group-image-input')?.click()}
									className={cn(
										'relative size-24 rounded-full overflow-hidden border-2 border-border/30 cursor-pointer transition-all hover:border-brand-primary/50',
										groupImagePreview && 'border-brand-primary'
									)}
								>
									{groupImagePreview ? (
										<Image
											src={groupImagePreview}
											alt={t('chat.createGroup.groupImageAlt') || 'Group image'}
											fill
											className='object-cover'
											sizes='96px'
										/>
									) : (
										<>
											<UsersIcon className='size-10 text-muted-foreground' />
											<div className='absolute inset-0 bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10' />
										</>
									)}
									<div className='absolute bottom-0 right-0 size-6 rounded-full bg-brand-primary flex items-center justify-center border-2 border-background'>
										<ImageIcon className='size-3 text-white' />
									</div>
								</button>
								<input
									id='group-image-input'
									type='file'
									accept='image/*'
									onChange={handleImageChange}
									className='hidden'
								/>
								{groupImagePreview && (
									<button
										type='button'
										onClick={removeImage}
										className='absolute -top-2 -right-2 size-6 rounded-full bg-destructive text-white flex items-center justify-center shadow-lg hover:bg-destructive/90 transition-colors'
										aria-label={t('chat.createGroup.removeImage') || 'Remove image'}
									>
										<XIcon className='size-3' />
									</button>
								)}
							</div>
						</div>

						{/* Group Name */}
						<div>
							<Input
								value={groupName}
								onChange={(e) => setGroupName(e.target.value)}
								placeholder={t('chat.createGroup.namePlaceholder') || 'Group name (min 3 characters)'}
								maxLength={100}
								className='text-center text-lg'
								autoFocus
							/>
							{groupName.length > 0 && groupName.length < 3 && (
								<p className='text-xs text-destructive mt-1 text-center'>
									{t('chat.createGroup.nameTooShort') || 'Group name must be at least 3 characters'}
								</p>
							)}
						</div>

						<Separator />

						{/* Member Selection */}
						<div className='space-y-2'>
							<div className='flex items-center justify-between'>
								<h3 className='text-sm font-medium text-foreground'>
									{t('chat.createGroup.addMembers') || 'Add Members'} ({selectedUserIds.length})
								</h3>
							</div>
							<div className='relative'>
								<SearchIcon className='absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
								<Input
									value={searchQuery}
									onChange={(e) => handleSearchChange(e.target.value)}
									placeholder={t('chat.createGroup.searchPlaceholder') || 'Search friends to add...'}
									className='ps-9'
								/>
							</div>

							<ScrollArea className='max-h-[40vh]'>
								{isLoading && filteredFriends.length === 0 ? (
									<div className='flex items-center justify-center py-8'>
										<Loader2Icon className='size-6 animate-spin text-brand-primary' />
									</div>
								) : filteredFriends.length > 0 ? (
									<div className='space-y-1'>
										{filteredFriends.map((friend) => {
											const isSelected = selectedUserIds.includes(friend._id);
											return (
												<button
													key={friend._id}
													type='button'
													onClick={() => toggleUserSelection(friend._id)}
													className={cn(
														'flex w-full items-center gap-3 p-2 rounded-xl transition-colors',
														'hover:bg-muted/50',
														isSelected && 'bg-brand-primary/10'
													)}
												>
													<Avatar className='size-9'>
														<AvatarImage src={friend.avatar?.url} alt={friend.firstName} />
														<AvatarFallback>
															{friend.firstName?.[0]}{friend.lastName?.[0]}
														</AvatarFallback>
													</Avatar>
													<div className='min-w-0 flex-1'>
														<p className='truncate font-medium text-foreground'>
															{friend.firstName} {friend.lastName}
														</p>
														{friend.username && (
															<p className='truncate text-xs text-muted-foreground'>@{friend.username}</p>
														)}
													</div>
													{isSelected ? (
														<CheckIcon className='size-5 text-brand-primary shrink-0' />
													) : (
														<UserPlusIcon className='size-5 text-muted-foreground shrink-0' />
													)}
												</button>
											);
										})}
									</div>
								) : searchQuery ? (
									<div className='flex flex-col items-center justify-center py-8 px-4 text-center'>
										<UserPlusIcon className='size-10 text-muted-foreground/50 mb-2' />
										<p className='text-sm text-muted-foreground'>
											{t('chat.createGroup.noResults') || 'No friends found matching your search'}
										</p>
									</div>
								) : (
									<div className='flex flex-col items-center justify-center py-8 px-4 text-center'>
										<UserPlusIcon className='size-10 text-muted-foreground/50 mb-2' />
										<p className='text-sm text-muted-foreground'>
											{t('chat.createGroup.startSearch') || 'Search for friends to add to the group'}
										</p>
									</div>
								)}

								{!isLoading && hasNextPage && (
									<div className='flex justify-center py-2'>
										<Button
											type='button'
											variant='outline'
											size='sm'
											onClick={() => fetchNextPage()}
											disabled={isFetchingNextPage}
											className='rounded-xl'
										>
											{isFetchingNextPage ? (
												<Loader2Icon className='size-4 mr-2 animate-spin' />
											) : null}
											{t('common.loadMore') || 'Load more'}
										</Button>
									</div>
								)}
							</ScrollArea>
						</div>

						{selectedUserIds.length > 0 && (
							<div className='border-t pt-2'>
								<p className='text-xs text-muted-foreground text-center mb-2'>
									{t('chat.createGroup.membersSelected', { count: selectedUserIds.length + 1 }) || 
									`${selectedUserIds.length + 1} members (including you)`}
								</p>
							</div>
						)}
					</div>

					<DialogFooter className='gap-2'>
						<Button
							type='button'
							variant='outline'
							className='flex-1'
							onClick={() => onOpenChange(false)}
							disabled={createGroupMutation.isPending}
						>
							{t('common.cancel') || 'Cancel'}
						</Button>
						<Button
							type='submit'
							className='flex-1'
							disabled={!isFormValid || createGroupMutation.isPending}
						>
							{createGroupMutation.isPending ? (
								<>
									<Loader2Icon className='size-4 mr-2 animate-spin' />
									{t('chat.createGroup.creating') || 'Creating...'}
								</>
							) : (
								<>
									<UsersIcon className='size-4 mr-2' />
									{t('chat.createGroup.create') || 'Create Group'}
								</>
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}