import { useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface UsePrintCountdownOptions {
    /** Countdown length in seconds. Defaults to 5. */
    seconds?: number;
}

/**
 * Shows a sonner toast with a Cancel button whose message updates every
 * second to reflect the seconds remaining. Unless cancelled, `onComplete`
 * fires once the countdown reaches 0. Nothing (no window, no print job) is
 * created until then — this deliberately does NOT open a window up front.
 * Note: because window.open() ends up firing outside the original click's
 * user-gesture window, most browsers' popup blockers will block it unless
 * the user has allowed popups for this site.
 */
export function usePrintCountdown({
    seconds = 5,
}: UsePrintCountdownOptions = {}) {
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const toastIdRef = useRef<string | number | null>(null);

    const clear = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (toastIdRef.current !== null) {
            toast.dismiss(toastIdRef.current);
            toastIdRef.current = null;
        }
    };

    /** Clears any pending countdown without running onComplete. */
    const cancel = useCallback(() => {
        clear();
    }, []);

    /**
     * Starts the countdown. `getMessage(secondsLeft)` formats the toast text
     * for each tick (called immediately, then once per second). onComplete
     * fires once, when secondsLeft reaches 0, unless cancelled first.
     */
    const start = useCallback(
        (
            getMessage: (secondsLeft: number) => string,
            onComplete: () => void | Promise<void>,
        ) => {
            clear();

            let secondsLeft = seconds;

            const render = () =>
                toast(getMessage(secondsLeft), {
                    id: toastIdRef.current ?? undefined,
                    // We manage the countdown ourselves, so keep the toast
                    // open until we explicitly dismiss it.
                    duration: Infinity,
                    cancel: {
                        label: 'Cancel',
                        onClick: () => clear(),
                    },
                });

            toastIdRef.current = render();

            intervalRef.current = setInterval(() => {
                secondsLeft -= 1;

                if (secondsLeft <= 0) {
                    clear();
                    void onComplete();
                    return;
                }

                render();
            }, 1000);
        },
        [seconds],
    );

    return { start, cancel };
}
