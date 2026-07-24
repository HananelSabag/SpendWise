const PERSISTED_QUERY_ROOTS = new Set([
  'dashboard',
  'bankSyncStats',
]);

/**
 * Keep offline recovery useful without serializing full transaction histories
 * or financial-cycle workspaces into synchronous localStorage.
 */
export function shouldPersistQuery(query) {
  const root = query?.queryKey?.[0];
  return query?.state?.status === 'success'
    && !query.isStale()
    && PERSISTED_QUERY_ROOTS.has(root);
}

export default shouldPersistQuery;
