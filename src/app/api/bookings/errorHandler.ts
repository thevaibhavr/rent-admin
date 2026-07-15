import { NextResponse } from 'next/server';

// Port of the Express global error handler in server.js — every `next(error)` in
// routes/bookings.js landed here. Envelope byte-compatible:
// { success: false, message: 'Something went wrong!', error: <dev ? err.message : 'Internal server error'> }
export function expressError(err: unknown) {
  console.error(err instanceof Error ? err.stack : err);
  return NextResponse.json(
    {
      success: false,
      message: 'Something went wrong!',
      error:
        process.env.NODE_ENV === 'development'
          ? err instanceof Error
            ? err.message
            : String(err)
          : 'Internal server error',
    },
    { status: 500 }
  );
}
