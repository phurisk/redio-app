const STREAM_SOURCE_URL =
  process.env.STREAM_SOURCE_URL || 'http://localhost:8000/radio.mp3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!STREAM_SOURCE_URL) {
    return new Response('Stream URL not configured', { status: 500 });
  }

  try {
    const upstream = await fetch(STREAM_SOURCE_URL, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'redio-player/1.0',
      },
    });

    if (!upstream.ok || !upstream.body) {
      return new Response('Unable to reach stream source', {
        status: upstream.status || 502,
      });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'audio/mpeg',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Stream proxy error:', error);
    return new Response('Stream unavailable', { status: 502 });
  }
}
