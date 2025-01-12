import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const errorReport = await request.json();

    // In a real application, you would:
    // 1. Validate the error report data
    // 2. Store it in a database
    // 3. Potentially notify developers
    // 4. Maybe integrate with error tracking services like Sentry

    // For now, we'll just log it in production
    if (process.env.NODE_ENV === 'production') {
      console.error('Error Report:', {
        message: errorReport.message,
        componentStack: errorReport.componentStack,
        timestamp: errorReport.timestamp,
        url: errorReport.url,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing error report:', error);
    return NextResponse.json(
      { error: 'Failed to process error report' },
      { status: 500 }
    );
  }
} 