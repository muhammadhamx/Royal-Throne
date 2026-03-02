-- Add expo push token to profiles for buddy push notifications
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

-- Community stats RPC for smart notification context
CREATE OR REPLACE FUNCTION get_community_stats(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  v_active_sessions INT;
  v_global_sessions_today INT;
  v_total_users INT;
  v_league_rank INT;
  v_buddy_last_activity TIMESTAMPTZ;
BEGIN
  -- Count currently active sessions
  SELECT COUNT(*)
  INTO v_active_sessions
  FROM profiles
  WHERE is_in_session = TRUE;

  -- Count sessions started today (UTC)
  SELECT COUNT(*)
  INTO v_global_sessions_today
  FROM sessions
  WHERE started_at::DATE = CURRENT_DATE;

  -- Total registered users
  SELECT COUNT(*)
  INTO v_total_users
  FROM profiles;

  -- User's rank in their first league (if any)
  SELECT rank_position
  INTO v_league_rank
  FROM (
    SELECT
      lm.user_id,
      ROW_NUMBER() OVER (ORDER BY COALESCE(p.xp, 0) DESC) AS rank_position
    FROM league_members lm
    JOIN profiles p ON p.id = lm.user_id
    WHERE lm.league_id = (
      SELECT league_id FROM league_members WHERE user_id = p_user_id LIMIT 1
    )
  ) ranked
  WHERE ranked.user_id = p_user_id;

  -- Buddy's last activity
  SELECT
    CASE
      WHEN bm.user_a = p_user_id THEN pb.updated_at
      ELSE pa.updated_at
    END
  INTO v_buddy_last_activity
  FROM buddy_matches bm
  LEFT JOIN profiles pa ON pa.id = bm.user_a
  LEFT JOIN profiles pb ON pb.id = bm.user_b
  WHERE (bm.user_a = p_user_id OR bm.user_b = p_user_id)
    AND bm.ended_at IS NULL
  ORDER BY bm.created_at DESC
  LIMIT 1;

  result := json_build_object(
    'active_sessions', COALESCE(v_active_sessions, 0),
    'global_sessions_today', COALESCE(v_global_sessions_today, 0),
    'total_users', COALESCE(v_total_users, 0),
    'league_rank', v_league_rank,
    'buddy_last_activity', v_buddy_last_activity
  );

  RETURN result;
END;
$$;
