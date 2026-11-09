import { QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { createQueryClient } from './app/queryClient'
import { routes } from './app/routes'
import { AuthProvider } from './auth/AuthProvider'
import { ThemeProvider } from './components/theme/ThemeProvider'
import { Toaster } from './components/ui/sonner'

const router = createBrowserRouter(routes)

export default function App() {
  const [queryClient] = useState(() => createQueryClient())
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
