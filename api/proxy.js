// /api/proxy.js
export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { service, endpoint, body } = await req.json();
    
    const services = {
      groq: {
        baseUrl: 'https://api.groq.com/openai/v1',
        apiKey: process.env.GROQ_API_KEY,
        auth: { header: 'Authorization', format: k => `Bearer ${k}` }
      }
    };

    const cfg = services[service];
    if (!cfg) return new Response(JSON.stringify({ error: 'Invalid service' }), { status: 400 });

    const headers = { 'Content-Type': 'application/json' };
    if (cfg.auth && cfg.apiKey) headers[cfg.auth.header] = cfg.auth.format(cfg.apiKey);

    const res = await fetch(`${cfg.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Proxy failed' }), { status: 500 });
  }
}