import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { HabitsProvider } from './store/useHabits'
import { AuthProvider } from './store/auth'
import { SyncProvider } from './store/sync'

const root = document.getElementById('root')!
// drop the static boot shell from the HTML before React takes over
document.getElementById('boot')?.remove()

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
