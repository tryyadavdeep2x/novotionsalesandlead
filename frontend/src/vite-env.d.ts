/// <reference types="vite/client" />

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}

export interface UpdateStatusData {
  stage: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
  version?: string;
  percent?: number;
  bytesPerSecond?: number;
  transferred?: number;
  total?: number;
  error?: string;
  releaseNotes?: string;
  releaseDate?: string;
}

export interface ElectronAPI {
  platform: string;
  version: string;
  getServerConfig: () => Promise<{ url: string }>;
  saveServerConfig: (config: { url: string }) => Promise<{ ok: boolean; error?: string }>;
  testServerConnection: (url?: string) => Promise<{ ok: boolean; status?: number; error?: string }>;
  getAppVersion: () => Promise<string>;
  checkForUpdates: () => Promise<{ ok: boolean; versionInfo?: any; message?: string; error?: string }>;
  restartAndInstallUpdate: () => void;
  onUpdateStatus: (callback: (status: UpdateStatusData) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
