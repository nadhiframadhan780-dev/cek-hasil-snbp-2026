export const config = { runtime: 'edge' };

export default async function handler(req) {
  // Hanya izinkan GET
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { searchParams } = new URL(req.url);
  const path = searchParams.get('path');

  if (!path) {
    return new Response('Missing path', { status: 400 });
  }

  // Hanya izinkan fetch ke domain SNPMB
  const ALLOWED_BASE = 'https://pengumuman-snbp.snpmb.id/static/';
  if (!path.startsWith(ALLOWED_BASE)) {
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const upstream = await fetch(path, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SNBP-Checker/1.0)',
        'Referer': 'https://pengumuman-snbp.snpmb.id/',
        'Origin': 'https://pengumuman-snbp.snpmb.id',
      },
      // Jangan cache di edge supaya data selalu fresh
      cache: 'no-store',
    });

    if (upstream.status === 404) {
      return new Response(JSON.stringify({ notfound: true }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (!upstream.ok) {
      return new Response(JSON.stringify({ error: `Upstream error: ${upstream.status}` }), {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const data = await upstream.text();

    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
