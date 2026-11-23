import { SocketInitializer } from '@/features/chat/components/socket-initializer';
import { AppShell } from '@/features/layout/components/app-shell';
import { Navbar } from '@/features/layout/components/navbar';
import { configEnv } from '@/shared/config/env';
import { cookies } from 'next/headers';

export default async function GeneralLayout({ children }: { children: React.ReactNode }) {
	// Retrieve session token from server cookies
	const cookieStore = await cookies();
	const token = cookieStore.get(configEnv.tokens.keys.accessToken)?.value;
	return (
		<>
			<Navbar />
			<SocketInitializer token={token} />
			<AppShell>{children}</AppShell>
			{/* <FloatingDockNav /> */}
		</>
	);
}
