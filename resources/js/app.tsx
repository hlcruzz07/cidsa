import '../css/app.css';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from './components/ui/sonner';
import { initializeTheme } from './hooks/use-appearance';

const appName = import.meta.env.VITE_APP_NAME || 'CIDSA';

// Shape of the shared `auth` prop Laravel/Inertia sends on every page
// (via HandleInertiaRequests or similar). Adjust the `user` type if you
// have a proper User interface elsewhere in the app.
interface AuthPageProps {
    auth?: {
        user?: unknown | null;
    };
}

function AppToaster({
    initialIsAuthenticated,
}: {
    initialIsAuthenticated: boolean;
}) {
    const [isAuthenticated, setIsAuthenticated] = useState(
        initialIsAuthenticated,
    );

    useEffect(() => {
        return router.on('navigate', (event) => {
            const authUser = (event.detail.page.props as AuthPageProps)?.auth
                ?.user;
            setIsAuthenticated(Boolean(authUser));
        });
    }, []);

    return (
        <Toaster
            richColors
            closeButton
            position={isAuthenticated ? 'bottom-right' : 'top-center'}
        />
    );
}

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        const initialAuthUser = (props.initialPage.props as AuthPageProps)?.auth
            ?.user;

        root.render(
            <>
                <AppToaster initialIsAuthenticated={Boolean(initialAuthUser)} />
                <App {...props} />
            </>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
