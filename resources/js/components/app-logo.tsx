import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex size-8 items-center justify-center rounded-full">
                <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-xl">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    CIDSA
                    <br />
                    <p className="text-[9.5px] font-medium">Administrator</p>
                </span>
            </div>
        </>
    );
}
