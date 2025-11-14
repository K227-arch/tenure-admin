import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Verify authentication
  const cookieHeader = request.headers.get('cookie');
  const tokenMatch = cookieHeader?.match(/admin_token=([^;]+)/);
  const token = tokenMatch?.[1];

  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    verify(token, JWT_SECRET);
  } catch {
    return new Response('Invalid token', { status: 401 });
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

      // Set up Supabase real-time subscription
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const channel = supabase
        .channel('admin_activity_realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'admin_activity_logs'
          },
          async (payload) => {
            // Fetch complete activity data with admin info
            const { data: activity } = await supabase
              .from('admin_activity_logs')
              .select(`
                *,
                admin:admin_id (
                  id,
                  email,
                  name
                )
              `)
              .eq('id', payload.new.id)
              .single();

            if (activity) {
              const message = `data: ${JSON.stringify({ type: 'activity', data: activity })}\n\n`;
              try {
                controller.enqueue(encoder.encode(message));
              } catch (error) {
                console.error('Failed to send activity:', error);
              }
            }
          }
        )
        .subscribe();

      // Keep connection alive with heartbeat
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeat);
          channel.unsubscribe();
        }
      }, 30000); // Every 30 seconds

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        channel.unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
