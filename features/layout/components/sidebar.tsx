'use client';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { useSocketStore } from '@/features/chat/store/useSocketStore';
import { usePathname, useRouter } from '@/i18n/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { APP_ROUTES, defaultImages } from '@/shared/config/app-configs';
import { cn } from '@/shared/utils/utils';
import { useAppStore } from '@/store/use-app-store';
import {
	BanIcon,
	BellIcon,
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
import { useEffect } from 'react';

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

	const isRTL = typeof document !== 'undefined' ? document.dir === 'rtl' : false;
	const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

	const isGuest = !isAuthed && !isAuthLoading;

	const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

	const publicNavItems = [
		{ id: 'home', label: t('home.badge'), icon: LayoutDashboardIcon, href: APP_ROUTES.home },
	];

	const navItems = [
		{ id: 'home', label: t('home.badge'), icon: LayoutDashboardIcon, href: APP_ROUTES.home },
		{ id: 'messages', label: t('messages.title'), icon: MessageSquareIcon, href: APP_ROUTES.messages },
		{ id: 'friends', label: t('friends.title'), icon: UsersIcon, href: APP_ROUTES.friends },
		{ id: 'notifications', label: t('navbar.notifications.title'), icon: BellIcon, href: '#notifications' },
	];

	const accountItems = [
		{
			id: 'edit-profile',
			label: t('profile.actions.editProfile') || t('common.edit'),
			icon: Edit3Icon,
			href: APP_ROUTES.profile,
		},
		{ id: 'settings', label: t('settings.title'), icon: SettingsIcon, href: APP_ROUTES.settings },
		{ id: 'blocked', label: t('profile.blockedUsers.title'), icon: BanIcon, href: '/user/blocked-users' },
		{ id: 'logout', label: t('auth.logout'), icon: LogOutIcon, onClick: () => logout(false) },
	];

	const guestAccountItems = [
		{ id: 'login', label: t('auth.login.button'), icon: LogOutIcon, onClick: () => router.push(APP_ROUTES.login) },
		{ id: 'register', label: t('auth.register.button'), icon: UsersIcon, onClick: () => router.push(APP_ROUTES.register) },
	];

	const avatarUrl =
		(user?.avatar && user?.avatar.url) || (user?.gender === 1 ? defaultImages.avatarFemale : defaultImages.avatarMale);

	// Close mobile menu when navigating
	useEffect(() => {
		if (isMobileMenuOpen) {
			onMobileMenuToggle?.();
		}
	}, [pathname]);

	return (
		<aside
			className={cn(
				'hidden sticky top-20 mt-4 max-h-full overflow-hidden md:flex flex-col shrink-0 border-r border-border/30 bg-card-glass backdrop-blur-md transition-all duration-300 z-40 bg-linear-to-t from-brand-primary/10 animate-in slide-in-from-top-5',
				isCollapsed ? 'w-16' : 'w-80',
				isMobile && !isMobileMenuOpen ? 'hidden' : '',
			)}
		>
			{/* Header - User Identity or Guest Welcome */}
			<div className='flex flex-col px-4 pt-4 pb-6 bg-card-glass/50 border-b border-border/30 relative overflow-hidden'>
				{isAuthed ? (
					<>
						{/* Cover Image */}
						<div className='relative -mt-4 -mx-4 pt-4 h-32 overflow-hidden rounded-xl bg-card-blur/50 border border-border/20 mb-4'>
							<Image
								src={user?.covers?.[0]?.url || defaultImages.cover}
								alt='Cover Photo'
								className='absolute inset-0 w-full h-full object-cover opacity-60'
								width={100}
								height={100}
							/>
						</div>

						{/* Avatar + Name Section */}
						<div className='flex items-center gap-4 -mt-6 mb-4 pl-4 relative z-10'>
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
										'absolute bottom-0 end-0 size-4 rounded-full border-2 border-background',
										isConnected ? 'bg-emerald-500' : 'bg-muted-foreground/40',
									)}
								/>
							</div>
							<div className='min-w-0 flex flex-col'>
								<span className='text-sm font-semibold text-foreground truncate'>
									{user?.firstName} {user?.lastName}
								</span>
								<span className='text-xs text-muted-foreground truncate'>@{user?.username}</span>
								{/* User Bio */}
								{user?.bio && <p className='text-xs text-muted-foreground mt-1 truncate'>{user.bio}</p>}
							</div>
						</div>
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
					</>
				)}
			</div>

			{/* Navigation */}
			<nav className='flex-1 px-3 py-3 space-y-1 overflow-y-auto'>
				{(isGuest ? publicNavItems : navItems).map((item) => {
					const active = isActive(item.href as string);
					return (
						<Link
							key={item.id}
							href={item.href as string}
							// onClick={() => {
							// 	onMobileMenuToggle?.();
							// }}
							className={cn(
								'flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors',
								active
									? 'bg-brand-primary/10 text-brand-primary'
									: 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
							)}
						>
							<item.icon
								className={cn('w-4 h-4 shrink-0', active ? 'text-brand-primary' : 'text-muted-foreground')}
							/>
							<span className={cn(isCollapsed ? 'hidden' : '')}>{item.label}</span>
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
			<div className='px-3 py-3 border-t border-border/30 space-y-2'>
				{isGuest ? (
					guestAccountItems.map((item) => (
						<button
							key={item.id}
							type='button'
							onClick={item.onClick}
							className={cn(
								'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors',
								'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
							)}
						>
							<item.icon className='w-4 h-4 shrink-0' />
							<span className={cn(isCollapsed ? 'hidden' : '')}>{item.label}</span>
						</button>
					))
				) : (
					accountItems.map((item) => {
						const active = isActive(item.href as string);
						if (item.id === 'logout') {
							return (
								<button
									key={item.id}
									type='button'
									onClick={() => {
										logout(false);
										// onMobileMenuToggle?.();
									}}
									className={cn(
										'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors',
										active
											? 'bg-brand-primary/10 text-brand-primary'
											: 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
									)}
								>
									<item.icon className='w-4 h-4 text-destructive shrink-0' />
									<span className={cn(isCollapsed ? 'hidden' : '')}>{item.label}</span>
								</button>
							);
						}
						return (
							<Link
								key={item.id}
								href={item.href as string}
								// onClick={() => onMobileMenuToggle?.()}
								className={cn(
									'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors',
									active
										? 'bg-brand-primary/10 text-brand-primary'
										: 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
								)}
							>
								<item.icon
									className={cn('w-4 h-4 shrink-0', active ? 'text-brand-primary' : 'text-muted-foreground')}
								/>
								<span className={cn(isCollapsed ? 'hidden' : '')}>{item.label}</span>
							</Link>
						);
					})
				)}

				{/* Theme toggle */}
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
					className='w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground cursor-pointer'
					title={t('settings.themeTitle')}
				>
					<span>{theme === 'violet' ? '🟣' : theme === 'emerald' ? '🟢' : theme === 'sunset' ? '🟠' : '🔵'}</span>
					<span className={cn(isCollapsed ? 'hidden' : '')}>{t('settings.themeTitle')}</span>
				</button>
			</div>
		</aside>
	);
}
