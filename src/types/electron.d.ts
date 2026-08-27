export interface ElectronPlatformInfo {
  platform: string;
  arch: string;
  node: string;
  electron: string;
  chrome: string;
}

export interface ElectronAPI {
  isElectron: boolean;
  getVersion: () => Promise<string>;
  getPlatformInfo: () => Promise<ElectronPlatformInfo>;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  isMaximized: () => Promise<boolean>;
  onMaximizedChange: (callback: (isMaximized: boolean) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
