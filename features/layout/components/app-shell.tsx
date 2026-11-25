'use client';

import { usePathname } from '@/i18n/navigation';
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
		<div className='relative min-h-dvh-no-header h-dvh-no-header w-full max-w-7xl mx-auto flex gap-6'>
			<Sidebar
				isCollapsed={isCollapsed}
				onToggle={handleToggle}
				isMobileMenuOpen={isMobileMenuOpen}
				onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
			/>

			<main className='flex h-full w-full flex-col overflow-hidden'>
				<div className='relative flex-1 overflow-y-auto py-4 px-4 sm:ps-0 scrollbar-none'>{children}</div>
			</main>
		</div>
	);
}
