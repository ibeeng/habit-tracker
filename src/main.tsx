import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { HabitsProvider } from './store/useHabits'
import { AuthProvider } from './store/auth'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <HabitsProvider>
        <App />
      </HabitsProvider>
    </AuthProvider>
  </StrictMode>,
)
