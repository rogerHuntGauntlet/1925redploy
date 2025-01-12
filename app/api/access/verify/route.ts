import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Initialize service role client for admin operations
const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  console.log('🚀 Starting POST request to /api/access/verify');
  try {
    console.log('📝 Creating cookie store and Supabase client');
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const body = await req.json();
    const { code, riddleAnswer, termsAccepted } = body;
    console.log('📦 Request body:', { code, riddleAnswer, termsAccepted });

    // Get current user
    console.log('🔍 Getting user session');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      return NextResponse.json({ error: 'Session error', details: sessionError }, { status: 401 });
    }
    if (!session) {
      console.log('❌ No session found');
      return NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 });
    }
    console.log('✅ User session found:', { userId: session.user.id });

    // Check if user already has access
    console.log('🔍 Checking existing access');
    const { data: existingAccess, error: accessError } = await serviceClient
      .from('access_records')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single();

    if (accessError && accessError.code !== 'PGRST116') {
      console.error('❌ Access check error:', accessError);
      return NextResponse.json({ 
        error: 'Error checking access', 
        details: accessError 
      }, { status: 500 });
    }

    if (existingAccess) {
      console.log('✅ User already has access');
      return NextResponse.json({ success: true, message: 'Access already granted' });
    }

    // If founder code provided
    if (code) {
      console.log('🎫 Processing founder code');
      if (!termsAccepted) {
        console.log('❌ Terms not accepted');
        return NextResponse.json({ error: 'You must accept the terms and conditions' }, { status: 400 });
      }

      // Check if user already used a founder code
      console.log('🔍 Checking previous founder code usage');
      const { data: existingFounderCode, error: founderCheckError } = await serviceClient
        .from('founder_codes')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (founderCheckError && founderCheckError.code !== 'PGRST116') {
        console.error('❌ Founder code check error:', founderCheckError);
        return NextResponse.json({ 
          error: 'Error checking founder code', 
          details: founderCheckError 
        }, { status: 500 });
      }

      if (existingFounderCode) {
        console.log('✅ User already has founder access');
        return NextResponse.json({ 
          success: true, 
          message: 'Access already granted via founder code'
        });
      }

      // Check total founder codes used
      console.log('🔢 Checking total founder codes used');
      const { data: codeCount, error: countError } = await serviceClient
        .from('founder_code_count')
        .select('id, total_used, max_allowed')
        .single();

      if (countError) {
        console.error('❌ Code count error:', countError);
        return NextResponse.json({ 
          error: 'Error checking code count', 
          details: countError 
        }, { status: 500 });
      }

      if (!codeCount) {
        console.error('❌ No code count record found');
        return NextResponse.json({ 
          error: 'No code count record found'
        }, { status: 500 });
      }

      if (codeCount.total_used >= codeCount.max_allowed) {
        console.log('❌ All founder codes claimed');
        return NextResponse.json({ error: 'All founder codes have been claimed' }, { status: 400 });
      }

      console.log('📝 Creating founder code record');
      const { data: founderCode, error: codeError } = await serviceClient
        .from('founder_codes')
        .insert({
          code,
          user_id: session.user.id,
          used_at: new Date().toISOString()
        })
        .select()
        .single();

      if (codeError) {
        console.error('❌ Founder code creation error:', codeError);
        return NextResponse.json({ 
          error: 'Error recording founder code', 
          details: codeError 
        }, { status: 500 });
      }

      console.log('📝 Updating code count', { 
        id: codeCount.id, 
        currentTotal: codeCount.total_used 
      });
      
      const { error: updateError } = await serviceClient
        .from('founder_code_count')
        .update({ total_used: codeCount.total_used + 1 })
        .eq('id', codeCount.id)
        .single();

      if (updateError) {
        console.error('❌ Count update error:', updateError);
        return NextResponse.json({ 
          error: 'Error updating code count', 
          details: updateError 
        }, { status: 500 });
      }

      console.log('📝 Creating access record');
      const { error: accessCreateError } = await serviceClient
        .from('access_records')
        .insert({
          user_id: session.user.id,
          access_type: 'founder_code',
          reference_id: founderCode.id
        });

      if (accessCreateError) {
        console.error('❌ Access record creation error:', accessCreateError);
        return NextResponse.json({ 
          error: 'Error creating access record', 
          details: accessCreateError 
        }, { status: 500 });
      }

      console.log('✅ Founder code process complete');
      return NextResponse.json({ 
        success: true, 
        message: 'Founder code accepted',
        remainingCodes: codeCount.max_allowed - (codeCount.total_used + 1)
      });
    }

    // If riddle answer provided
    if (riddleAnswer) {
      console.log('🧩 Processing riddle answer');
      const correctAnswer = process.env.RIDDLE_ANSWER || 'keyboard';
      console.log('🔍 Checking riddle answer:', { 
        provided: riddleAnswer.toLowerCase().trim(), 
        correct: correctAnswer.toLowerCase() 
      });
      
      if (riddleAnswer.toLowerCase().trim() === correctAnswer.toLowerCase()) {
        console.log('✅ Riddle answered correctly');
        
        console.log('📝 Recording riddle completion');
        const { data: riddleCompletion, error: riddleError } = await serviceClient
          .from('riddle_completions')
          .insert({
            user_id: session.user.id
          })
          .select()
          .single();

        if (riddleError) {
          console.error('❌ Riddle completion error:', riddleError);
          return NextResponse.json({ 
            error: 'Error recording riddle completion', 
            details: riddleError 
          }, { status: 500 });
        }

        console.log('📝 Creating access record');
        const { error: accessError } = await serviceClient
          .from('access_records')
          .insert({
            user_id: session.user.id,
            access_type: 'riddle',
            reference_id: riddleCompletion?.id
          });

        if (accessError) {
          console.error('❌ Access record creation error:', accessError);
          return NextResponse.json({ 
            error: 'Error creating access record', 
            details: accessError 
          }, { status: 500 });
        }

        console.log('✅ Riddle process complete');
        return NextResponse.json({ success: true, message: 'Riddle solved correctly' });
      }

      console.log('❌ Incorrect riddle answer');
      return NextResponse.json({ error: 'Incorrect riddle answer' }, { status: 400 });
    }

    console.log('❌ Invalid request - no code or riddle answer provided');
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('❌ Unhandled error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 