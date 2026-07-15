import { NextResponse } from 'next/server';

// Response envelope matches the legacy Express API: { success, data|message, errors? }
export function ok(data: unknown, status = 200, message?: string) {
  return NextResponse.json(
    message === undefined ? { success: true, data } : { success: true, message, data },
    { status }
  );
}

export function fail(message: string, status = 500, errors?: unknown) {
  return NextResponse.json(
    errors === undefined ? { success: false, message } : { success: false, message, errors },
    { status }
  );
}

export function serverError(error: unknown, message = 'Server error') {
  console.error(message, error);
  return fail(message, 500);
}
