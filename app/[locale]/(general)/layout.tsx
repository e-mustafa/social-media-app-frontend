import { SocketInitializer } from '@/features/chat/components/socket-initializer';
import { AppShell } from '@/features/layout/components/app-shell';
import { Navbar } from '@/features/layout/components/navbar';

export default function GeneralLayout({ children }: { children: React.ReactNode }) {
	// Token is managed client-side via useAuth hook; SocketInitializer reads from auth context
	return (
		<>
			<Navbar />
			<SocketInitializer />
			<AppShell>{children}</AppShell>
			{/* <FloatingDockNav /> */}
		</>
	);
}
