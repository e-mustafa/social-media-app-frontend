import { deleteCookies, getCookiesTokens, setCookiesTokens } from '@/features/auth/services/manage-cookies';
import { configEnv } from '@/shared/config/env';
import { NextResponse } from 'next/server';

export async function PATCH() {
	const { refreshToken } = await getCookiesTokens();
	if (!refreshToken) {
		return NextResponse.json({ error: 'No refresh token found' }, { status: 401 });
	}

	const res = await fetch(`${configEnv.apiBaseUrl}/auth/refresh-token`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			Cookie: `refreshToken=${refreshToken}`,
		},
		credentials: 'include',
	});

	if (!res.ok) {
		await deleteCookies();
		const errorData = await res.json().catch(() => ({ message: 'Failed to refresh token' }));
		return NextResponse.json(errorData, { status: res.status });
	}

	const result = await res.json();

	await setCookiesTokens(result.data);

	// Return access token for client-side Socket.IO update
	return NextResponse.json({
		success: true,
		message: 'Token refreshed successfully',
		data: {
			accessToken: result.data?.accessToken,
		},
	});
}
