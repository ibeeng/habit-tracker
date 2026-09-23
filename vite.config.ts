import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages project site → served under /habit-tracker/
export default defineConfig({
  base: '/habit-tracker/',
  plugins: [react(), tailwindcss()],
})
