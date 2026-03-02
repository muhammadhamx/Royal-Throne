import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRandomItem } from '@/humor/jokes';
import type { UserContext } from './notificationTemplates';
import { selectCategories } from './notificationScorer';
import { generateUniqueNotification, clearDedupCache } from './notificationDedup';
import { clearScorerState } from './notificationScorer';
import { supabase } from './supabase';

const NOTIFICATIONS_ENABLED_KEY = '@notifications_enabled';
const ENGAGEMENT_SCHEDULED_KEY = '@engagement_scheduled_date';
const STREAK_SCHEDULED_KEY = '@streak_risk_scheduled_date';
const SESSION_NOTIFICATION_ID = 'active-session';

let _module: any = null;
let _initialized = false;

// Only load the module when we actually need it (avoids Expo Go console error on startup)
function getNotifications() {
  if (!_module) {
    _module = require('expo-notifications');
  }
  return _module as typeof import('expo-notifications');
}

async function ensureInitialized() {
  if (_initialized || Platform.OS === 'web') return;
  _initialized = true;

  const Notifications = getNotifications();

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: false,
      shouldShowList: false,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('session', {
      name: 'Active Session',
      description: 'Shows when a poop session is in progress',
      importance: Notifications.AndroidImportance.LOW,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: undefined,
      enableVibrate: false,
    });
    await Notifications.setNotificationChannelAsync('engagement', {
      name: 'Tips & Fun',
      description: 'Funny tips, health advice, and poop facts',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
    await Notifications.setNotificationChannelAsync('social', {
      name: 'Buddy Activity',
      description: 'Notifications when your poop buddy starts or finishes a session',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    await ensureInitialized();
    const Notifications = getNotifications();
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function isNotificationsEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
  return val !== 'false';
}

// ============ SESSION NOTIFICATION (persistent timer) ============

const SESSION_MESSAGES = [
  'Still going strong!',
  'The throne awaits your return.',
  'Your royal session continues.',
  'Tap to check your timer.',
  'A true throne sitter.',
  'Taking your sweet time.',
];

export async function showSessionNotification(startTime: number) {
  if (Platform.OS === 'web') return;

  try {
    await ensureInitialized();
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const Notifications = getNotifications();

    const elapsed = Date.now() - startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

    await Notifications.scheduleNotificationAsync({
      identifier: SESSION_NOTIFICATION_ID,
      content: {
        title: `🚽 Session Active — ${timeStr}`,
        body: getRandomItem(SESSION_MESSAGES),
        sticky: Platform.OS === 'android',
        autoDismiss: false,
        ...(Platform.OS === 'android' && { channelId: 'session' }),
      },
      trigger: null,
    });
  } catch {
    // Gracefully fail
  }
}

export async function dismissSessionNotification() {
  if (Platform.OS === 'web') return;
  try {
    const Notifications = getNotifications();
    await Notifications.dismissNotificationAsync(SESSION_NOTIFICATION_ID);
    await Notifications.cancelScheduledNotificationAsync(SESSION_NOTIFICATION_ID);
  } catch {
    // Notification may not exist
  }
}

// ============ BUILD USER CONTEXT ============

/**
 * Assemble UserContext from all Zustand stores + optional community RPC.
 */
export async function buildUserContext(): Promise<UserContext> {
  // Lazy imports to avoid circular deps
  const { useGamificationStore } = require('@/stores/gamificationStore');
  const { useSessionStore } = require('@/stores/sessionStore');
  const { useCreditsStore } = require('@/stores/creditsStore');
  const { useLeagueStore } = require('@/stores/leagueStore');
  const { useChatStore } = require('@/stores/chatStore');

  const gamification = useGamificationStore.getState();
  const sessions = useSessionStore.getState();
  const credits = useCreditsStore.getState();
  const leagues = useLeagueStore.getState();
  const chat = useChatStore.getState();

  // Compute lastSessionHoursAgo
  let lastSessionHoursAgo: number | null = null;
  if (sessions.sessions.length > 0) {
    const lastSession = sessions.sessions[0]; // sorted by most recent
    const lastTime = new Date(lastSession.started_at).getTime();
    lastSessionHoursAgo = (Date.now() - lastTime) / (1000 * 60 * 60);
  }

  // Today's sessions
  const today = new Date().toISOString().slice(0, 10);
  const todaySessions = sessions.sessions.filter(
    (s: any) => s.started_at.slice(0, 10) === today,
  ).length;

  // Daily challenges data
  const dailyChallenges = gamification.dailyChallenges;
  const dailyChallengesCompleted = dailyChallenges?.completed?.length ?? 0;
  const totalChallenges = dailyChallenges?.challengeIds?.length ?? 3;

  // XP to next rank
  const xpProgress = gamification.xpProgress;
  const xpToNextRank = xpProgress.needed - xpProgress.current;

  // Community stats (best-effort, don't block on failure)
  let communityStats: {
    activeSessions?: number;
    globalSessionsToday?: number;
    totalUsers?: number;
    leagueRank?: number;
    buddyLastActivity?: string | null;
  } = {};

  try {
    const { useAuthStore } = require('@/stores/authStore');
    const userId = useAuthStore.getState().user?.id;
    if (userId) {
      const { data } = await supabase.rpc('get_community_stats', {
        p_user_id: userId,
      });
      if (data) {
        communityStats = {
          activeSessions: data.active_sessions,
          globalSessionsToday: data.global_sessions_today,
          totalUsers: data.total_users,
          leagueRank: data.league_rank,
          buddyLastActivity: data.buddy_last_activity,
        };
      }
    }
  } catch {
    // Community stats are optional
  }

  return {
    xp: gamification.xp,
    streakCount: gamification.streak.count,
    rankName: gamification.rank.name,
    nextRankName: gamification.nextRank?.name ?? null,
    xpToNextRank,
    dailyChallengesCompleted,
    totalChallenges,
    freezesRemaining: gamification.streak.freezesRemaining,
    totalSessions: sessions.sessions.length,
    todaySessions,
    lastSessionHoursAgo,
    credits: credits.credits,
    leagueCount: leagues.leagues.length,
    leagueName: leagues.leagues.length > 0 ? leagues.leagues[0].name : null,
    activePoopersCount: chat.activePoopersCount,
    hasBuddy: !!chat.currentMatch,
    ...communityStats,
  };
}

// ============ SMART ENGAGEMENT NOTIFICATIONS ============

export async function scheduleSmartEngagementNotifications() {
  if (Platform.OS === 'web') return;

  try {
    const enabled = await isNotificationsEnabled();
    if (!enabled) return;

    // Only re-schedule once per day
    const today = new Date().toISOString().slice(0, 10);
    const lastScheduled = await AsyncStorage.getItem(ENGAGEMENT_SCHEDULED_KEY);
    if (lastScheduled === today) return;

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    await cancelEngagementNotifications();

    const Notifications = getNotifications();

    // Build context and select categories via ML scorer
    const ctx = await buildUserContext();
    const categories = await selectCategories(ctx, 3);

    const windows = [
      { minHour: 7, maxHour: 9 },
      { minHour: 12, maxHour: 14 },
      { minHour: 19, maxHour: 21 },
    ];

    for (let i = 0; i < windows.length; i++) {
      const w = windows[i];
      const hour = w.minHour + Math.floor(Math.random() * (w.maxHour - w.minHour));
      const minute = Math.floor(Math.random() * 60);

      // Generate unique notification from the selected category
      const notification = await generateUniqueNotification(categories[i], ctx);
      if (!notification) continue;

      await Notifications.scheduleNotificationAsync({
        identifier: `engagement-${i}`,
        content: {
          title: notification.title,
          body: notification.body,
          ...(Platform.OS === 'android' && { channelId: 'engagement' }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
    }

    await AsyncStorage.setItem(ENGAGEMENT_SCHEDULED_KEY, today);
  } catch {
    // Gracefully fail
  }
}

export async function cancelEngagementNotifications() {
  if (Platform.OS === 'web') return;
  for (let i = 0; i < 3; i++) {
    try {
      const Notifications = getNotifications();
      await Notifications.cancelScheduledNotificationAsync(`engagement-${i}`);
    } catch {
      // Ignore
    }
  }
}

// ============ SMART STREAK NOTIFICATION ============

const STREAK_RISK_ID = 'streak-risk';

export async function scheduleSmartStreakNotification(streakCount: number) {
  if (Platform.OS === 'web' || streakCount <= 0) return;

  try {
    const today = new Date().toISOString().slice(0, 10);
    const lastScheduled = await AsyncStorage.getItem(STREAK_SCHEDULED_KEY);
    if (lastScheduled === today) return;

    await ensureInitialized();
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const Notifications = getNotifications();
    await Notifications.cancelScheduledNotificationAsync(STREAK_RISK_ID).catch(() => {});

    // Build context for personalized streak message
    const ctx = await buildUserContext();
    const notification = await generateUniqueNotification('streak', ctx);

    const title = notification?.title ?? `🔥 Streak at Risk!`;
    const body = notification?.body
      ?? `Your ${streakCount}-day streak needs you! Log a session before midnight.`;

    await Notifications.scheduleNotificationAsync({
      identifier: STREAK_RISK_ID,
      content: {
        title,
        body,
        ...(Platform.OS === 'android' && { channelId: 'engagement' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 20,
        minute: 0,
      },
    });

    await AsyncStorage.setItem(STREAK_SCHEDULED_KEY, today);
  } catch {
    // Gracefully fail
  }
}

export async function cancelStreakRiskNotification() {
  if (Platform.OS === 'web') return;
  try {
    const Notifications = getNotifications();
    await Notifications.cancelScheduledNotificationAsync(STREAK_RISK_ID);
  } catch {
    // Ignore
  }
}

// ============ WEEKLY RECAP NOTIFICATION ============

const WEEKLY_RECAP_ID = 'weekly-recap';
const WEEKLY_RECAP_SCHEDULED_KEY = '@weekly_recap_scheduled_date';

export async function scheduleWeeklyRecapNotification() {
  if (Platform.OS === 'web') return;

  try {
    const today = new Date().toISOString().slice(0, 10);
    const lastScheduled = await AsyncStorage.getItem(WEEKLY_RECAP_SCHEDULED_KEY);
    if (lastScheduled === today) return;

    await ensureInitialized();
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const Notifications = getNotifications();

    await Notifications.cancelScheduledNotificationAsync(WEEKLY_RECAP_ID).catch(() => {});

    await Notifications.scheduleNotificationAsync({
      identifier: WEEKLY_RECAP_ID,
      content: {
        title: '📊 Your Weekly Royal Throne Report',
        body: "Your throne stats for the week are ready! Open the app to see how you did.",
        ...(Platform.OS === 'android' && { channelId: 'engagement' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 1, // Sunday
        hour: 19,
        minute: 0,
      },
    });

    await AsyncStorage.setItem(WEEKLY_RECAP_SCHEDULED_KEY, today);
  } catch {
    // Gracefully fail
  }
}

// ============ PUSH TOKEN REGISTRATION ============

/**
 * Get the Expo push token and store it in the user's profile.
 */
export async function registerPushToken(userId: string): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await ensureInitialized();
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const Notifications = getNotifications();
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    if (token) {
      await supabase
        .from('profiles')
        .update({ expo_push_token: token })
        .eq('id', userId);
    }
  } catch {
    // Push token registration is best-effort
  }
}

// ============ BUDDY PUSH NOTIFICATIONS ============

type BuddyEventType = 'session_started' | 'session_ended' | 'buddy_matched';

/**
 * Send a push notification to the user's active buddy via Edge Function.
 */
export async function notifyBuddy(eventType: BuddyEventType): Promise<void> {
  try {
    const { useAuthStore } = require('@/stores/authStore');
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    const { useChatStore } = require('@/stores/chatStore');
    const match = useChatStore.getState().currentMatch;
    if (!match) return;

    await supabase.functions.invoke('send-buddy-notification', {
      body: {
        event_type: eventType,
        user_id: userId,
        match_id: match.id,
      },
    });
  } catch {
    // Buddy notifications are best-effort
  }
}

// ============ CLEANUP ============

/**
 * Clear all notification-related caches (on account reset/delete).
 */
export async function clearNotificationCaches(): Promise<void> {
  await Promise.all([
    clearDedupCache(),
    clearScorerState(),
    AsyncStorage.removeItem(ENGAGEMENT_SCHEDULED_KEY).catch(() => {}),
    AsyncStorage.removeItem(STREAK_SCHEDULED_KEY).catch(() => {}),
    AsyncStorage.removeItem(WEEKLY_RECAP_SCHEDULED_KEY).catch(() => {}),
  ]);
}
