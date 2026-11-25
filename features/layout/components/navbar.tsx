'use client';

import { useAuth } from '@/features/auth/hooks/use-auth';
import NotificationDropdown from '@/features/notifications/components/notification-dropdown';
import { useRouter } from '@/i18n/navigation';
import LanguageSwitcher from '@/shared/components/language-switcher';
import { ThemeSwitcher } from '@/shared/components/theme-switcher';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { APP_CONFIGS, APP_ROUTES, defaultImages } from '@/shared/config/app-configs';
import { cn } from '@/shared/utils/utils';
import {
	BanIcon,
	LayoutDashboardIcon,
	LogInIcon,
	LogOutIcon,
	MessageSquareIcon,
	PowerIcon,
	SettingsIcon,
	User2Icon,
	UserPlus2Icon,
	Users2Icon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
// import { ThemeSwitcher } from '../theme-switcher';

export function Navbar() {
	const t = useTranslations();
	const router = useRouter();
	const { user, isAuthed, logout } = useAuth();

	const avatarUrl =
		(user?.avatar && user?.avatar.url) || (user?.gender === 1 ? defaultImages.avatarFemale : defaultImages.avatarMale);

	const navItems = [
		{ id: 'home', label: t('posts.feedTitle'), icon: LayoutDashboardIcon, href: APP_ROUTES.home },
		{ id: 'messages', label: t('messages.title'), icon: MessageSquareIcon, href: APP_ROUTES.chat },
		{ id: 'friends', label: t('friends.title'), icon: Users2Icon, href: APP_ROUTES.friends },
		// { id: 'notifications', label: t('navbar.notifications.title'), icon: BellIcon, href: APP_ROUTES.notifications },

		{ id: 'blocked', label: t('profile.blockedUsers.title'), icon: BanIcon, href: APP_ROUTES.blockList },
		{ id: 'settings', label: t('settings.title'), icon: SettingsIcon, href: APP_ROUTES.settings },
		{ id: 'separator' },
		{ id: 'logout', label: t('navbar.userMenu.logout'), icon: LogOutIcon, function: () => logout(false) },
		{ id: 'logout', label: t('navbar.userMenu.logoutFromAll'), icon: PowerIcon, function: () => logout(true) },
	];

	const navItemsVisitor = [
		{ id: 'login', label: t('auth.login.button'), icon: LogInIcon, href: APP_ROUTES.login },
		{ id: 'register', label: t('auth.register.title'), icon: UserPlus2Icon, href: APP_ROUTES.register },
	];

	return (
		<header className='sticky top-0 z-50 w-full border-b border-border/40 bg-card-glass backdrop-blur-md transition-all duration-300'>
			<div className='container mx-auto flex h-(--header-height) items-center justify-between px-4 sm:px-6'>
				{/* ─── (Logo) ─── */}
				<div className='flex items-center gap-2 cursor-pointer' onClick={() => router.push(APP_ROUTES.home)}>
					<div className='relative flex h-12 w-12 items-center justify-center rounded-xl drop-shadow-lg drop-shadow-accent text-primary-foreground shadow-lgx shadow-brand-primary/20'>
						<Image src={defaultImages.logo} alt='Logo' width={100} height={100} />
					</div>
					<span className='hidden font-sans text-xl font-bold tracking-tight text-foreground sm:block'>
						{APP_CONFIGS.name}
						<span className='text-brand-primary'>.</span>
					</span>
				</div>

				{/* ─── Tools and User Section ─── */}
				<div className='flex items-center gap-2 sm:gap-3'>
					<LanguageSwitcher />

					<ThemeSwitcher />

					<Button
						variant='ghost'
						size='icon'
						className='h-9 w-9 rounded-full text-brand-primary hover:text-foreground transition-all'
						onClick={() => router.push(APP_ROUTES.chat)}
					>
						<MessageSquareIcon className='size-5' />
					</Button>

					<NotificationDropdown />

					{/* 7. دروب داون ملف المستخدم (الملف الشخصي / تسجيل الدخول) */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant='ghost'
								className='relative h-9 w-9 rounded-full ring-2 ring-offset-2 ring-brand-primary/10 hover:ring-brand-primary/30 transition-all p-0'
							>
								<Avatar className='h-9 w-9'>
									<AvatarImage src={isAuthed ? avatarUrl : ''} />
									<AvatarFallback className='bg-brand-primary/10 text-brand-primary text-xs font-bold'>
										{user?.name ? user.name.substring(0, 2).toUpperCase() : <User2Icon className='h-4 w-4' />}
									</AvatarFallback>
								</Avatar>
							</Button>
						</DropdownMenuTrigger>

						<DropdownMenuContent
							align='end'
							className='w-60 mx-4 border-border/60 bg-card-glass backdrop-blur-md p-1.5 shadow-lg shadow-brand-secondary/30'
						>
							{user ? (
								<>
									{/* ─── Logged in user ─── */}
									<div className='flex items-center gap-2.5 p-2.5'>
										<Avatar className='h-9 w-9'>
											<AvatarImage src={avatarUrl} />
											<AvatarFallback className='bg-brand-primary/10 text-brand-primary font-bold'>
												{(user?.name || `${user.firstName || ''} ${user.lastName || ''}`)
													.substring(0, 2)
													.toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<div className='flex flex-col space-y-0.5'>
											<p className='text-sm font-semibold tracking-tight text-foreground'>
												{user?.name || `${user.firstName || ''} ${user.lastName || ''}`}
											</p>
											<p className='text-xs text-muted-foreground truncate max-w-37.5'>@{user.username}</p>
										</div>
									</div>
									<DropdownMenuSeparator />

									{navItems?.map((item, index) => {
										if (item.id === 'separator') {
											return <DropdownMenuSeparator key={item.id || index} />;
										}
										return (
											<DropdownMenuItem
												key={item.id || index}
												onClick={
													item.href ? () => router.push(item.href) : item.function ? item.function : () => {}
												}
												className={cn(
													'flex items-center gap-2 py-2 cursor-pointer rounded-md focus:bg-primary/20',
													item.id.includes('logout') &&
														'text-destructive focus:text-destructive focus:bg-destructive/10',
												)}
											>
												{item.icon && <item.icon className='h-4 w-4 ' />}
												<span className='text-sm'>{item.label}</span>
											</DropdownMenuItem>
										);
									})}

									{/* <DropdownMenuItem
										onClick={() => router.push(APP_ROUTES.chat)}
										className='flex items-center gap-2 py-2 cursor-pointer rounded-md'
									>
										<MailIcon className='h-4 w-4 text-muted-foreground' />
										<span className='text-sm'>{t('navbar.userMenu.chat')}</span>
									</DropdownMenuItem>

									<DropdownMenuItem
										onClick={() => router.push(APP_ROUTES.settings)}
										className='flex items-center gap-2 py-2 cursor-pointer rounded-md'
									>
										<SettingsIcon className='h-4 w-4 text-muted-foreground' />
										<span className='text-sm'>{t('navbar.userMenu.settings')}</span>
									</DropdownMenuItem>

									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() => logout(false)}
										disabled={isLoggingOut}
										className='flex items-center gap-2 py-2 text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer rounded-md'
									>
										<LogOutIcon className='h-4 w-4' />
										<span className='text-sm font-medium'>{t('navbar.userMenu.logout')}</span>
									</DropdownMenuItem>

									<DropdownMenuItem
										onClick={() => logout(true)}
										disabled={isLoggingOut}
										className='flex items-center gap-2 py-2 text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer rounded-md'
									>
										<PowerIcon className='h-4 w-4' />
										<span className='text-sm font-medium'>{t('navbar.userMenu.logoutFromAll')}</span>
									</DropdownMenuItem> */}
								</>
							) : (
								<>
									{/* ─── visitor user ─── */}
									<DropdownMenuLabel className='text-xs font-medium text-muted-foreground px-2.5 py-2'>
										{t('auth.welcome')}
									</DropdownMenuLabel>
									<DropdownMenuSeparator />

									{navItemsVisitor?.map((item, index) => {
										if (item.id === 'separator') {
											return <DropdownMenuSeparator key={item.id || index} />;
										}
										return (
											<DropdownMenuItem
												key={item.id || index}
												onClick={item.href ? () => router.push(item.href) : () => {}}
												className={cn(
													'flex items-center gap-2 py-2 cursor-pointer rounded-md focus:bg-primary/20',
													item.id.includes('logout') &&
														'text-destructive focus:text-destructive focus:bg-destructive/10',
												)}
											>
												{item.icon && <item.icon className='h-4 w-4 ' />}
												<span className='text-sm'>{item.label}</span>
											</DropdownMenuItem>
										);
									})}

									{/* <DropdownMenuItem
										onClick={() => router.push(APP_ROUTES.login)}
										className='flex items-center gap-2 py-2 cursor-pointer font-medium text-brand-primary focus:bg-brand-primary/5 rounded-md'
									>
										<span className='text-sm'>{t('auth.login.button')}</span>
									</DropdownMenuItem>

									<DropdownMenuItem
										onClick={() => router.push(APP_ROUTES.register)}
										className='flex items-center gap-2 py-2 cursor-pointer rounded-md'
									>
										<span className='text-sm'>{t('auth.register.title')}</span>
									</DropdownMenuItem> */}
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</header>
	);
}
