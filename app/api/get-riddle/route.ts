import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { generateCrosswordClue } from '@/lib/crossword';

const ATTEMPTS_ALLOWED = 3;

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get a crossword clue (will always be hard now)
    const { word, clue, difficulty } = await generateCrosswordClue();
    
    // Store the answer in user metadata
    await supabase
      .from('user_metadata')
      .upsert({
        user_id: session.user.id,
        riddle_answer: word,
        attempts_remaining: ATTEMPTS_ALLOWED,
        created_at: new Date().toISOString()
      });

    // Only send the clue to the client, not the answer
    return NextResponse.json({ 
      clue,
      difficulty, // Will always be 'hard'
      maxAttempts: ATTEMPTS_ALLOWED
    });
  } catch (error) {
    console.error('Error getting riddle:', error);
    return new NextResponse('Error getting riddle', { status: 500 });
  }
} 