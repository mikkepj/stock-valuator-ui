import { NavLink, Outlet } from 'react-router-dom'
import './Layout.css'

export function Layout() {
  return (
    <div className="layout">
      <header className="header">
        <NavLink to="/" className="header-brand">
          Stock Valuator
        </NavLink>
        <nav className="header-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Watchlist
          </NavLink>
        </nav>
      </header>
      <div className="content">
        <Outlet />
      </div>
    </div>
  )
}
