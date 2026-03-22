/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

interface IElectronAPI {
  on: (channel: string, listener: (event: any, ...args: any[]) => void) => void;
  off: (channel: string, ...omit: any[]) => void;
  send: (channel: string, ...omit: any[]) => void;
  invoke: (channel: string, ...omit: any[]) => Promise<any>;
  
  // App-specific
  getAppVersion: () => string;
  getDefaultPath: () => Promise<string>;
  selectFolder: (currentPath?: string) => Promise<string | null>;
  processFiles: (filter: any, settings: any) => Promise<void>;
  onLogUpdate: (callback: (log: any) => void) => void;
}

interface Window {
  ipcRenderer: import('electron').IpcRenderer;
  electronAPI: IElectronAPI;
}
