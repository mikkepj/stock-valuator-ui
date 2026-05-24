import { NavLink, Outlet } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

export function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-4 px-6 h-14 border-b border-border bg-background/80 backdrop-blur-sm">
        <NavLink to="/" className="flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors">
          <TrendingUp size={20} className="text-primary" />
          <span>Stock Valuator</span>
        </NavLink>

        <nav className="flex items-center gap-1 ml-4">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive
                ? 'text-sm font-medium text-foreground px-3 py-1.5 rounded-md bg-accent'
                : 'text-sm text-muted-foreground px-3 py-1.5 rounded-md hover:bg-accent hover:text-foreground transition-colors'
            }
          >
            Watchlist
          </NavLink>
        </nav>

        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}
