import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertOctagon,
  Boxes,
  Camera,
  Download,
  Eye,
  Layers,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp
} from 'lucide-react';
import { CategoryBars, MetricCard, SeverityGauge, TrendChart } from '../components/AnalyticsChart.jsx';
import DemoBadge from '../components/DemoBadge.jsx';
import ErrorBanner, { LoadingBlock } from '../components/ErrorBanner.jsx';
import { fetchAnalytics, fetchScan } from '../utils/api.js';
import { downloadJson } from '../utils/localStorage.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  categoryColor,
  cx,
  formatDateTime,
  formatRelative,
  formatSeverity,
  severityMeta
} from '../utils/format.js';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchAnalytics();
      setData(payload);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (id) => {
    setDetailLoading(true);
    setError(null);
    try {
      const scan = await fetchScan(id);
      setSelected(scan);
    } catch (err) {
      setError(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const metrics = data?.metrics;

  const derived = useMemo(() => {
    if (!metrics) return { avgPerScan: 0, criticalShare: 0 };
    const avgPerScan =
      metrics.total_scans > 0 ? metrics.total_detected_objects / metrics.total_scans : 0;
    const criticalShare =
      metrics.total_scans > 0 ? (metrics.critical_scans / metrics.total_scans) * 100 : 0;
    return { avgPerScan, criticalShare };
  }, [metrics]);

  if (loading) return <LoadingBlock label="Loading operational analytics…" />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-vision-400">Operations</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">Detection Analytics</h1>
          <p className="mt-2 text-sm text-slate-400">
            {isAdmin
              ? 'Admin view — every inspector scan across the organisation.'
              : `Aggregated metrics for ${user?.full_name}.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={load} className="btn-ghost !py-2 !text-xs">
            <RefreshCw className={cx('h-3.5 w-3.5', loading && 'animate-spin')} aria-hidden="true" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => downloadJson(`visionx-analytics-${Date.now()}`, data)}
            disabled={!data}
            className="btn-ghost !py-2 !text-xs"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Export report
          </button>
          <Link to="/upload" className="btn-primary !py-2 !text-xs">
            <Camera className="h-3.5 w-3.5" aria-hidden="true" />
            New scan
          </Link>
        </div>
      </header>

      {error && <ErrorBanner className="mt-6" error={error} onDismiss={() => setError(null)} />}

      {data && !data.persistence_available && (
        <div className="mt-6 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-xs text-amber-200">
          Database analytics are unavailable right now, so these figures reflect the live response
          only. Reconnect PostgreSQL and refresh for historical trends.
        </div>
      )}

      {metrics?.total_scans === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-white/10 px-6 py-20 text-center">
          <Target className="mx-auto h-8 w-8 text-slate-600" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-white">No scans recorded yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Run your first analysis and this dashboard fills with severity trends, category
            breakdowns, and an audit trail of every detection.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link to="/live" className="btn-primary">
              Start Vision
            </Link>
            <Link to="/upload?mode=demo" className="btn-ghost">
              Try Demo Mode
            </Link>
          </div>
        </div>
      ) : (
        <>
          <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={Boxes}
              label="Total objects detected"
              value={metrics?.total_detected_objects ?? 0}
              hint={`${derived.avgPerScan.toFixed(1)} per scan on average`}
              tone="teal"
            />
            <MetricCard
              icon={Layers}
              label="Unique categories"
              value={metrics?.unique_categories ?? 0}
              hint="Across every stored scan"
            />
            <MetricCard
              icon={Sparkles}
              label="Highest confidence"
              value={Number(metrics?.peak_confidence ?? 0).toFixed(1)}
              suffix="%"
              decimals={1}
              hint={`Average ${Number(metrics?.avg_confidence ?? 0).toFixed(1)}% across scans`}
              tone="blue"
            />
            <MetricCard
              icon={AlertOctagon}
              label="Critical scans"
              value={metrics?.critical_scans ?? 0}
              hint={`${derived.criticalShare.toFixed(0)}% of all scans above 0.70 severity`}
              tone="red"
            />
          </section>

          <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="card">
              <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                <TrendingUp className="h-4 w-4 text-vision-400" aria-hidden="true" />
                Severity &amp; confidence trend
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Average severity per day (line) with scan volume (bars). 0.00 nominal → 1.00 critical.
              </p>
              <div className="mt-4">
                <TrendChart data={data?.severity_trend ?? []} />
              </div>
            </div>

            <div className="card">
              <h3 className="text-sm font-bold text-white">Fleet severity</h3>
              <div className="mt-4 flex flex-col items-center gap-3">
                <SeverityGauge score={metrics?.avg_severity ?? 0} size={150} label="Mean across stored scans" />
                <dl className="w-full space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Peak severity</dt>
                    <dd className="font-mono text-slate-200">
                      {formatSeverity(metrics?.peak_severity ?? 0)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Real scans</dt>
                    <dd className="font-mono text-vision-300">{metrics?.real_scans ?? 0}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Demo scans</dt>
                    <dd className="font-mono text-amber-300">{metrics?.demo_scans ?? 0}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>

          <section className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="card">
              <h3 className="text-sm font-bold text-white">Category breakdown</h3>
              <div className="mt-4">
                <CategoryBars data={data?.category_breakdown ?? []} />
              </div>
            </div>

            <div className="card">
              <h3 className="text-sm font-bold text-white">Highest-confidence objects</h3>
              {(data?.top_objects ?? []).length === 0 ? (
                <p className="mt-4 rounded-xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-500">
                  No detections recorded yet.
                </p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {data.top_objects.map((row) => (
                    <li
                      key={`${row.object_name}-${row.category}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{row.object_name}</p>
                        <p className="text-[11px]" style={{ color: categoryColor(row.category) }}>
                          {row.category} · seen {row.seen_count}×
                        </p>
                      </div>
                      <span className="shrink-0 font-mono text-sm font-bold text-vision-300">
                        {Number(row.confidence).toFixed(1)}%
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="mt-5 card !p-0">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <h3 className="text-sm font-bold text-white">Recent scan log</h3>
              <Link to="/history" className="text-xs font-semibold text-vision-300 hover:text-vision-200">
                Open full history →
              </Link>
            </header>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[46rem] text-left text-xs">
                <thead className="text-[10px] uppercase tracking-wider text-slate-500">
                  <tr className="border-b border-white/10">
                    <th className="px-5 py-3 font-semibold">When</th>
                    <th className="px-3 py-3 font-semibold">Scene</th>
                    <th className="px-3 py-3 font-semibold">Source</th>
                    <th className="px-3 py-3 text-right font-semibold">Objects</th>
                    <th className="px-3 py-3 text-right font-semibold">Confidence</th>
                    <th className="px-3 py-3 text-right font-semibold">Severity</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {(data?.recent_scans ?? []).map((scan) => {
                    const meta = severityMeta(scan.severity_score);
                    return (
                      <tr key={scan.id} className="border-b border-white/5 transition hover:bg-white/[0.03]">
                        <td className="px-5 py-3 text-slate-400">{formatRelative(scan.created_at)}</td>
                        <td className="px-3 py-3">
                          <span className="font-semibold text-slate-200">{scan.scene_category}</span>
                          {scan.mode === 'DEMO' && <DemoBadge className="ml-2" />}
                        </td>
                        <td className="px-3 py-3 text-slate-400">{scan.source_type}</td>
                        <td className="px-3 py-3 text-right font-mono text-slate-300">
                          {scan.total_objects}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-slate-300">
                          {Number(scan.highest_confidence).toFixed(1)}%
                        </td>
                        <td className="px-3 py-3 text-right">
                          <span className={cx('font-mono font-bold', meta.text)}>
                            {formatSeverity(scan.severity_score)}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => openDetail(scan.id)}
                            className="btn-ghost !px-2 !py-1 !text-[11px]"
                          >
                            <Eye className="h-3 w-3" aria-hidden="true" />
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {(data?.recent_scans ?? []).length === 0 && (
              <p className="px-5 py-10 text-center text-sm text-slate-500">No scans yet.</p>
            )}
          </section>
        </>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Scan detail"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-ink-900 p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-vision-400">
                  Scan detail
                </p>
                <h3 className="mt-1 text-xl font-bold text-white">{selected.scene_category}</h3>
                <p className="mt-1 text-xs text-slate-500">{formatDateTime(selected.created_at)}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="btn-ghost !px-3 !py-1.5 !text-xs">
                Close
              </button>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-300">{selected.scene_description}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="chip">{selected.mode === 'DEMO' ? 'Simulated' : 'Real inference'}</span>
              <span className="chip">{selected.source_type}</span>
              <span className={cx('chip', severityMeta(selected.severity_score).bg, severityMeta(selected.severity_score).text)}>
                Severity {formatSeverity(selected.severity_score)}
              </span>
              <span className="chip">{selected.detected_objects?.length ?? 0} objects</span>
            </div>

            <ul className="mt-5 space-y-2">
              {(selected.detected_objects ?? []).map((obj) => (
                <li key={obj.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">{obj.object_name}</p>
                    <span className="font-mono text-xs text-vision-300">
                      {Number(obj.confidence).toFixed(1)}%
                    </span>
                  </div>
                  <p className="mt-1 text-xs" style={{ color: categoryColor(obj.category) }}>
                    {obj.category}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{obj.insight}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {detailLoading && <LoadingBlock label="Loading scan detail…" className="!py-4" />}
    </div>
  );
}
