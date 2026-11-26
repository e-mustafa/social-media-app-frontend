'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextValue {
	accessToken: string | null;
	setAccessToken: (token: string | null) => void;
	isInitialized: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [accessToken, setAccessToken] = useState<string | null>(null);
	const [isInitialized] = useState(true);

	return (
		<AuthContext.Provider value={{ accessToken, setAccessToken, isInitialized }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuthContext() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuthContext must be used within an AuthProvider');
	}
	return context;
}