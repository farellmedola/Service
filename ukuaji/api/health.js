import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ status: 'error', code: 'METHOD_NOT_ALLOWED' });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(503).json({
      status: 'degraded',
      database: 'not_configured',
      code: 'DATABASE_NOT_CONFIGURED'
    });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql`SELECT 1 AS ok`;
    return res.status(200).json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch {
    return res.status(503).json({
      status: 'degraded',
      database: 'unavailable',
      code: 'DATABASE_UNAVAILABLE'
    });
  }
}
