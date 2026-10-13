import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { HabitsProvider } from './store/useHabits'
import { AuthProvider } from './store/auth'
import { SyncProvider } from './store/sync'
import { initOta } from './lib/ota'

const root = document.getElementById('root')!
// drop the static boot shell from the HTML before React takes over
document.getElementById('boot')?.remove()

// OTA: tell the native updater this bundle boots fine, as early as possible —
// a missed notifyAppReady() makes the plugin roll back to the previous bundle.
// The update check itself runs in the background and applies on next launch.
if (import.meta.env.VITE_NATIVE === '1') {
  void initOta()
}

createRoot(root).render(
  <StrictMode>
    <AuthProvider>
      <HabitsProvider>
        <SyncProvider>
          <App />
        </SyncProvider>
      </HabitsProvider>
    </AuthProvider>
  </StrictMode>,
)

// offline shell — web only. the Android build ships the files inside the APK,
// so a service worker there would only serve stale bundles after an update.
if (import.meta.env.VITE_NATIVE !== '1' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.warn('SW register failed', err)
    })
  })
}
