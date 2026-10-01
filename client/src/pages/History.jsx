import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  Database,
  Download,
  HardDrive,
  Search,
  Trash2,
  Upload,
  X
} from 'lucide-react';
import DemoBadge from '../components/DemoBadge.jsx';
import ErrorBanner, { LoadingBlock } from '../components/ErrorBanner.jsx';
import { deleteScan, fetchScans } from '../utils/api.js';
import {
  clearLocalScans,
  deleteLocalScan,
  downloadJson,
  listLocalScans,
  localStorageUsage
} from '../utils/localStorage.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  cx,
  formatBytes,
  formatDateTime,
  formatRelative,
  formatSeverity,
  severityMeta
} from '../utils/format.js';

const PAGE_SIZE = 12;

export default function History() {
  const { isAuthenticated } = useAuth();
  const [source, setSource] = useState(isAuthenticated ? 'database' : 'browser');
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('ALL');
  const [sourceType, setSourceType] = useState('ALL');
  const [page, setPage] = useState(1);

  const [scans, setScans] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [storage, setStorage] = useState(localStorageUsage());

  // Guests never hit the API; switching to the database view prompts sign-in.
  useEffect(() => {
    setSource(isAuthenticated ? 'database' : 'browser');
  }, [isAuthenticated]);

  useEffect(() => {
    if (source === 'database' && !isAuthenticated) setSource('browser');
  }, [source, isAuthenticated]);

  const loadDatabase = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchScans({
        page,
        page_size: PAGE_SIZE,
        search: search.trim(),
        mode,
        source_type: sourceType
      });
      setScans(result.scans);
      setTotal(result.total);
      setPages(result.pages);
    } catch (err) {
      setError(err);
      setScans([]);
      setTotal(0);
      setPages(0);
    } finally {
      setLoading(false);
    }
  }, [page, search, mode, sourceType]);

  useEffect(() => {
    if (source !== 'database') return;
    // Debounce search input so typing does not spam the API.
    const timer = window.setTimeout(loadDatabase, 250);
    return () => window.clearTimeout(timer);
  }, [source, loadDatabase]);

  const localScans = useMemo(() => {
    if (source !== 'browser') return [];
    const term = search.trim().toLowerCase();
    return listLocalScans()
      .filter((scan) => (mode === 'ALL' ? true : scan.mode === mode))
      .filter((scan) => (sourceType === 'ALL' ? true : scan.source_type === sourceType))
      .filter((scan) =>
        term
          ? `${scan.scene_category} ${scan.scene_description} ${(scan.detected_objects || [])
              .map((obj) => obj.object_name)
              .join(' ')}`
              .toLowerCase()
              .includes(term)
          : true
      );
  }, [source, search, mode, sourceType]);

  useEffect(() => {
    setStorage(localStorageUsage());
  }, [localScans, source]);

  const rows = source === 'database' ? scans : localScans;

  const removeRow = async (row) => {
    setError(null);
    try {
      if (source === 'database') {
        await deleteScan(row.id);
        setScans((current) => current.filter((item) => item.id !== row.id));
        setTotal((current) => Math.max(0, current - 1));
      } else {
        deleteLocalScan(row.local_id);
        setStorage(localStorageUsage());
      }
    } catch (err) {
      setError(err);
    }
  };

  const clearAll = () => {
    if (source === 'browser') {
      clearLocalScans();
      setStorage(localStorageUsage());
    }
  };

  const exportAll = () => {
    const payload = {
      exported_at: new Date().toISOString(),
      source: source === 'database' ? 'visionx-postgresql' : 'visionx-browser-storage',
      filters: { search, mode, source_type: sourceType },
      count: rows.length,
      scans: rows
    };
    downloadJson(`visionx-history-${source}-${Date.now()}`, payload);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-vision-400">Archive</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">Scan History</h1>
          <p className="mt-2 text-sm text-slate-400">
            Every scan, with thumbnails, filters, and JSON re-export. Guests read from this browser;
            signed-in inspectors read from PostgreSQL.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={exportAll} disabled={rows.length === 0} className="btn-ghost !py-2 !text-xs">
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Export {rows.length} record{rows.length === 1 ? '' : 's'}
          </button>
          {source === 'browser' && (
            <button
              type="button"
              onClick={clearAll}
              disabled={localScans.length === 0}
              className="btn-danger !py-2 !text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Clear browser history
            </button>
          )}
          <Link to="/upload" className="btn-primary !py-2 !text-xs">
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            New scan
          </Link>
        </div>
      </header>

      {/* Filters */}
      <section className="card mt-6 !p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            <input
              type="search"
              className="field !pl-9"
              placeholder="Search scene, description, or object name…"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              aria-label="Search scan history"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-300"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <select
            className="field !w-auto"
            value={mode}
            onChange={(event) => {
              setMode(event.target.value);
              setPage(1);
            }}
            aria-label="Filter by mode"
          >
            <option value="ALL">All modes</option>
            <option value="REAL">Real AI</option>
            <option value="DEMO">Simulated</option>
          </select>

          <select
            className="field !w-auto"
            value={sourceType}
            onChange={(event) => {
              setSourceType(event.target.value);
              setPage(1);
            }}
            aria-label="Filter by source"
          >
            <option value="ALL">All sources</option>
            <option value="CAMERA">Camera</option>
            <option value="UPLOAD">Upload</option>
          </select>

          <div className="flex rounded-xl border border-white/10 bg-ink-950/60 p-1" role="radiogroup" aria-label="Storage layer">
            <button
              type="button"
              role="radio"
              aria-checked={source === 'database'}
              onClick={() => {
                if (!isAuthenticated) return;
                setSource('database');
                setPage(1);
              }}
              disabled={!isAuthenticated}
              className={cx(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40',
                source === 'database' ? 'bg-vision-500 text-ink-950' : 'text-slate-400 hover:text-slate-200'
              )}
              title={isAuthenticated ? 'PostgreSQL history' : 'Sign in to read database history'}
            >
              <Database className="mr-1.5 inline h-3.5 w-3.5" aria-hidden="true" />
              Database
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={source === 'browser'}
              onClick={() => setSource('browser')}
              className={cx(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                source === 'browser' ? 'bg-vision-500 text-ink-950' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <HardDrive className="mr-1.5 inline h-3.5 w-3.5" aria-hidden="true" />
              Browser
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
          <span>
            {source === 'database' ? `${total} stored scan${total === 1 ? '' : 's'}` : `${localScans.length} local scan${localScans.length === 1 ? '' : 's'}`}
          </span>
          {source === 'browser' && (
            <span>
              Using {formatBytes(storage.bytes)} of browser storage ({Math.round(storage.ratio * 100)}% of a typical quota)
            </span>
          )}
          {source === 'database' && !isAuthenticated && (
            <Link to="/auth" className="font-semibold text-vision-300 hover:text-vision-200">
              Sign in to enable database history
            </Link>
          )}
        </div>
      </section>

      {error && <ErrorBanner className="mt-5" error={error} onDismiss={() => setError(null)} />}

      {loading ? (
        <LoadingBlock label="Loading scan history…" />
      ) : rows.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-white/10 px-6 py-20 text-center">
          <Camera className="mx-auto h-8 w-8 text-slate-600" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-white">Nothing here yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            {search || mode !== 'ALL' || sourceType !== 'ALL'
              ? 'No scans match the current filters. Try widening the search.'
              : 'Run a scan from the live camera or the upload hub, then save it to build an audit trail.'}
          </p>
          <Link to="/upload" className="btn-primary mt-6">
            Start a scan
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((row) => {
              const id = row.id || row.local_id;
              const meta = severityMeta(row.severity_score);
              const thumbnail = row.thumbnail || row.image_data || null;
              return (
                <article key={id} className="card !p-0 overflow-hidden">
                  <div className="relative aspect-video bg-ink-950">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt={`Preview of ${row.scene_category}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-xs text-slate-600">
                        No preview stored
                      </div>
                    )}

                    {row.mode === 'DEMO' && (
                      <span className="absolute left-2 top-2">
                        <DemoBadge />
                      </span>
                    )}

                    <span
                      className={cx(
                        'absolute right-2 top-2 rounded-lg border px-2 py-1 font-mono text-[10px] font-bold backdrop-blur',
                        meta.bg,
                        meta.text,
                        meta.border
                      )}
                    >
                      {formatSeverity(row.severity_score)}
                    </span>
                  </div>

                  <div className="p-4">
                    <h3 className="truncate text-sm font-bold text-white" title={row.scene_category}>
                      {row.scene_category}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-400">
                      {row.scene_description}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span className="chip">{row.source_type === 'CAMERA' ? 'Camera' : 'Upload'}</span>
                      <span className="chip">{row.total_objects ?? row.detected_objects?.length ?? 0} objects</span>
                      <span className="chip">
                        {Number(row.highest_confidence ?? 0).toFixed(1)}% top
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                      <div>
                        <p className="text-[11px] text-slate-500">{formatDateTime(row.created_at)}</p>
                        <p className="text-[10px] text-slate-600">{formatRelative(row.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => exportAll()}
                          className="btn-ghost !px-2 !py-1 !text-[11px]"
                          title="Export the current filtered set"
                        >
                          <Download className="h-3 w-3" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeRow(row)}
                          className="btn-danger !px-2 !py-1 !text-[11px]"
                          title="Delete this scan"
                        >
                          <Trash2 className="h-3 w-3" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {source === 'database' && pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={page <= 1 || loading}
                className="btn-ghost !py-2 !text-xs"
              >
                Previous
              </button>
              <span className="text-xs text-slate-400">
                Page {page} of {pages}
              </span>
              <button
                type="button"
                onClick={() => setPage((value) => Math.min(pages, value + 1))}
                disabled={page >= pages || loading}
                className="btn-ghost !py-2 !text-xs"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
