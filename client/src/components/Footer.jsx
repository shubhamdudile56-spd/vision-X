import { Link } from 'react-router-dom';
import { Activity, Github, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-ink-950/60">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-vision-400" aria-hidden="true" />
            <span className="text-sm font-bold text-white">VisionX</span>
          </div>
          <p className="mt-2 max-w-xs text-sm text-slate-500">
            Multi-stage visual perception for industrial inspection, workplace safety, inventory, and
            document understanding.
          </p>
        </div>

        <nav className="flex flex-col gap-2 text-sm" aria-label="Footer">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Product</span>
          <Link to="/live" className="text-slate-400 transition hover:text-vision-300">
            Live Vision
          </Link>
          <Link to="/upload" className="text-slate-400 transition hover:text-vision-300">
            Analyze an image
          </Link>
          <Link to="/dashboard" className="text-slate-400 transition hover:text-vision-300">
            Analytics dashboard
          </Link>
          <Link to="/history" className="text-slate-400 transition hover:text-vision-300">
            Scan history
          </Link>
        </nav>

        <div className="flex flex-col gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Trust</span>
          <p className="flex items-start gap-2 text-slate-400">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-vision-400" aria-hidden="true" />
            API keys stay server-side. Uploads are validated by magic bytes and never written to disk.
          </p>
          <p className="flex items-center gap-2 text-slate-500">
            <Github className="h-4 w-4" aria-hidden="true" />
            Gemini v2.5 multimodal inference
          </p>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} VisionX. Built for inspection teams who need to see what the
        camera sees.
      </div>
    </footer>
  );
}
