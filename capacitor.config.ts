import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.ibedes.rootine',
  appName: 'Rootine',
  webDir: 'dist',
  // assets are loaded from the local web root → build with APP_BASE=./ (see npm run build:android)
  android: {
    allowMixedContent: false,
    backgroundColor: '#0a0f0a',
  },
  server: {
    androidScheme: 'https',
  },
  plugins: {
    // Live updates, self-hosted and **manual** (see src/lib/ota.ts).
    // The APK ships a web bundle; this endpoint tells the app when a newer one
    // exists, but nothing is downloaded until the user taps "update" in
    // Settings — `autoUpdate: false` keeps the swap user-triggered.
    // `version` pins the version of the bundle baked into this APK, so the
    // server can tell whether the published one is actually newer.
    CapacitorUpdater: {
      updateUrl: 'https://telba.xyz/rootine-ota/updates',
      version: '1.2.1',
      autoUpdate: false,
      // no third-party telemetry — updates are private
      statsUrl: '',
    },
    // terminal app is always dark → white system bar icons
    // insetsHandling 'native' pads the webview natively, so the app never sits under
    // the phone's status/gesture bar. With the default ('css') newer WebViews (140+)
    // switch to edge-to-edge and the layout has to compensate in CSS for every device.
    SystemBars: {
      style: 'DARK',
      insetsHandling: 'native',
    },
  },
}

export default config
