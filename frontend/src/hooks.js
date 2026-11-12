// A small reusable hook: load data from the API with loading/error states built in.
// Usage: const { data, loading, error, reload } = useApi(() => getPlayer(id), [id]);
//
// How it works: every combination of inputs gets a "key". While the latest answer
// doesn't match the current key, we're loading. Answers for old keys are ignored,
// so a slow response can never overwrite a newer one.
import { useEffect, useRef, useState } from 'react';
import { getErrorMessage } from './services/api';

export function useApi(fetcher, deps) {
  const [result, setResult] = useState({ key: null, data: null, error: null });
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([...deps, attempt]);

  // Always call the latest version of the fetcher without re-running the effect
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    let cancelled = false;
    fetcherRef
      .current()
      .then((data) => {
        if (!cancelled) setResult({ key, data, error: null });
      })
      .catch((err) => {
        if (!cancelled) setResult({ key, data: null, error: getErrorMessage(err) });
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  const loading = result.key !== key;
  return {
    data: loading ? null : result.data,
    error: loading ? null : result.error,
    loading,
    reload: () => setAttempt((n) => n + 1),
  };
}
