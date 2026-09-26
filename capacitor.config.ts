import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.waalid.rootine',
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
