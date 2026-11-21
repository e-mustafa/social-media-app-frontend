import { LoginScreen } from '@/features/auth';

interface PageProps {
	searchParams: Promise<{ error?: string }>;
}
export default async function LoginPage() {
	return <LoginScreen />;
}
