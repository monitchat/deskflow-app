import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Nota: O proxy abaixo é mantido como fallback para desenvolvimento local.
    // A aplicação agora usa VITE_API_BASE_URL do .env para configurar a URL da API,
    // o que funciona tanto em desenvolvimento quanto em produção.
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../public',
    emptyOutDir: true,
  },
})
