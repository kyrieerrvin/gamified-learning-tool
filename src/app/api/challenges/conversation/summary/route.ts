import { NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/lib/config';

export async function GET() {
  try {
    const apiUrl = `${API_ENDPOINTS.API_BASE_URL}/api/conversation/summary`;
    const resp = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });
    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      return NextResponse.json({ error: 'Upstream error', details: errText }, { status: resp.status });
    }
    const data = await resp.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: 'Unexpected error', details: e?.message || String(e) }, { status: 500 });
  }
}


