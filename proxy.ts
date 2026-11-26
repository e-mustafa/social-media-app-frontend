// middleware.ts
import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';
import { APP_ROUTES } from './shared/config/app-configs';
import { configEnv } from './shared/config/env';

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
	const isProtectedPage =
		normalizedPath.startsWith('/user') ||
		normalizedPath === '/auth/change-password' ||
		normalizedPath === '/auth/change-email';

	// --- Authentication State Detection ---
	// Check for access token (short-lived, 15 min)
	const accessToken = request.cookies.get(configEnv.tokens.keys.accessToken)?.value;
	// Check for refresh token (long-lived, 7-14 days) as fallback for session restoration
	const refreshToken = request.cookies.get(configEnv.tokens.keys.refreshToken)?.value;

	const hasValidSession = !!accessToken || !!refreshToken;

	// --- Redirection Logic ---

	// Case A: Unauthenticated user trying to access a protected page -> Redirect to Login
	// If neither access nor refresh token exists, user is definitely unauthenticated.
	// If refresh token exists but access token is expired/missing, allow through -
	// the API proxy and client will handle token refresh.
	if (!hasValidSession && isProtectedPage) {
		const redirectUrl = new URL(`/${targetLocale}${APP_ROUTES.login}`, request.url);
		return NextResponse.redirect(redirectUrl);
	}

	// Case B: Authenticated user trying to access guest-only pages -> Redirect to home
	// Only redirect if access token is present (strong signal of active session).
	// If only refresh token exists, user might have expired access token - don't redirect,
	// let the page load and client-side handle session restoration.
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
