'use client';
import LoginForm from '@/features/auth/components/login-form';
import { Link } from '@/i18n/navigation';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { APP_ROUTES } from '@/shared/config/app-configs';
import { useTranslations } from 'next-intl';
import LoginWithSocial from '../components/login-with-social';

export default function LoginScreen() {
	const t = useTranslations('auth');

	return (
		<>
			<CardHeader className='text-center'>
				<CardTitle className='text-2xl'>{t('login.title')}</CardTitle>
				<CardDescription>{t('login.description')}</CardDescription>
			</CardHeader>

			<CardContent>
				<LoginForm />
			</CardContent>

			<LoginWithSocial />

			<div className='text-center'>
				<p>
					{t('navigation.noAccount')}{' '}
					<Link href={APP_ROUTES.register} className='text-primary hover:underline'>
						{t('register.title')}
					</Link>
				</p>
			</div>
		</>
	);
}
