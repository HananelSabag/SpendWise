/** Resolve an internal post-auth destination without allowing an open redirect. */
export function resolveAuthReturnPath(from, fallback = '/') {
  const pathname = typeof from === 'string' ? from : from?.pathname;
  const search = typeof from === 'object' && typeof from?.search === 'string' ? from.search : '';
  if (typeof pathname !== 'string' || !pathname.startsWith('/') || pathname.startsWith('//')) {
    return fallback;
  }
  return `${pathname}${search}`;
}

