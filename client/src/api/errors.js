/** One error contract from HTTP transport through API envelopes to query hooks. */
export function normalizeApiError(error) {
  if (typeof error?.status === 'number' && typeof error?.code === 'string') return error;
  const response = error?.response;
  if (response) {
    const data = response.data || {};
    const detail = data.error && typeof data.error === 'object' ? data.error : {};
    return {
      ...detail,
      status: response.status,
      code: detail.code || data.code || `HTTP_${response.status}`,
      message: detail.message || (typeof data.error === 'string' ? data.error : null)
        || data.message || error.message || 'Request failed',
      details: detail.details || data.details,
    };
  }
  const cancelled = error?.code === 'ERR_CANCELED' || error?.name === 'AbortError';
  const timedOut = ['ECONNABORTED', 'ETIMEDOUT'].includes(error?.code)
    || /timeout/i.test(error?.message || '');
  return {
    status: 0,
    code: cancelled ? 'ERR_CANCELED' : timedOut ? 'TIMEOUT' : error?.code || 'NETWORK_ERROR',
    message: error?.message || 'Unable to connect to the server',
  };
}

export function apiResultError(result, fallback = 'Request failed') {
  const detail = result?.error || result || {};
  return Object.assign(new Error(detail.message || fallback), detail, {
    status: result?.status ?? detail.status ?? 0,
  });
}

/** Two retries for transient reads; no repeated auth, validation or cancelled calls. */
export function shouldRetryQuery(failureCount, error) {
  const status = error?.status ?? error?.response?.status;
  if (status >= 400 && status < 500) return false;
  if (['ERR_CANCELED', 'NO_TOKEN', 'MAINTENANCE_MODE'].includes(error?.code)) return false;
  if (error?.name === 'AbortError') return false;
  return failureCount < 2;
}
