import { NavLink, Outlet } from 'react-router'

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/login', label: 'Login' },
  { to: '/admin', label: 'Admin' },
]

export function RootLayout() {
  return (
    <>
      <header className="app-header">
        <strong>PMAP</strong>
        <nav aria-label="Main">
          {LINKS.map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === '/'}>
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  )
}
