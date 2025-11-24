import { QueryClient } from '@tanstack/react-query';

// Create a client with optimized defaults for fast loading
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Data stays fresh for 5 minutes
            staleTime: 5 * 60 * 1000,
            // Cache data for 10 minutes
            gcTime: 10 * 60 * 1000,
            // Don't refetch on window focus by default (faster)
            refetchOnWindowFocus: false,
            // Refetch on reconnect
            refetchOnReconnect: true,
            // Retry failed requests once
            retry: 1,
            // No automatic background refetching (user can manually refresh)
            refetchInterval: false,
        },
    },
});
