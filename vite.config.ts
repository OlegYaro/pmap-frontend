import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import { proxyConfig } from './config/proxy.ts'

export default defineConfig(({ command, mode }) => {
  const target = loadEnv(mode, process.cwd(), 'VITE_').VITE_API_TARGET
  if (!target && command === 'serve') {
    console.warn('VITE_API_TARGET is not set: /api is not proxied. See .env.example.')
  }
  return {
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: { proxy: target ? proxyConfig(target) : undefined },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
    },
  }
})
