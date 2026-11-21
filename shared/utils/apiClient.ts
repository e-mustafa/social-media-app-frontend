import { IResponse } from '../types/index';
import { ApiError } from './app-error';

interface RequestOptions extends RequestInit {
	headers?: Record<string, string>;
	/**
	 * Whether this request is to a public endpoint (no auth required).
	 * Public endpoints will NOT trigger token refresh on 401.
	 * Default: false (treated as protected).
	 */
	isPublic?: boolean;
	/**
	 * Locale to send in Accept-Language header.
	 * If not provided, it is resolved from the current environment.
	 */
	locale?: string;
}

type FetchInit = Omit<RequestInit, 'body'> & {
	body?: BodyInit | null;
};

/**
 * Public endpoint paths that do not require authentication.
 * These endpoints will never trigger token refresh on 401 responses.
 */
const PUBLIC_ENDPOINTS = [
	'/auth/register',
	'/auth/login',
	'/auth/check-username',
	'/auth/verify-account',
	'/auth/verify-account/resend-otp',
	'/auth/forgot-password',
	'/auth/reset-password',
	'/auth/social-login/google',
	'/auth/reactivate',
];

/**
 * Checks whether a given endpoint path is a public (unauthenticated) endpoint.
 */
function isPublicEndpoint(endpoint: string): boolean {
	return PUBLIC_ENDPOINTS.some((pub) => endpoint.startsWith(pub));
}

/**
 * ApiClient class for making API requests with automatic refresh token handling and error management.
 * Uses native fetch exclusively.
 */
class ApiClient {
	private baseUrl: string = '/api/proxy';

	// Thread-safe locking mechanism for concurrent refresh requests
	private isRefreshing = false;
	private refreshPromise: Promise<boolean> | null = null;

	/**
	 * Resolves the client locale for Accept-Language header.
	 * Works both on server (no window) and client (window available).
	 */
	private getClientLocale(providedLocale?: string): string {
		if (providedLocale) {
			return providedLocale;
		}
		if (typeof window !== 'undefined') {
			const segments = window.location.pathname.split('/');
			const first = segments[1];
			if (first === 'ar' || first === 'en') {
				return first;
			}
			return 'en';
		}
		return 'en';
	}

	/**
	 * Core request method with automatic token refresh, locale header, and error handling.
	 */
	private async request<TResponse>(endpoint: string, options: RequestOptions = {}): Promise<TResponse> {
		const isPublic = options.isPublic ?? isPublicEndpoint(endpoint);
		const url = `${this.baseUrl}${endpoint}`;
		const isFormData = options.body instanceof FormData;

		// Build headers without mutating caller's object
		const headers: Record<string, string> = { ...options.headers };

		// Set Content-Type only for non-FormData requests when not already set
		if (!isFormData && !headers['Content-Type']) {
			headers['Content-Type'] = 'application/json';
		}

		// Always send Accept-Language for locale-aware responses
		const locale = this.getClientLocale(options.locale);
		headers['Accept-Language'] = locale;

		let response: Response;

		try {
			response = await fetch(url, {
				...options,
				headers,
				// Always include cookies for same-origin proxy requests (HttpOnly tokens)
				credentials: 'include',
				// Avoid caching for authenticated requests
				cache: 'no-store',
			} as FetchInit);
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') {
				throw new ApiError('Request was cancelled', 0);
			}
			throw new ApiError('Network error, please check your internet connection', 0);
		}

		// --- 401 Handling: Token Refresh for Protected Endpoints Only ---
		if (response.status === 401 && !isPublic) {
			// Never refresh when the refresh endpoint itself returns 401
			if (endpoint.includes('/auth/refresh')) {
				this.handleSessionExpired();
				throw new ApiError('SESSION_EXPIRED', 401);
			}

			// Safeguard parallel requests: queue behind a single shared refresh promise
			if (!this.isRefreshing) {
				this.isRefreshing = true;
				this.refreshPromise = (async () => {
					try {
						const refreshRes = await fetch('/api/auth/refresh', {
							method: 'POST',
							credentials: 'include',
							cache: 'no-store',
						});
						return refreshRes.ok;
					} catch {
						return false;
					} finally {
						this.isRefreshing = false;
						this.refreshPromise = null;
					}
				})();
			}

			const isRefreshed = await this.refreshPromise;

			if (isRefreshed) {
				// Retry original request once with updated cookie state
				// Preserve original body (including FormData) by reconstructing options
				const retryOptions: FetchInit = {
					...options,
					headers,
					credentials: 'include',
					cache: 'no-store',
				};

				// For non-GET requests with FormData body, we cannot re-read a consumed stream.
				// FormData can be reused, but a consumed Request body cannot.
				// Since we pass the original body reference, FormData is still usable.
				response = await fetch(url, retryOptions);
			} else {
				this.handleSessionExpired();
				throw new ApiError('SESSION_EXPIRED', 401);
			}
		}

		// --- Error Handling (JSON or Plain Text) ---
		if (!response.ok) {
			let message = '';
			let errorData: IResponse = { success: false };
			const contentType = response.headers.get('content-type');

			if (contentType && contentType.includes('application/json')) {
				errorData = (await response.json().catch(() => ({}))) as IResponse;
				message = errorData.message || '';
			} else {
				message = await response.text().catch(() => '');
			}

			if (response.status === 429) {
				message = message || errorData.message || 'Too Many Requests, Please try again later.';
			}

			throw new ApiError(message || `Error: ${response.status}`, response.status, errorData.errors);
		}

		// --- Handle Empty Responses (e.g., 204 No Content) ---
		if (response.status === 204 || response.status === 205) {
			return { success: true } as unknown as TResponse;
		}

		// Parse JSON body for successful responses
		const contentType = response.headers.get('content-type');
		if (contentType && contentType.includes('application/json')) {
			return (await response.json()) as TResponse;
		}

		// Non-JSON success response (e.g., plain text)
		const text = await response.text().catch(() => '');
		return (text || { success: true }) as unknown as TResponse;
	}

	/**
	 * Helper method to sync client auth states on session expiration.
	 * Notifies listeners via the auth:session-expired custom event.
	 * Redirect responsibility belongs solely to the useAuth event listener,
	 * which owns protected-route detection and login redirection.
	 * This prevents competing redirects and avoids redirecting on public pages.
	 */
	private handleSessionExpired(): void {
		if (typeof window !== 'undefined') {
			// Notify Context/State Providers to globally clean user auth status
			window.dispatchEvent(new CustomEvent('auth:session-expired'));
			// const locale = this.getClientLocale();
			// // Only redirect if within protected administrative routes
			// if (window.location.pathname.includes('/user/')) {
			// 	window.location.href = `/${locale}${APP_ROUTES.login}`;
			// }
		}
	}

	async get<TResponse>(endpoint: string, options?: RequestOptions): Promise<TResponse> {
		return this.request<TResponse>(endpoint, { method: 'GET', ...options });
	}

	async post<TResponse, TBody = unknown>(endpoint: string, body: TBody, options?: RequestOptions): Promise<TResponse> {
		const isFormData = body instanceof FormData;
		return this.request<TResponse>(endpoint, {
			method: 'POST',
			body: isFormData ? (body as FormData) : JSON.stringify(body),
			...options,
		});
	}

	async patch<TResponse, TBody = unknown>(endpoint: string, body: TBody, options?: RequestOptions): Promise<TResponse> {
		const isFormData = body instanceof FormData;
		return this.request<TResponse>(endpoint, {
			method: 'PATCH',
			body: isFormData ? (body as FormData) : JSON.stringify(body),
			...options,
		});
	}

	async put<TResponse, TBody = unknown>(endpoint: string, body: TBody, options?: RequestOptions): Promise<TResponse> {
		const isFormData = body instanceof FormData;
		return this.request<TResponse>(endpoint, {
			method: 'PUT',
			body: isFormData ? (body as FormData) : JSON.stringify(body),
			...options,
		});
	}

	async delete<TResponse, TBody = unknown>(endpoint: string, body?: TBody, options?: RequestOptions): Promise<TResponse> {
		const isFormData = body instanceof FormData;
		return this.request<TResponse>(endpoint, {
			method: 'DELETE',
			body: body ? (isFormData ? (body as FormData) : JSON.stringify(body)) : undefined,
			...options,
		});
	}
}

export const apiClient = new ApiClient();
