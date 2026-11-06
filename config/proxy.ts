import type { ProxyOptions } from 'vite'

/** Dev-server proxy for the backend: `/api/x` on the page becomes `/x` on `target`. */
export function proxyConfig(target: string): Record<string, ProxyOptions> {
  return {
    '/api': {
      target,
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
    },
  }
}
