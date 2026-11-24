'use client';

import { usePathname } from '@/i18n/navigation';
import { MenuIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Sidebar } from './sidebar';

interface AppShellProps {
	children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
	const pathname = usePathname();
	const t = useTranslations();
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	const handleToggle = () => {
		setIsCollapsed(!isCollapsed);
	};

	return (
		// <div className='flex h-full w-full overflow-hidden max-w-7xl mx-auto'>
		// <div className='relative min-h-[calc(100dvh-var(--header-height)-5px)] h-[calc(100dvh-var(--header-height)-5px)] overflow-hidden w-full max-w-7xl mx-auto flex gap-6'>
		<div className='relative min-h-dvh-no-header h-dvh-no-header w-full max-w-7xl mx-auto flex gap-6'>
			<Sidebar
				isCollapsed={isCollapsed}
				onToggle={handleToggle}
				isMobileMenuOpen={isMobileMenuOpen}
				onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
			/>
			<div className='flex-1 overflow-hidden relative'>
				{/* Mobile hamburger button */}
				<button
					type='button'
					className='absolute top-4 left-4 z-50 p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground sm:hidden'
					onClick={() => setIsMobileMenuOpen(true)}
					aria-label={t('common.menu')}
				>
					<MenuIcon className='w-6 h-6' />
				</button>
				<main className='flex h-full w-full flex-col overflow-hidden'>
					<div className='flex-1 overflow-y-auto py-4 px-4 sm:ps-0 scrollbar-none'>{children}</div>
				</main>
			</div>
			{/* Mobile backdrop */}
			{isMobileMenuOpen && (
				<div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-40' onClick={() => setIsMobileMenuOpen(false)} />
			)}
		</div>
	);
}
