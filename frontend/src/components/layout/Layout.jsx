// The app frame: dark sidebar (guidelines: 250 px, #1e293b), white header, page content.
// On phones the sidebar hides behind a menu button.
import { Suspense, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { BarChart3, ClipboardList, GitCompare, LogOut, Menu, Users, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PageSkeleton } from '../common/States';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { to: '/players', label: 'Players', icon: Users },
  { to: '/compare', label: 'Compare', icon: GitCompare },
  { to: '/reports', label: 'Scouting reports', icon: ClipboardList },
];

function Logo() {
  return (
    <div className="flex items-center gap-3 px-2">
      <img src="/favicon.svg" alt="" className="size-8" />
      <div>
        <p className="text-sm font-bold tracking-wide text-white">ASE ATHLETICS</p>
        <p className="text-xs text-secondary-400">Scouting platform</p>
      </div>
    </div>
  );
}

export default function Layout() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const nav = (
    <nav aria-label="Main" className="mt-8 flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={() => setMenuOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors ${
              isActive ? 'bg-primary-700 text-white' : 'text-secondary-300 hover:bg-secondary-700 hover:text-white'
            }`
          }
        >
          <Icon className="size-5" aria-hidden />
          {label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen lg:pl-[250px] print:pl-0">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-[250px] flex-col bg-secondary-800 p-4 lg:flex print:hidden">
        <Logo />
        {nav}
      </aside>

      {/* Mobile sidebar (slides in) */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-secondary-900/50"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="relative flex h-full w-[250px] flex-col bg-secondary-800 p-4">
            <div className="flex items-center justify-between">
              <Logo />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="p-2 text-secondary-300"
              >
                <X className="size-5" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      {/* Header (guidelines: 64 px, white, bottom border) */}
      <header className="sticky top-0 z-30 flex h-16 print:hidden items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-8">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="-ml-2 rounded-md p-2 text-secondary-700 hover:bg-secondary-100 lg:hidden"
        >
          <Menu className="size-6" />
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-secondary-900">{user?.name}</p>
            <p className="text-xs text-secondary-500">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-secondary-600 hover:bg-secondary-100"
          >
            <LogOut className="size-4" aria-hidden /> Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 py-6 lg:px-8 lg:py-8">
        {/* While a page's code is downloading, show a spinner inside the layout (sidebar stays put) */}
        <Suspense fallback={<PageSkeleton />}>
          {/* A quick fade each time you open a different page */}
          <div key={pathname} className="motion-safe:animate-fade-in">
            <Outlet />
          </div>
        </Suspense>
      </main>
    </div>
  );
}
