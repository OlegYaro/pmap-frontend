import { expect, it } from 'vitest'
import { proxyConfig } from './proxy.ts'

const options = proxyConfig('https://api.example.com')['/api']

it('forwards /api to the target and rewrites the Host header', () => {
  expect(options.target).toBe('https://api.example.com')
  expect(options.changeOrigin).toBe(true)
})

it('removes the /api prefix', () => {
  const rewrite = options.rewrite!
  expect(rewrite('/api/territories')).toBe('/territories')
  expect(rewrite('/api/transactions/12?x=1')).toBe('/transactions/12?x=1')
})

it('only strips a leading prefix', () => {
  expect(options.rewrite!('/api/a/api/b')).toBe('/a/api/b')
})
