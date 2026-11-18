const BASE_URL='https://mansaapi.com/api/v1';
const EXCHANGE_CODE=/^[A-Z0-9_-]{2,12}$/;
const TICKER_CODE=/^[A-Z0-9._-]{1,24}$/;
function send(res,status,body,cache='no-store'){res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control',cache);res.setHeader('X-Content-Type-Options','nosniff');res.status(status).json(body);}
export default async function handler(req,res){
  if(req.method!=='GET'){res.setHeader('Allow','GET');return send(res,405,{error:'Méthode non autorisée.'});}
  if(process.env.MANSA_PUBLIC_DISPLAY_AUTHORIZED!=='true')return send(res,403,{error:'L’affichage public des données Mansa est bloqué tant que les droits de diffusion ne sont pas confirmés.',code:'MARKET_DISPLAY_NOT_AUTHORIZED'});
  const apiKey=process.env.MANSA_API_KEY;
  if(!apiKey)return send(res,503,{error:'Le fournisseur de données n’est pas encore configuré. La clé Mansa API doit être ajoutée côté serveur.',code:'MARKET_PROVIDER_NOT_CONFIGURED'});
  const {action}=req.query;let path;
  if(action==='exchanges')path='/markets/exchanges';
  else if(action==='stocks'){const exchange=String(req.query.exchange||'').toUpperCase();if(!EXCHANGE_CODE.test(exchange))return send(res,400,{error:'Code de place invalide.'});const limit=Math.min(200,Math.max(1,Number.parseInt(req.query.limit||'100',10)||100));path=`/markets/exchanges/${encodeURIComponent(exchange)}/stocks?limit=${limit}`;}
  else if(action==='history'){const exchange=String(req.query.exchange||'').toUpperCase(),ticker=String(req.query.symbol||'').toUpperCase(),range=String(req.query.range||'1Y').toUpperCase();if(!EXCHANGE_CODE.test(exchange)||!TICKER_CODE.test(ticker))return send(res,400,{error:'Place ou symbole invalide.'});if(!['1M','3M','6M','1Y','2Y','5Y','10Y','ALL'].includes(range))return send(res,400,{error:'Période invalide.'});path=`/markets/exchanges/${encodeURIComponent(exchange)}/stocks/${encodeURIComponent(ticker)}/history?range=${range}`;}
  else if(action==='search'){const q=String(req.query.q||'').trim().slice(0,80);if(q.length<1)return send(res,400,{error:'Saisissez un symbole ou un nom.'});path=`/markets/search?q=${encodeURIComponent(q)}&limit=20`;}
  else return send(res,400,{error:'Action API inconnue.'});
  try{const upstream=await fetch(`${BASE_URL}${path}`,{method:'GET',headers:{Authorization:`Bearer ${apiKey}`,Accept:'application/json'},signal:AbortSignal.timeout(12000)});const body=await upstream.json().catch(()=>null);if(!upstream.ok){const status=upstream.status===429?429:upstream.status===401||upstream.status===403?502:upstream.status;return send(res,status,{error:body?.message||body?.error||`Le fournisseur a répondu avec le statut ${upstream.status}.`,code:'UPSTREAM_MARKET_ERROR',providerStatus:upstream.status});}return send(res,200,body,'public, s-maxage=600, stale-while-revalidate=300');}
  catch(error){return send(res,502,{error:error.name==='TimeoutError'?'Le fournisseur ne répond pas dans le délai prévu.':'Impossible de joindre le fournisseur de données.',code:'MARKET_PROVIDER_UNREACHABLE'});}
}
