import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // האתר ב-GitHub Pages נמצא בכתובת /miluim-market/ ולא בשורש הדומיין,
  // אז Vite צריך לדעת להוסיף את הקידומת לכל הקבצים
  base: '/miluim-market/',
})
