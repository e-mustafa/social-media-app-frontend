import { usePathname, useRouter } from '@/i18n/navigation';
import { useLocale } from 'next-intl';

export default function useToggleLanguage() {
	const router = useRouter();
	const pathname = usePathname();
	const locale = useLocale();

	const toggleLanguage = () => {
		const nextLocale = locale === 'ar' ? 'en' : 'ar';
		router.replace(pathname, { locale: nextLocale });
	};

	return { locale, toggleLanguage, router, pathname };
}
