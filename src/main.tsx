import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { HabitsProvider } from './store/useHabits'
import { AuthProvider } from './store/auth'
import { SyncProvider } from './store/sync'

createRoot(document.getElementById('root')!).render(
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
