import { Button } from '@/components/ui/button';
import { CircleCheck } from 'lucide-react';

export default function Success() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-white transition-colors md:bg-green-50 dark:bg-gray-800 md:dark:bg-black">
            <div className="flex max-w-xl flex-col items-center gap-5 rounded-lg bg-white p-6 transition-colors md:border-t-8 md:border-[var(--main-color)] md:shadow-lg dark:border-green-500 dark:bg-gray-800">
                <CircleCheck
                    className="text-[var(--main-color)] dark:text-green-500"
                    size={80}
                />

                <h1 className="text-center text-2xl font-medium text-[var(--main-color)] md:text-3xl dark:text-green-500">
                    Your submission was successful!
                </h1>

                <p className="text-[var(--text-color) text-center dark:text-[var(--text-color-dark)]">
                    Thank you for submitting your information. Your student
                    details have been successfully recorded in the{' '}
                    <b className="text-green-500">CIDSA</b> system and will be
                    reviewed accordingly. Please keep this confirmation for your
                    reference.
                </p>

                <Button asChild>
                    <a href="/">Back to Home</a>
                </Button>
            </div>
        </div>
    );
}
