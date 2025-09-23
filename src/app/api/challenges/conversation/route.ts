// src/app/api/challenges/conversation/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const message = body?.message ?? '';
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }
    const apiUrl = `${API_ENDPOINTS.API_BASE_URL}/api/conversation/chat`;
    const resp = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ message }),
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

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}




