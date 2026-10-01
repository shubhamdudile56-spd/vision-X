import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { visionStatus, fetchCredentials, saveCredentials, clearCredentials } from '../utils/api.js';

/**
 * Shared vision-engine state.
 *
 * Every surface that needs the Gemini key (landing page, live camera, upload
 * hub) reads and refreshes this one context, so saving a key in the panel
 * immediately unlocks Real Vision AI Mode everywhere without a page reload.
 */
const EngineContext = createContext(null);

export function EngineProvider({ children }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const inflight = useRef(false);

  const refresh = useCallback(async () => {
    if (inflight.current) return null;
    inflight.current = true;
    try {
      const [vision, credentials] = await Promise.all([
        visionStatus(),
        fetchCredentials().catch(() => null)
      ]);
      setStatus({
        ...vision,
        credentials: credentials ?? { configured: vision.engine_configured, source: vision.key_source, hint: vision.key_hint }
      });
      setError(null);
      return status;
    } catch (err) {
      setError(err);
      setStatus(null);
      return null;
    } finally {
      inflight.current = false;
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const connect = useCallback(
    async (apiKey) => {
      const result = await saveCredentials(apiKey);
      await refresh();
      return result;
    },
    [refresh]
  );

  const disconnect = useCallback(async () => {
    const result = await clearCredentials();
    await refresh();
    return result;
  }, [refresh]);

  const value = useMemo(
    () => ({
      status,
      loading,
      error,
      engineConfigured: Boolean(status?.engine_configured),
      databaseConfigured: Boolean(status?.database_configured),
      persistence: status?.persistence ?? null,
      model: status?.model ?? null,
      demoScenes: status?.demo_scenes ?? [],
      keySource: status?.credentials?.source ?? status?.key_source ?? null,
      keyHint: status?.credentials?.hint ?? status?.key_hint ?? null,
      connect,
      disconnect,
      refresh
    }),
    [status, loading, error, connect, disconnect, refresh]
  );

  return <EngineContext.Provider value={value}>{children}</EngineContext.Provider>;
}

export function useEngine() {
  const context = useContext(EngineContext);
  if (!context) throw new Error('useEngine must be used inside an <EngineProvider>');
  return context;
}

export default EngineContext;
