"use client";

import { useEffect, useState } from "react";
import { getAccessToken } from "./api";

interface DataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** true when the mock fallback was served (backend unreachable or demo login) */
  demo: boolean;
}

/**
 * Fetch data with automatic fallback to mock data when the backend is
 * unreachable (network error) or when logged in with the demo account.
 */
export function useData<T>(
  fetcher: () => Promise<T>,
  fallback: T,
  deps: unknown[] = []
): DataState<T> {
  const [state, setState] = useState<DataState<T>>({
    data: null,
    loading: true,
    error: null,
    demo: false,
  });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    if (getAccessToken() === "demo") {
      setState({ data: fallback, loading: false, error: null, demo: true });
      return;
    }

    fetcher()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null, demo: false });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // Network failure -> serve demo data so the UI stays explorable.
        if (err instanceof TypeError) {
          setState({ data: fallback, loading: false, error: null, demo: true });
        } else {
          const msg = err instanceof Error ? err.message : "Request failed";
          setState({ data: null, loading: false, error: msg, demo: false });
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
