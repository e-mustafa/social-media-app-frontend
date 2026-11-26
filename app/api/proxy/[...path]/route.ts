import { getCookiesTokens } from '@/features/auth/services/manage-cookies';
import { configEnv } from '@/shared/config/env';
import { NextRequest, NextResponse } from 'next/server';

async function handleProxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
	const { accessToken } = await getCookiesTokens();

	// Resolve dynamic route parameters (Next.js 15+ async params)
	const resolvedParams = await params;
	const apiPath = resolvedParams.path.join('/');
	const searchParams = request.nextUrl.search; // Preserves query params like ?page=1

	// Normalize backend URL to avoid accidental double slashes
	const baseUrl = configEnv.apiBaseUrl.replace(/\/$/, '');
	const normalizedPath = apiPath.replace(/^\//, '');
	const backendUrl = `${baseUrl}/${normalizedPath}${searchParams}`;

	// Clone incoming headers from the browser
	const headers = new Headers(request.headers);

	// Explicitly remove any browser-supplied Authorization header before deciding
	// whether to attach the trusted cookie-derived token. This prevents a stale
	// or malicious client Authorization header from overriding the server-side token.
	headers.delete('authorization');

	// Server-side: Swap secure HttpOnly cookie for a Bearer Token
	if (accessToken) {
		headers.set('Authorization', `Bearer ${accessToken}`);
	}

	// Delete the host header to prevent CORS issues with the backend API
	headers.delete('host');

	// Forward Accept-Language header for locale-aware backend responses
	// (It should already be in headers from the clone, but ensure it's preserved)
	const acceptLanguage = headers.get('accept-language');
	if (!acceptLanguage) {
		// Default to English if no Accept-Language was sent
		headers.set('accept-language', 'en');
	}

	// Tell the backend NOT to compress the response.
	// Node's native fetch auto-decompresses anyway, so compressing/decompressing
	// between proxy and backend is just wasted server CPU cycles.
	headers.delete('accept-encoding');

	// Check if the request method typically includes a payload body
	const hasBody = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);

	try {
		const response = await fetch(backendUrl, {
			method: request.method,
			headers,
			// Forward the request body directly as a stream for maximum memory efficiency
			body: hasBody ? request.body : undefined,
			// @ts-expect-error - 'duplex' property is required in Node.js when forwarding a request stream
			duplex: hasBody ? 'half' : undefined,
		});

		// Forward backend response headers
		const responseHeaders = new Headers(response.headers);

		// Since Node's fetch already decompressed the body, forwarding these headers
		// will confuse the client browser, causing ERR_CONTENT_DECODING_FAILED.
		responseHeaders.delete('content-encoding');
		responseHeaders.delete('content-length');

		// Set no-store cache for authenticated API requests to prevent stale data
		if (accessToken) {
			responseHeaders.set('cache-control', 'no-store');
		}

		// If backend returns 401, forward the backend's error response for client-side distinction
		// between expired access token, invalid refresh token, missing auth, etc.
		if (response.status === 401) {
			const errorData = await response.json().catch(() => ({ message: 'Unauthorized', code: 'UNAUTHORIZED' }));
			return NextResponse.json(errorData, { status: 401, headers: responseHeaders });
		}

		// Directly stream the backend response body back to the client
		return new NextResponse(response.body, {
			status: response.status,
			headers: responseHeaders,
		});
	} catch (error) {
		console.error('Proxy Error:', error);
		return NextResponse.json({ message: 'Internal Proxy Error' }, { status: 500 });
	}
}

// Support all standard HTTP methods
export { handleProxy as DELETE, handleProxy as GET, handleProxy as PATCH, handleProxy as POST, handleProxy as PUT };
