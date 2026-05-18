// Default fetch has no timeout — a backend that hangs leaves the extension
// hung indefinitely. This wrapper aborts via AbortController after a fixed
// window so callers see a clean rejection instead of waiting forever.

export const DEFAULT_FETCH_TIMEOUT_MS = 15_000;

export async function fetchWithTimeout(
  input: RequestInfo,
  init?: RequestInit & { timeoutMs?: number }
): Promise<Response> {
  const { timeoutMs = DEFAULT_FETCH_TIMEOUT_MS, signal, ...rest } = init ?? {};

  const controller = new AbortController();
  // If the caller passed their own signal, chain it: abort us when theirs
  // aborts, so a higher-level cancel still propagates.
  if (signal) {
    if (signal.aborted) {
      controller.abort(signal.reason);
    } else {
      signal.addEventListener('abort', () => controller.abort(signal.reason), {
        once: true,
      });
    }
  }

  const timer = setTimeout(
    () => controller.abort(new DOMException('Timeout', 'TimeoutError')),
    timeoutMs
  );

  try {
    return await fetch(input, { ...rest, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
