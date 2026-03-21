import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

interface LocaleFile {
    default: {
        nativeName: string;
        [key: string]: string;
    };
}

const locales = import.meta.glob<LocaleFile>('./locales/*.json', { eager: true });

const resources = Object.keys(locales).reduce((acc, filePath) => {

    const langKey = filePath.split('/').pop()?.replace('.json', '');

    if (langKey) {
        acc[langKey] = {
            translation: locales[filePath].default,
            nativeName: locales[filePath].default.nativeName
        };
    }
    return acc;
}, {} as any);

export const languageResources = resources;

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: localStorage.getItem('lang') || 'en',
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;