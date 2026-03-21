import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages, Check, ChevronDown } from 'lucide-react';
import { languageResources } from '../i18n';

export const LanguageSelector = () => {
    const { t, i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const availableLanguages = Object.keys(languageResources);

    useEffect(() => {
        const closeMenu = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', closeMenu);
        return () => document.removeEventListener('mousedown', closeMenu);
    }, []);

    const handleLanguageChange = (lng: string) => {
        i18n.changeLanguage(lng);
        localStorage.setItem('lang', lng);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 outline-none"
            >
                <Languages size={18} className="text-blue-500" />
                <span className="text-sm font-bold uppercase">{i18n.language}</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 py-2 rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 z-50 animate-in fade-in zoom-in duration-150">
                    {availableLanguages.map((lng) => (
                        <button
                            key={lng}
                            onClick={() => handleLanguageChange(lng)}
                            className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                        >
                            <span className={i18n.language === lng ? 'font-bold text-blue-500' : 'text-slate-600 dark:text-slate-300'}>
                                {t('nativeName', { lng })}
                            </span>
                            {i18n.language === lng && <Check size={14} className="text-blue-500" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
