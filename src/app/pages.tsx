import { Link, useParams } from 'react-router'

export function TransactionsPage() {
  return <h1>Transactions</h1>
}

export function TransactionDetailPage() {
  const { id } = useParams()
  return (
    <>
      <h1>Transaction</h1>
      <p>
        ID: <code>{id}</code>
      </p>
    </>
  )
}

export function LoginPage() {
  return <h1>Login</h1>
}

export function AdminPage() {
  return <h1>Admin</h1>
}

export function NotFoundPage() {
  return (
    <>
      <h1>Page not found</h1>
      <p>
        <Link to="/">Back to the home page</Link>
      </p>
    </>
  )
}
