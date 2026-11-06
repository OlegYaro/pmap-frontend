import type { RouteObject } from 'react-router'
import { TerritoriesPreviewPage } from '../features/territories/TerritoriesPreviewPage'
import { RootLayout } from './RootLayout'
import {
  AdminPage,
  LoginPage,
  NotFoundPage,
  TransactionDetailPage,
  TransactionsPage,
} from './pages'

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <TerritoriesPreviewPage /> },
      { path: 'transactions', element: <TransactionsPage /> },
      { path: 'transactions/:id', element: <TransactionDetailPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'admin', element: <AdminPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
