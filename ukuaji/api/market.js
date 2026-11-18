const BASE_URL = 'https://mansaapi.com/api/v1';
const EXCHANGE_CODE = /^[A-Z0-9_-]{2,16}$/;
const TICKER_CODE = /^[A-Z0-9._-]{1,24}$/;
const QUOTE_FIELDS = ['ticker','symbol','code','name','company_name','company','exchange','exchange_code','currency','currency_code','price','last_price','current_price','close','last','currentPrice','change_pct','changePercentage','change','volume','updated_at','last_updated','as_of'];
const EXCHANGE_FIELDS = ['code','exchange_code','name','country','country_code','currency','currency_code','updated_at','as_of','index_value','index','change_pct'];
const INDEX_FIELDS = ['code','index_code','index_name','market_id','name','country','country_code','currency','currency_code','value','index_value','index_change','index_change_pct','ytd_change','currentPrice','change_pct','changePercentage','updated_at','scraped_at','exchange','description'];
const HISTORY_FIELDS = ['date','t','timestamp','open','high','low','close','volume'];
const META_FIELDS = ['count','updated_at','as_of','scraped_at','data_freshness','freshness','delay_minutes','delayMinutes','stale','refresh_interval_seconds','first_date','last_date','order','exchange','currency','point_count','exchanges_included'];

function pickFields(value, fields) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(fields.filter(key => value[key] !== undefined).map(key => [key, value[key]]));
}
function findArray(value, keys) {
  const records = [];
  const walk = node => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { records.push(...node); return; }
    for (const [key, child] of Object.entries(node)) {
      if (keys.includes(key) && Array.isArray(child)) records.push(...child);
      else if (child && typeof child === 'object') walk(child);
    }
  };
  walk(value);
  return records;
}
function shapePayload(body, action) {
  const fields = action === 'exchanges' ? EXCHANGE_FIELDS : action === 'indices' ? INDEX_FIELDS : action === 'history' ? HISTORY_FIELDS : QUOTE_FIELDS;
  const meta = pickFields(body?.meta, META_FIELDS);
  for (const key of ['updated_at','as_of','data_freshness']) if (body?.[key] !== undefined && meta[key] === undefined) meta[key] = body[key];
  if (action === 'history') {
    const data = body?.data && !Array.isArray(body.data) ? body.data : body;
    const points = findArray(data, ['points','history','data']);
    return { success: body?.success !== false, data: { price_unit: data?.price_unit || body?.price_unit || 'major', points: points.map(row => pickFields(row, HISTORY_FIELDS)) }, meta };
  }
  const keys = action === 'exchanges' ? ['exchanges','data','items'] :
    action === 'indices' ? ['indices','data','items','results'] :
    action === 'movers' ? ['movers','stocks','data','items','results','gainers','losers','top_gainers','top_losers'] :
    action === 'search' ? ['results','stocks','data','items'] : ['stocks','data','items'];
  const records = findArray(body, keys);
  let data = records.map(row => {
    const item = pickFields(row, fields);
    if (!item.updated_at) item.updated_at = item.last_updated || item.scraped_at || item.as_of || meta.updated_at || meta.scraped_at || meta.as_of || null;
    return item;
  });
  if (action === 'movers') {
    const change = item => Number(item.change_pct ?? item.changePercentage ?? item.change);
    const gainers = data.filter(item => Number.isFinite(change(item)) && change(item) > 0).slice(0, 10);
    const losers = data.filter(item => Number.isFinite(change(item)) && change(item) < 0).slice(0, 10);
    data = [...gainers, ...losers];
  }
  return { success: body?.success !== false, data, meta };
}
function send(res, status, body, cache = 'no-store') {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', cache);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.status(status).json(body);
}
export default async function handler(req, res) {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return send(res, 405, { error: 'Méthode non autorisée.', code: 'METHOD_NOT_ALLOWED' }); }
  if (req.headers?.['x-requested-with'] !== 'Ukuaji-Web') return send(res, 403, { error: 'Cette route est réservée à l’interface Ukuaji.', code: 'FIRST_PARTY_ONLY' });
  if (process.env.MANSA_PUBLIC_DISPLAY_AUTHORIZED !== 'true') return send(res, 403, {
    error: 'L’affichage des données Mansa est désactivé tant que les droits applicables ne sont pas validés.',
    code: 'MARKET_DISPLAY_NOT_AUTHORIZED'
  });
  const apiKey = process.env.MANSA_API_KEY;
  if (!apiKey) return send(res, 503, {
    error: 'Le fournisseur de données n’est pas encore configuré. La clé Mansa API doit être ajoutée côté serveur.',
    code: 'MARKET_PROVIDER_NOT_CONFIGURED'
  });
  const { action } = req.query;
  if (action === 'history' && process.env.MANSA_HISTORY_ENABLED !== 'true') return send(res, 403, {
    error: 'L’historique OHLCV quotidien nécessite le plan Mansa Pro ou supérieur.',
    code: 'MARKET_HISTORY_TIER_REQUIRED'
  });
  let path;
  if (action === 'exchanges') path = '/markets/exchanges';
  else if (action === 'indices') path = '/markets/indices';
  else if (action === 'movers') path = '/markets/movers/pan-african?limit=20';
  else if (action === 'stocks') {
    const exchange = String(req.query.exchange || '').toUpperCase();
    if (!EXCHANGE_CODE.test(exchange)) return send(res, 400, { error: 'Code de place invalide.', code: 'INVALID_EXCHANGE' });
    const limit = Math.min(200, Math.max(1, Number.parseInt(req.query.limit || '100', 10) || 100));
    path = `/markets/exchanges/${encodeURIComponent(exchange)}/stocks?limit=${limit}`;
  } else if (action === 'history') {
    const exchange = String(req.query.exchange || '').toUpperCase();
    const ticker = String(req.query.symbol || '').toUpperCase();
    const range = String(req.query.range || '1Y').toUpperCase();
    if (!EXCHANGE_CODE.test(exchange) || !TICKER_CODE.test(ticker)) return send(res, 400, { error: 'Place ou symbole invalide.', code: 'INVALID_INSTRUMENT' });
    if (!['1M','3M','6M','1Y','2Y','5Y','10Y','ALL'].includes(range)) return send(res, 400, { error: 'Période invalide.', code: 'INVALID_RANGE' });
    path = `/markets/exchanges/${encodeURIComponent(exchange)}/stocks/${encodeURIComponent(ticker)}/history?range=${range}`;
  } else if (action === 'search') {
    const q = String(req.query.q || '').trim().slice(0, 80);
    if (q.length < 1) return send(res, 400, { error: 'Saisissez un symbole ou un nom.', code: 'EMPTY_QUERY' });
    path = `/markets/search?q=${encodeURIComponent(q)}&limit=50`;
  } else return send(res, 400, { error: 'Action API inconnue.', code: 'UNKNOWN_ACTION' });
  try {
    const upstream = await fetch(`${BASE_URL}${path}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(12000)
    });
    const body = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      const status = upstream.status === 429 ? 429 : upstream.status === 401 || upstream.status === 403 ? 502 : upstream.status;
      return send(res, status, {
        error: body?.message || body?.error || `Le fournisseur a répondu avec le statut ${upstream.status}.`,
        code: 'UPSTREAM_MARKET_ERROR', providerStatus: upstream.status
      });
    }
    return send(res, 200, shapePayload(body, action), 'public, s-maxage=1800, stale-while-revalidate=300');
  } catch (error) {
    return send(res, 502, {
      error: error.name === 'TimeoutError' ? 'Le fournisseur ne répond pas dans le délai prévu.' : 'Impossible de joindre le fournisseur de données.',
      code: 'MARKET_PROVIDER_UNREACHABLE'
    });
  }
}
