'use client';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { useSocketStore } from '@/features/chat/store/useSocketStore';
import { useMyFriends } from '@/features/friends/hooks/use-friends';
import { usePathname, useRouter } from '@/i18n/navigation';
import LanguageSwitcher from '@/shared/components/language-switcher';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { APP_ROUTES, defaultImages } from '@/shared/config/app-configs';
import useToggleLanguage from '@/shared/hooks/use-toggle-Language';
import { cn } from '@/shared/utils/utils';
import { useAppStore } from '@/store/use-app-store';
import {
	BanIcon,
	BellIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	Edit3Icon,
	LayoutDashboardIcon,
	LogOutIcon,
	MessageSquareIcon,
	SettingsIcon,
	UsersIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface SidebarProps {
	isCollapsed?: boolean;
	onToggle?: () => void;
	isMobileMenuOpen?: boolean;
	onMobileMenuToggle?: () => void;
}

export function Sidebar({ isCollapsed = false, onToggle, isMobileMenuOpen = false, onMobileMenuToggle }: SidebarProps) {
	const t = useTranslations();
	const router = useRouter();
	const pathname = usePathname();
	const { user, isAuthed, logout, isLoggingOut, isLoading: isAuthLoading } = useAuth();
	const { isConnected } = useSocketStore();
	const { theme, setTheme } = useAppStore();
	const { toggleLanguage } = useToggleLanguage();

	const isRTL = typeof document !== 'undefined' ? document.dir === 'rtl' : false;
	const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

	const isGuest = !isAuthed && !isAuthLoading;

	const { data: friendsData } = useMyFriends();
	console.log('friendsData', friendsData);
	const friendsCount = friendsData?.pages.flatMap((page) => page.data).length ?? 0;

	const [hoveredItem, setHoveredItem] = useState<string | null>(null);

	const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

	const publicNavItems = [{ id: 'home', label: t('home.badge'), icon: LayoutDashboardIcon, href: APP_ROUTES.home }];

	const navItems = [
		{ id: 'home', label: t('home.badge'), icon: LayoutDashboardIcon, href: APP_ROUTES.home },
		{ id: 'messages', label: t('messages.title'), icon: MessageSquareIcon, href: APP_ROUTES.messages },
		{ id: 'friends', label: t('friends.title'), icon: UsersIcon, href: APP_ROUTES.friends },
		{ id: 'notifications', label: t('navbar.notifications.title'), icon: BellIcon, href: '#notifications' },
	];

	const accountItems = [
		{
			id: 'edit-profile',
			label: t('navbar.userMenu.profile') || t('common.edit'),
			icon: Edit3Icon,
			href: APP_ROUTES.profile,
		},
		{ id: 'settings', label: t('settings.title'), icon: SettingsIcon, href: APP_ROUTES.settings },
		{ id: 'blocked', label: t('profile.blockedUsers.title'), icon: BanIcon, href: '/user/blocked-users' },
		{ id: 'logout', label: t('navbar.userMenu.logout'), icon: LogOutIcon, onClick: () => logout(false) },
	];

	const guestAccountItems = [
		{ id: 'login', label: t('auth.login.button'), icon: LogOutIcon, onClick: () => router.push(APP_ROUTES.login) },
		{ id: 'register', label: t('auth.register.button'), icon: UsersIcon, onClick: () => router.push(APP_ROUTES.register) },
	];

	const avatarUrl =
		(user?.avatar && user?.avatar.url) || (user?.gender === 1 ? defaultImages.avatarFemale : defaultImages.avatarMale);

	const CollapseIcon = isRTL ? ChevronLeftIcon : ChevronRightIcon;

	// Close mobile menu when navigating
	useEffect(() => {
		if (isMobileMenuOpen) {
			onMobileMenuToggle?.();
		}
	}, [pathname]);

	const tooltipLabel = (() => {
		if (!isCollapsed || !hoveredItem) return null;
		const allItems = [...publicNavItems, ...navItems, ...accountItems, ...guestAccountItems];
		const item = allItems.find((i) => i.id === hoveredItem);
		return item ? item.label : null;
	})();

	return (
		<>
			<aside
				className={cn(
					'hidden sticky top-20 mt-4 max-h-full overflow-hidden md:flex flex-col shrink-0 border-r border-border/30 bg-card-glass backdrop-blur-md transition-all duration-300 z-40 bg-linear-to-t from-brand-primary/10 page-animation',
					isCollapsed ? 'w-20' : 'w-80',
					isMobile && !isMobileMenuOpen ? 'hidden' : '',
				)}
			>
				{/* Header - User Identity or Guest Welcome */}
				<div className='flex flex-col px-3 pb-5 bg-card-glass/50 border-b border-border/30 relative overflow-hidden'>
					{isAuthed ? (
						<>
							{/* Cover Image */}
							<div className='relative -mx-3 pt-3 h-24 overflow-hidden rounded-xl bg-card-blur/50 border border-border/20 mb-3'>
								<Image
									src={user?.covers?.[0]?.url || defaultImages.cover}
									alt='Cover Photo'
									className='absolute inset-0 w-full h-full object-cover opacity-60'
									width={100}
									height={100}
								/>
							</div>

							{/* Avatar + Stats Section */}
							<div className='flex items-center gap-2 -mt-8 mb-2 pl-3 relative z-10'>
								<div className='relative shrink-0'>
									<Avatar className='size-20 rounded-full border-2 border-white bg-card-glass shadow-lg'>
										<AvatarImage src={avatarUrl} alt={user?.firstName || ''} />
										<AvatarFallback>
											{user?.firstName?.charAt(0) || ''}
											{user?.lastName?.charAt(0) || ''}
										</AvatarFallback>
									</Avatar>
									<span
										className={cn(
											'absolute bottom-0 end-0 size-5 rounded-full border-2 border-background',
											isConnected ? 'bg-emerald-500' : 'bg-muted-foreground/40',
										)}
									/>
								</div>
								<div className='min-w-0 flex flex-col'>
									<span className='font-semibold text-xl text-foreground truncate'>
										{user?.firstName} {user?.lastName}
									</span>
									<span className='text-xs text-muted-foreground truncate'>@{user?.username}</span>
									{/* Friends Count */}
									{user?.username && (
										<button
											onClick={() => router.push(APP_ROUTES.friends)}
											title={t('friends.title') || 'Friends'}
											className='mt-1 flex items-center gap-1 text-xs text-brand-primary hover:text-brand-primary/80'
										>
											<UsersIcon className='w-3 h-3' />
											<span>{friendsCount || 0}</span>
										</button>
									)}
								</div>
							</div>

							{/* Collapse Toggle (collapsed only) */}
							{isCollapsed && (
								<button
									onClick={onToggle}
									className='absolute bottom-3 right-3 z-20 p-1.5 rounded-full hover:bg-border/50 transition-colors'
									title={t('common.expand') || 'Expand'}
									aria-label={t('common.expand') || 'Expand'}
								>
									<CollapseIcon className='w-4 h-4 text-muted-foreground hover:text-foreground' />
								</button>
							)}
						</>
					) : (
						<>
							{/* Guest Welcome Header */}
							<div className='text-center'>
								<h3 className='text-sm font-semibold text-foreground'>{t('guest.welcome') || 'Welcome'}</h3>
								<p className='text-xs text-muted-foreground mt-1'>
									{t('guest.joinDescription') || 'Join to start sharing and connecting.'}
								</p>
							</div>

							{/* Collapse Toggle (collapsed only) */}
							{isCollapsed && (
								<button
									onClick={onToggle}
									className='absolute bottom-3 right-3 z-20 p-1.5 rounded-full hover:bg-border/50 transition-colors'
									title={t('common.expand') || 'Expand'}
									aria-label={t('common.expand') || 'Expand'}
								>
									<CollapseIcon className='w-4 h-4 text-muted-foreground hover:text-foreground' />
								</button>
							)}
						</>
					)}
				</div>

				{/* Navigation */}
				<nav className='flex-1 px-2 py-2 space-y-0.5 overflow-y-auto'>
					{(isGuest ? publicNavItems : navItems).map((item) => {
						const active = isActive(item.href as string);
						return (
							<Link
								key={item.id}
								href={item.href as string}
								onMouseEnter={() => setHoveredItem(item.id)}
								onMouseLeave={() => setHoveredItem(null)}
								title={isCollapsed ? item.label : undefined}
								className={cn(
									'flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-colors',
									active
										? 'bg-brand-primary/10 text-brand-primary'
										: 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
								)}
							>
								<item.icon
									className={cn('w-4 h-4 shrink-0', active ? 'text-brand-primary' : 'text-muted-foreground')}
								/>
								{!isCollapsed && <span className={cn(isCollapsed ? 'hidden' : '')}>{item.label}</span>}
								{item.id === 'messages' && (
									<Badge variant='secondary' className='ml-auto h-5 w-5 px-2 text-[10px]'>
										3
									</Badge>
								)}
							</Link>
						);
					})}
				</nav>

				{/* Account Section */}
				<div className='px-2 py-2 border-t border-border/30 space-y-1'>
					{isGuest
						? guestAccountItems.map((item) => (
								<button
									key={item.id}
									type='button'
									onClick={item.onClick}
									onMouseEnter={() => setHoveredItem(item.id)}
									onMouseLeave={() => setHoveredItem(null)}
									title={isCollapsed ? item.label : undefined}
									className={cn(
										'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-colors',
										'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
									)}
								>
									<item.icon className='w-4 h-4 shrink-0' />
									{!isCollapsed && <span className={cn(isCollapsed ? 'hidden' : '')}>{item.label}</span>}
								</button>
							))
						: accountItems.map((item) => {
								const active = isActive(item.href as string);
								if (item.id === 'logout') {
									return (
										<button
											key={item.id}
											type='button'
											onClick={() => {
												logout(false);
											}}
											onMouseEnter={() => setHoveredItem(item.id)}
											onMouseLeave={() => setHoveredItem(null)}
											title={isCollapsed ? item.label : undefined}
											className={cn(
												'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-colors cursor-pointer',
												active
													? 'bg-brand-primary/10 text-brand-primary'
													: 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
											)}
										>
											<item.icon className='w-4 h-4 text-destructive shrink-0' />
											{!isCollapsed && <span className={cn(isCollapsed ? 'hidden' : '')}>{item.label}</span>}
										</button>
									);
								}
								return (
									<Link
										key={item.id}
										href={item.href as string}
										onMouseEnter={() => setHoveredItem(item.id)}
										onMouseLeave={() => setHoveredItem(null)}
										title={isCollapsed ? item.label : undefined}
										className={cn(
											'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-colors cursor-pointer',
											active
												? 'bg-brand-primary/10 text-brand-primary'
												: 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
										)}
									>
										<item.icon
											className={cn('w-4 h-4 shrink-0', active ? 'text-brand-primary' : 'text-muted-foreground')}
										/>
										{!isCollapsed && <span className={cn(isCollapsed ? 'hidden' : '')}>{item.label}</span>}
									</Link>
								);
							})}

					{/* Theme toggle */}
					<div className='flex gap-3'>
						<button
							type='button'
							onClick={() =>
								setTheme(
									theme === 'violet'
										? 'emerald'
										: theme === 'emerald'
											? 'sunset'
											: theme === 'sunset'
												? 'ocean'
												: 'violet',
								)
							}
							onMouseEnter={() => setHoveredItem('theme')}
							onMouseLeave={() => setHoveredItem(null)}
							title={isCollapsed ? t('settings.themeTitle') : undefined}
							className='w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-muted/50 text-muted-foreground hover:text-foreground cursor-pointer'
						>
							<span>{theme === 'violet' ? '🟣' : theme === 'emerald' ? '🟢' : theme === 'sunset' ? '🟠' : '🔵'}</span>
							{!isCollapsed && <span className={cn(isCollapsed ? 'hidden' : '')}>{t('settings.themeTitle')}</span>}
						</button>

						<div
							onClick={toggleLanguage}
							className='w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-muted/50 text-muted-foreground hover:text-foreground cursor-pointer'>
							<LanguageSwitcher />
							{!isCollapsed && <span className={cn(isCollapsed ? 'hidden' : '')}>{t('settings.languageTitle')}</span>}
						</div>
					</div>
				</div>
			</aside>

			{/* Collapsed Tooltip (positioned at sidebar edge) */}
			{isCollapsed && hoveredItem && tooltipLabel && (
				<div
					className={cn(
						'fixed z-50 px-2 py-1 bg-border text-foreground text-xs rounded shadow-lg border border-border/50 whitespace-nowrap',
						isRTL ? 'left-full -translate-x-1/2' : 'right-full -translate-x-1/2',
					)}
					style={{
						top: '140px',
					}}
				>
					{tooltipLabel}
				</div>
			)}
		</>
	);
}
