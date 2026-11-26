'use client';
import { useEffect, useRef } from 'react';
import { useSocketStore } from '../store/useSocketStore';
import { useAuthContext } from '@/features/auth/context/auth-context';

export function SocketInitializer() {
	const connect = useSocketStore((state) => state.connect);
	const disconnect = useSocketStore((state) => state.disconnect);
	const { accessToken, isInitialized } = useAuthContext();
	const prevTokenRef = useRef<string | null>(null);

	useEffect(() => {
		if (!isInitialized) return;

		if (accessToken) {
			if (accessToken !== prevTokenRef.current) {
				connect(accessToken);
				prevTokenRef.current = accessToken;
			}
		} else if (prevTokenRef.current) {
			// Disconnect socket only when token transition indicates user logout
			disconnect();
			prevTokenRef.current = null;
		}
	}, [accessToken, isInitialized, connect, disconnect]);

	return null;
}
