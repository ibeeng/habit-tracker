/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID?: string
  /** '1' on the Capacitor/Android build — disables the service worker */
  readonly VITE_NATIVE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/** injected by vite `define` from package.json (see vite.config.ts) */
declare const __APP_VERSION__: string
