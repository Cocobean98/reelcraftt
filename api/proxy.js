export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    // Accept 'service' and 'method' from the frontend
    const { service, endpoint, body, method = 'POST' } = await req.json();
    
    const services = {
      groq: {
        baseUrl: 'https://api.groq.com/openai/v1',
        apiKey: process.env.GROQ_API_KEY,
        authHeader: 'Authorization',
        authFormat: k => `Bearer ${k}`
      },
      pexels: {
        baseUrl: 'https://api.pexels.com',
        apiKey: process.env.PEXELS_API_KEY,
        authHeader: 'Authorization',
        authFormat: k => k
      }
    };

    const cfg = services[service];
    if (!cfg) return new Response(JSON.stringify({ error: 'Invalid service' }), { status: 400 });
    if (!cfg.apiKey) return new Response(JSON.stringify({ error: 'API key missing on server' }), { status: 500 });

    let url = `${cfg.baseUrl}${endpoint}`;
    
    const headers = {};
    if (method === 'POST') headers['Content-Type'] = 'application/json';
    if (cfg.authHeader) headers[cfg.authHeader] = cfg.authFormat(cfg.apiKey);

    const res = await fetch(url, {
      method: method,
      headers,
      body: method === 'POST' && body ? JSON.stringify(body) : undefined
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Proxy failed', details: err.message }), { status: 500 });
  }
}
