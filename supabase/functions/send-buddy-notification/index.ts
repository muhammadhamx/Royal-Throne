import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

interface PushMessage {
  to: string
  title: string
  body: string
  channelId?: string
  data?: Record<string, unknown>
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Create client with the user's JWT to verify identity
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { event_type, user_id, match_id } = await req.json()

    if (!event_type || !user_id || !match_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Verify the user is who they claim to be
    if (user.id !== user_id) {
      return new Response(JSON.stringify({ error: 'User mismatch' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Use service role to look up buddy info
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // Get the buddy match to find the other user
    const { data: match, error: matchError } = await adminClient
      .from('buddy_matches')
      .select('user_a, user_b')
      .eq('id', match_id)
      .is('ended_at', null)
      .single()

    if (matchError || !match) {
      return new Response(JSON.stringify({ error: 'Match not found or ended' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Determine the buddy (the other user in the match)
    const buddyId = match.user_a === user_id ? match.user_b : match.user_a

    // Get buddy's push token and sender's display name
    const [buddyResult, senderResult] = await Promise.all([
      adminClient.from('profiles').select('expo_push_token').eq('id', buddyId).single(),
      adminClient.from('profiles').select('display_name, avatar_emoji').eq('id', user_id).single(),
    ])

    const pushToken = buddyResult.data?.expo_push_token
    if (!pushToken) {
      return new Response(JSON.stringify({ ok: true, sent: false, reason: 'no_token' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const senderName = senderResult.data?.display_name || 'Your buddy'
    const senderEmoji = senderResult.data?.avatar_emoji || '💩'

    // Build notification based on event type
    let title: string
    let body: string

    switch (event_type) {
      case 'session_started':
        title = `${senderEmoji} ${senderName} is on the throne!`
        body = 'Your poop buddy just started a session. Join them!'
        break
      case 'session_ended':
        title = `${senderEmoji} ${senderName} finished a session`
        body = 'Your poop buddy just wrapped up. How about you?'
        break
      case 'buddy_matched':
        title = `🤝 New Poop Buddy!`
        body = `You've been matched with ${senderName}! Say hi!`
        break
      default:
        return new Response(JSON.stringify({ error: 'Invalid event_type' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
    }

    // Send via Expo Push API
    const pushMessage: PushMessage = {
      to: pushToken,
      title,
      body,
      channelId: 'social',
      data: { match_id, event_type },
    }

    const pushResponse = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(pushMessage),
    })

    const pushResult = await pushResponse.json()

    return new Response(JSON.stringify({ ok: true, sent: true, result: pushResult }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
