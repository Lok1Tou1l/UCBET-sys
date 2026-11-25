import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';

export interface AsyncState<T> {
  data: T | undefined;
  loading: boolean;
  error: unknown;
  reload: () => void;
  setData: (d: T | undefined | ((prev: T | undefined) => T | undefined)) => void;
}

/**
 * Runs `fn` on mount and whenever `deps` change. Ignores out-of-order responses.
 * `keepPrevious` keeps the previous data visible while reloading (good for paginated tables).
 */
export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList, options: { keepPrevious?: boolean; enabled?: boolean } = {}): AsyncState<T> {
  const { keepPrevious = true, enabled = true } = options;
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<unknown>(undefined);
  const [tick, setTick] = useState(0);
  const callId = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const id = ++callId.current;
    setLoading(true);
    setError(undefined);
    if (!keepPrevious) setData(undefined);
    fn()
      .then((d) => {
        if (id === callId.current) setData(d);
      })
      .catch((e) => {
        if (id === callId.current) setError(e);
      })
      .finally(() => {
        if (id === callId.current) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick, enabled]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, loading, error, reload, setData };
}
