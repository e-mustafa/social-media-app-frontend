'use client';

import { useTranslations } from 'next-intl';
import { APP_ROUTES } from '@/shared/config/app-configs';
import { useRouter } from '@/i18n/navigation';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { LogInIcon, UserPlusIcon } from 'lucide-react';

interface AuthRequiredDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function AuthRequiredDialog({ open, onOpenChange }: AuthRequiredDialogProps) {
	const t = useTranslations();
	const router = useRouter();

	const handleLogin = () => {
		onOpenChange(false);
		router.push(APP_ROUTES.login);
	};

	const handleRegister = () => {
		onOpenChange(false);
		router.push(APP_ROUTES.register);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>
				<button />
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t('authRequired.title') || 'Log In Required'}</DialogTitle>
					<DialogDescription>
						{t('authRequired.description') || 'Please log in to perform this action.'}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						type='button'
						variant='outline'
						onClick={handleRegister}
						className='w-full sm:w-auto'
					>
						<UserPlusIcon className='w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2' />
						{t('authRequired.createAccount') || 'Create Account'}
					</Button>
					<Button type='button' onClick={handleLogin} className='w-full sm:w-auto'>
						<LogInIcon className='w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2' />
						{t('authRequired.login') || 'Log In'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
