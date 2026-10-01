import { Link } from 'react-router-dom';
import { Compass, Home as HomeIcon } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/5">
        <Compass className="h-7 w-7 text-vision-400" aria-hidden="true" />
      </span>
      <p className="mt-6 font-mono text-xs uppercase tracking-[0.3em] text-slate-500">Error 404</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
        Nothing is framed here
      </h1>
      <p className="mt-3 text-sm text-slate-400">
        The page you requested does not exist. Point the inspector at a live feed or an image instead.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link to="/" className="btn-primary">
          <HomeIcon className="h-4 w-4" aria-hidden="true" />
          Back to home
        </Link>
        <Link to="/live" className="btn-ghost">
          Start Vision
        </Link>
      </div>
    </div>
  );
}
