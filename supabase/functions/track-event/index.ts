// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ALLOWED_EVENTS = [
  'share_initiated',
  'referral_click',
  'referral_signup',
  'daily_return',
  'shared_devotional_viewed',
  'referred_user_shared'
];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // We use the service key to bypass RLS for inserting into app_events
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const payload = await req.json()
    const { event_name, anonymous_id, metadata } = payload

    if (!event_name || !ALLOWED_EVENTS.includes(event_name)) {
      return new Response(JSON.stringify({ error: 'Invalid or missing event_name' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Cap metadata size (basic protection)
    if (metadata && JSON.stringify(metadata).length > 2048) {
      return new Response(JSON.stringify({ error: 'Metadata too large' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Try to get user_id from the authorization header JWT
    let user_id = null;
    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      // Create a client with the user's JWT to verify it
      const userSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } }
      })
      const { data: { user }, error } = await userSupabase.auth.getUser()
      if (!error && user) {
        user_id = user.id
      }
    }

    // Insert the event
    const { error: insertError } = await supabase
      .from('app_events')
      .insert({
        event_name,
        user_id,
        anonymous_id: anonymous_id || null,
        metadata: metadata || {}
      })

    if (insertError) {
      console.error('Error inserting event:', insertError)
      throw insertError
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
