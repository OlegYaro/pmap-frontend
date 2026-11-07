import type { RouteObject } from 'react-router'
import { RequireAdmin } from '../auth/RequireAdmin'
import { TransactionsPage } from '../features/transactions/TransactionsPage'
import { TransactionDetailPage } from '../features/transactions/TransactionDetailPage'
import { RootLayout } from './RootLayout'
import { AdminPage, AnalyticsPage, NotFoundPage } from './pages'

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <TransactionsPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'transactions/:id', element: <TransactionDetailPage /> },
      {
        path: 'admin',
        element: <RequireAdmin />,
        children: [{ index: true, element: <AdminPage /> }],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
