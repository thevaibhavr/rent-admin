import { NextResponse } from 'next/server';

// The Express customers router forwards errors via next(error) to the global
// handler in server.js, which returns this exact shape with status 500.
export function unhandledError(error: unknown) {
  console.error(error instanceof Error ? error.stack : error);
  const message = error instanceof Error ? error.message : 'Internal server error';
  return NextResponse.json(
    {
      success: false,
      message: 'Something went wrong!',
      error: process.env.NODE_ENV === 'development' ? message : 'Internal server error',
    },
    { status: 500 }
  );
}
