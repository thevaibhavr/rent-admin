import { NextResponse } from 'next/server';

// Port of the Express global error handler in server.js — every `next(error)` in
// routes/bookings.js landed here. Envelope byte-compatible:
// { success: false, message: 'Something went wrong!', error: <real reason> }
// The real reason is always returned (this is an authenticated admin API) so the
// dashboard can show actionable errors instead of a generic "Internal server error".
export function expressError(err: unknown) {
  console.error(err instanceof Error ? err.stack : err);
  return NextResponse.json(
    {
      success: false,
      message: 'Something went wrong!',
      error:
        err instanceof Error
          ? err.message
          : typeof err === 'string'
            ? err
            : 'Internal server error',
    },
    { status: 500 }
  );
}
