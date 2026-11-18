/** Client data adapter. Market data comes only from the server-side Mansa proxy.
 * Missing credentials or unavailable endpoints are surfaced as errors. No fixtures or generated data.
 */
const request = async (params) => {
  const url = new URL('/api/market', window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  });
  const response = await fetch(url, { headers: { Accept: 'application/json', 'X-Requested-With': 'Ukuaji-Web' }, cache: 'no-store' });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || `Erreur API (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return payload;
};
export const getExchanges = () => request({ action: 'exchanges' });
export const getSymbols = (exchange) => request({ action: 'stocks', exchange, limit: 200 });
export const getCandles = (exchange, symbol, range = '1Y') => request({ action: 'history', exchange, symbol, range });
export const searchSymbols = (query) => request({ action: 'search', q: query, limit: 20 });

export const getIndices = () => request({ action: 'indices' });
export const getMovers = () => request({ action: 'movers' });
