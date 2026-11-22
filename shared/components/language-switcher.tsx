import { Button } from '@/shared/components/ui/button';
import { GlobeIcon } from 'lucide-react';
import useToggleLanguage from '../hooks/use-toggle-Language';
import { SmartTooltip } from './custom-ui/smart-tooltip';

export default function LanguageSwitcher() {
	// const router = useRouter();
	// const pathname = usePathname();
	// const locale = useLocale();

	// const toggleLanguage = () => {
	// 	const nextLocale = locale === 'ar' ? 'en' : 'ar';
	// 	router.replace(pathname, { locale: nextLocale });
	// };

	const { locale, toggleLanguage } = useToggleLanguage();

	return (
		<SmartTooltip>
			<Button
				variant='ghost'
				size='icon'
				className='h-9 w-9 rounded-full text-brand-primary hover:text-foreground'
				onClick={toggleLanguage}
				aria-label={locale === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
				title={locale === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
			>
				<GlobeIcon className='size-5' />
			</Button>
		</SmartTooltip>
	);
}
