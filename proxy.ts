// middleware.ts
import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';
import { APP_ROUTES } from './shared/config/app-configs';

// Create intl middleware
const intlMiddleware = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
	// 1. Extract locale and clean the pathname for safe matching
	const pathname = request.nextUrl.pathname;
	const segments = pathname.split('/');

	// Check if the first segment is a supported locale (e.g., 'en' or 'ar')
	const detectedLocale = routing.locales.includes(segments[1] as 'en' | 'ar') ? segments[1] : null;

	// Strip the locale prefix for easy path matching (e.g., /ar/user/profile -> /user/profile)
	const cleanPath = detectedLocale ? `/${segments.slice(2).join('/')}` : pathname;
	const normalizedPath = cleanPath.replace(/\/$/, '') || '/'; // Remove trailing slash, fallback to '/'

	// Target language for redirects
	const targetLocale = detectedLocale || routing.defaultLocale;

	// --- Route Classifications ---
	// Guest-only pages (Should NOT be accessed by logged-in users)
	const guestOnlyPaths = ['/auth/login', '/auth/register'];
	const isGuestOnlyPage = guestOnlyPaths.includes(normalizedPath);

	// Protected pages (Requires authentication)
	// Detection is based on URL path only; cookie-based auth state is verified by the backend/API layer.
	const isProtectedPage =
		normalizedPath.startsWith('/user') ||
		normalizedPath === '/auth/change-password' ||
		normalizedPath === '/auth/change-email';

	// --- Redirection Logic ---

	// Case A: Unauthenticated user trying to access a protected page -> Redirect to Login
	// Note: This middleware cannot read HttpOnly cookies on the server reliably for every request.
	// Auth state is ultimately verified by the backend via the API proxy and ApiClient 401 handling.
	// We only redirect here when there is NO access token cookie present (strong signal of unauthenticated state).
	const accessToken = request.cookies.get('access-token')?.value;

	if (!accessToken && isProtectedPage) {
		const redirectUrl = new URL(`/${targetLocale}${APP_ROUTES.login}`, request.url);
		return NextResponse.redirect(redirectUrl);
	}

	// Case B: Authenticated user trying to access guest-only pages -> Redirect to home
	if (accessToken && isGuestOnlyPage) {
		const redirectUrl = new URL(`/${targetLocale}${APP_ROUTES.home}`, request.url);
		return NextResponse.redirect(redirectUrl);
	}

	// Default path: pass request to the next-intl middleware
	return intlMiddleware(request) as NextResponse;
}

export const config = {
	// Matcher covers all localized and unlocalized page routes, ignoring api and static assets
	matcher: '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|json)).*)',
};
