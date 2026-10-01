import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, ShieldCheck, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import ErrorBanner, { Spinner } from '../components/ErrorBanner.jsx';
import { fieldErrors } from '../utils/api.js';
import { loginSchema, registerSchema, toFieldErrors } from '../utils/validation.js';
import { cx } from '../utils/format.js';

const TABS = [
  { key: 'login', label: 'Sign in', icon: LogIn },
  { key: 'register', label: 'Create account', icon: UserPlus }
];

export default function Auth() {
  const { login, register, isAuthenticated, checking } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/dashboard';

  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', full_name: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setErrors({});
    setServerError(null);
  }, [tab]);

  const isRegister = tab === 'register';

  const fieldError = useMemo(
    () => (name) => errors[name] || null,
    [errors]
  );

  if (!checking && isAuthenticated) return <Navigate to={redirectTo} replace />;

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError(null);

    const payload = isRegister
      ? { email: form.email, password: form.password, full_name: form.full_name }
      : { email: form.email, password: form.password };

    // Client-side Zod pass first for instant feedback.
    const schema = isRegister ? registerSchema : loginSchema;
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error));
      return;
    }
    if (isRegister && form.password !== form.confirm) {
      setErrors({ confirm: 'Passwords do not match' });
      return;
    }

    setSubmitting(true);
    try {
      if (isRegister) {
        await register(parsed.data);
      } else {
        await login(parsed.data);
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setServerError(err);
      setErrors(fieldErrors(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center px-4 py-14 sm:px-6 lg:px-8">
      <div className="grid w-full gap-10 lg:grid-cols-[1fr_0.85fr] lg:items-center">
        <div className="hidden lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-vision-400">
            Inspector access
          </p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight text-white">
            Keep every scan,
            <br />
            every severity, every action.
          </h1>
          <p className="mt-4 max-w-md text-slate-400">
            An account moves scan history out of this browser and into PostgreSQL, unlocks the
            analytics dashboard, and gives you a searchable audit trail with JSON re-export.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-slate-400">
            {[
              'History persisted per tenant — never cross-account',
              'httpOnly session cookies, bcrypt cost factor 12',
              'Admins see the whole fleet; inspectors see their own scans'
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-vision-400" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="glass rounded-3xl p-6 sm:p-8">
          <div
            className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-ink-950/60 p-1"
            role="tablist"
            aria-label="Authentication mode"
          >
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={cx(
                  'flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition',
                  tab === key ? 'bg-vision-500 text-ink-950' : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            {serverError && <ErrorBanner error={serverError} onDismiss={() => setServerError(null)} />}

            {isRegister && (
              <div>
                <label className="label" htmlFor="full_name">
                  Full name
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  autoComplete="name"
                  className="field"
                  placeholder="Ada Inspector"
                  value={form.full_name}
                  onChange={update('full_name')}
                  aria-invalid={Boolean(fieldError('full_name'))}
                />
                {fieldError('full_name') && (
                  <p className="mt-1.5 text-xs text-red-400">{fieldError('full_name')}</p>
                )}
              </div>
            )}

            <div>
              <label className="label" htmlFor="email">
                Work email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className="field"
                placeholder="you@company.com"
                value={form.email}
                onChange={update('email')}
                aria-invalid={Boolean(fieldError('email'))}
              />
              {fieldError('email') && <p className="mt-1.5 text-xs text-red-400">{fieldError('email')}</p>}
            </div>

            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                className="field"
                placeholder={isRegister ? 'At least 8 characters with a number' : '••••••••'}
                value={form.password}
                onChange={update('password')}
                aria-invalid={Boolean(fieldError('password'))}
              />
              {fieldError('password') ? (
                <p className="mt-1.5 text-xs text-red-400">{fieldError('password')}</p>
              ) : (
                isRegister && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    Minimum 8 characters, including at least one letter and one number.
                  </p>
                )
              )}
            </div>

            {isRegister && (
              <div>
                <label className="label" htmlFor="confirm">
                  Confirm password
                </label>
                <input
                  id="confirm"
                  name="confirm"
                  type="password"
                  autoComplete="new-password"
                  className="field"
                  placeholder="Re-enter your password"
                  value={form.confirm}
                  onChange={update('confirm')}
                  aria-invalid={Boolean(fieldError('confirm'))}
                />
                {fieldError('confirm') && (
                  <p className="mt-1.5 text-xs text-red-400">{fieldError('confirm')}</p>
                )}
              </div>
            )}

            <button type="submit" disabled={submitting} className="btn-primary w-full !py-3">
              {submitting && <Spinner />}
              {submitting
                ? isRegister
                  ? 'Creating account…'
                  : 'Signing in…'
                : isRegister
                  ? 'Create inspector account'
                  : 'Sign in'}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-500">
            {isRegister
              ? 'Already registered? Switch to sign in.'
              : 'No account yet? Guest scans stay in this browser and are fully functional.'}
          </p>

          <div className="mt-5 border-t border-white/10 pt-4 text-center">
            <Link to="/upload?mode=demo" className="text-xs font-semibold text-vision-300 hover:text-vision-200">
              Skip sign-in and explore Demo Mode →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
