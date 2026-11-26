import { UserProfile } from '@/features/profile/types/database';
import { useRouter } from '@/i18n/navigation';
import { APP_ROUTES } from '@/shared/config/app-configs';
import { IResponse } from '@/shared/types/index';
import { apiClient } from '@/shared/utils/apiClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { logoutAction } from '../actions';
import { useAuthContext } from '../context/auth-context';

export function useAuth() {
	const queryClient = useQueryClient();
	const router = useRouter();
	const redirectRef = useRef(false);
	const { setAccessToken } = useAuthContext();

	// Register callback for successful token refresh to update Socket.IO token
	useEffect(() => {
		apiClient.setOnRefreshSuccess((newAccessToken) => {
			setAccessToken(newAccessToken);
		});
	}, [setAccessToken]);

	const { data: user, isLoading } = useQuery({
		queryKey: ['authUser', 'profile'],
		queryFn: async () => {
			const response = await apiClient.get<IResponse<UserProfile>>('/users/profile');
			return response.data as UserProfile;
		},
		meta: { showErrorToast: false },
		staleTime: 1000 * 60 * 15, // 15 minutes of fresh data state
		gcTime: 1000 * 60 * 60, // 1 hour garbage collection
		retry: false, // Avoid hammering auth endpoints on 401s
	});

	// logout mutation function
	const logoutMutation = useMutation({
		mutationFn: async (fromAll: boolean = false) => {
			return await logoutAction(fromAll);
		},
		onSuccess: (res) => {
			if (res.success) {
				// Clear access token from memory
				setAccessToken(null);
				// Target specific user data instead of aggressive clear to preserve public view caches
				queryClient.setQueryData(['authUser', 'profile'], null);
				// Clear cached posts so authenticated content does not leak to guest views
				queryClient.invalidateQueries({ queryKey: ['posts'] });
				// ✨ redirect to login page immediately
				router.push(APP_ROUTES.login);

				// ✨ refresh to update server components (Server Components) to feel the cookie deletion
				router.refresh();
			}
		},
	});

	useEffect(() => {
		const handleLogout = (event: CustomEvent) => {
			if (redirectRef.current) return;

			console.log('Session expired event received. Client auth state synchronized.', event.detail);
			// Clear access token from memory
			setAccessToken(null);
			queryClient.setQueryData(['authUser', 'profile'], null);

			const pathName = window.location.pathname;
			const segments = pathName.split('/').filter(Boolean);
			const isAuthRoute = segments[1] === 'auth';
			if (isAuthRoute) return;

			redirectRef.current = true;
			const callbackUrl = encodeURIComponent(pathName);
			router.push(`${APP_ROUTES.login}?error=session_expired&callbackUrl=${callbackUrl}`);
			router.refresh();
		};

		window.addEventListener('auth:session-expired', handleLogout as EventListener);
		return () => window.removeEventListener('auth:session-expired', handleLogout as EventListener);
	}, [router, queryClient, setAccessToken]);

	useEffect(() => {
		const handleUnverified = () => {
			queryClient.setQueryData(['authUser', 'profile'], null);

			const pathName = window.location.pathname;
			const segments = pathName.split('/').filter(Boolean);
			const isAuthRoute = segments[1] === 'auth';
			if (isAuthRoute) return;

			router.push(APP_ROUTES.verifyAccount);
			router.refresh();
		};

		window.addEventListener('auth:unverified', handleUnverified as EventListener);
		return () => window.removeEventListener('auth:unverified', handleUnverified as EventListener);
	}, [router, queryClient]);

	return {
		user,
		isLoading,
		isAuthed: !!user,

		logout: logoutMutation.mutate,
		isLoggingOut: logoutMutation.isPending,
	};
}
