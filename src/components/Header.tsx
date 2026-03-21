import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';
import { Sun, Moon } from 'lucide-react';
import { LanguageSelector } from '../ui/LanguageSelector';
import { useEffect, useState } from 'react';

export const Header = () => {
    const { t } = useTranslation();
    const { theme, toggleTheme } = useTheme();

    const [version, setVersion] = useState('...');

    useEffect(() => {
        const fetchVersion = async () => {
            const v = await window.electronAPI.getAppVersion();
            setVersion(v);
        };
        fetchVersion();
    }, []);

    return (
        <header className="sticky top-0 z-50 w-full bg-slate-50/80 dark:bg-[#0b0f1a]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
            <div className="max-w-[1400px] mx-auto p-4 md:px-8 flex justify-between items-center">
                <div className="flex flex-col">
                    <h1 className="text-xl font-black tracking-tighter text-blue-600 dark:text-blue-500">
                        {t('app_title')}
                    </h1>
                    <span className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-bold">
                        v{version} Stable
                    </span>
                </div>
                <div className="flex gap-4 items-center">
                    <LanguageSelector />
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                        aria-label="Toggle Theme"
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </div>
            </div>
        </header>
    );
};
