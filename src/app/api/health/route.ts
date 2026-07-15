import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/health — Health check (public)
// Response shape ported verbatim from rent-moment-backend/server.js
export async function GET() {
  return NextResponse.json({ status: 'OK', message: 'Server is running' });
}
