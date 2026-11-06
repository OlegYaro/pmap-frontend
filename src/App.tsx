import { QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { createQueryClient } from './app/queryClient'
import { routes } from './app/routes'

const router = createBrowserRouter(routes)

export default function App() {
  const [queryClient] = useState(() => createQueryClient())
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
