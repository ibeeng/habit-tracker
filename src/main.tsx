import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { HabitsProvider } from './store/useHabits'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HabitsProvider>
      <App />
    </HabitsProvider>
  </StrictMode>,
)
