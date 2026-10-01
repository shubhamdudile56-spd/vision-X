import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  Camera,
  History,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Upload,
  User as UserIcon,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useEngine } from '../context/EngineContext.jsx';
import { cx } from '../utils/format.js';

const NAV_LINKS = [
  { to: '/live', label: 'Live Vision', icon: Camera },
  { to: '/upload', label: 'Analyze', icon: Upload },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, protected: true },
  { to: '/history', label: 'History', icon: History }
];

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { engineConfigured, loading: engineLoading, keyHint } = useEngine();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const links = NAV_LINKS.filter((link) => !link.protected || isAuthenticated);

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    if (location.pathname === '/dashboard') navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="group flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="relative grid h-9 w-9 place-items-center rounded-xl border border-vision-400/40 bg-vision-500/10">
            <Activity className="h-4.5 w-4.5 text-vision-400" aria-hidden="true" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-extrabold tracking-tight text-white">VisionX</span>
            <span className="block text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
              Smart Visual Experience
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cx(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-vision-500/15 text-vision-300 ring-1 ring-vision-400/30'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                )
              }
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            onClick={() => navigate('/upload')}
            className={cx(
              'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition',
              engineLoading
                ? 'border-white/10 bg-white/5 text-slate-500'
                : engineConfigured
                  ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400/60'
                  : 'border-amber-400/40 bg-amber-400/10 text-amber-300 hover:border-amber-400/70'
            )}
            title={
              engineConfigured
                ? `Gemini engine online${keyHint ? ` (${keyHint})` : ''}`
                : 'Gemini engine offline — click to add an API key'
            }
          >
            <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
            {engineLoading ? 'Engine…' : engineConfigured ? 'AI online' : 'Add API key'}
          </button>

          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
                <UserIcon className="h-4 w-4 text-vision-400" aria-hidden="true" />
                <span className="text-xs font-semibold text-slate-200">{user?.full_name}</span>
                <span className="chip ml-1 !px-2 !py-0.5">{user?.role}</span>
              </div>
              <button type="button" onClick={handleLogout} className="btn-ghost !px-3 !py-1.5">
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </button>
            </>
          ) : (
            <Link to="/auth" className="btn-primary !py-1.5">
              Sign in
            </Link>
          )}
        </div>

        <button
          type="button"
          className="btn-ghost !px-2.5 md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label="Toggle navigation menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-ink-950/95 px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cx(
                    'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium',
                    isActive ? 'bg-vision-500/15 text-vision-300' : 'text-slate-300 hover:bg-white/5'
                  )
                }
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
            <div className="mt-2 border-t border-white/10 pt-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate('/upload');
                }}
                className={cx(
                  'mb-2 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition',
                  engineConfigured
                    ? 'text-emerald-300 hover:bg-emerald-500/10'
                    : 'bg-amber-400/15 text-amber-200 hover:bg-amber-400/25'
                )}
              >
                <KeyRound className="h-4 w-4" aria-hidden="true" />
                {engineLoading
                  ? 'Checking engine…'
                  : engineConfigured
                    ? `Gemini AI online${keyHint ? ` · ${keyHint}` : ''}`
                    : 'Add Gemini API key'}
              </button>

              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-300 hover:bg-red-500/10"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sign out {user?.full_name}
                </button>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setOpen(false)}
                  className="block rounded-lg bg-vision-500 px-3 py-2.5 text-center text-sm font-semibold text-ink-950"
                >
                  Sign in / Register
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
