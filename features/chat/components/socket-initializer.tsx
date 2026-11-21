'use client';
import { useEffect, useRef } from 'react';
import { useSocketStore } from '../store/useSocketStore';

interface SocketInitializerProps {
	token?: string;
}

export function SocketInitializer({ token }: SocketInitializerProps) {
	const connect = useSocketStore((state) => state.connect);
	const disconnect = useSocketStore((state) => state.disconnect);
	const prevTokenRef = useRef<string | undefined>(token);

	useEffect(() => {
		if (token) {
			connect(token);
		} else if (!token && prevTokenRef.current) {
			// Disconnect socket only when token transition indicates user logout
			disconnect();
		}

		prevTokenRef.current = token;
	}, [token, connect, disconnect]);

	return null;
}
