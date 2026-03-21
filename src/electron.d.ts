// src/electron.d.ts

export interface IElectronAPI {
    selectFolder: (currentPath?: string) => Promise<string | null>;
    getRootPath: () => string;
    getAppVersion: () => Promise<string>;
}

declare global {
    interface Window {
        electronAPI: IElectronAPI;
    }
}

// Это нужно, чтобы TypeScript воспринимал файл как модуль
export { };