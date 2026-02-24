import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // תוקן: זה השם הנכון של הספרייה

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // הגדרת המתווך שמעביר בקשות לשרת בפורט 3000
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})