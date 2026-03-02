import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  Pressable,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import { getProfile, updateProfile, syncGamificationUp, type GamificationSyncData } from '@/lib/database';
import { linkEmail, deleteAccount } from '@/lib/auth';
import { useAchievements } from '@/hooks/useAchievements';
import { useConfetti } from '@/contexts/ConfettiContext';
import { XPProgressBar } from '@/components/ui/XPProgressBar';
import {
  THRONE_TITLES,
  LOCKED_AVATARS,
  isAvatarUnlocked,
  getUnlockedTitles,
  getSelectedTitle,
  setSelectedTitle as persistSelectedTitle,
  type TitleCheckContext,
} from '@/gamification/cosmetics';
import { useSessionStore } from '@/stores/sessionStore';
import { useCreditsStore } from '@/stores/creditsStore';
import type { Profile } from '@/types/database';
import { COLORS, GRADIENTS, SHADOWS, RADIUS, SPACING } from '@/utils/constants';
import {
  scheduleSmartEngagementNotifications,
  cancelEngagementNotifications,
} from '@/lib/notifications';

const NOTIFICATIONS_ENABLED_KEY = '@notifications_enabled';
const BASE_AVATAR_EMOJIS = ['💩', '🚽', '📰', '🧻', '👑', '🦆', '🐻', '🌟', '🎯', '🔥', '🌈', '🍀'];
const LOCKED_AVATAR_EMOJIS = LOCKED_AVATARS.map((a) => a.emoji);

// ─── Section header ────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={styles.sectionTitle}>{title}</Text>
  );
}

// ─── Setting row (toggle/button) ──────────────────────────────────────────

function SettingRow({
  icon,
  label,
  description,
  right,
}: {
  icon: string;
  label: string;
  description?: string;
  right: React.ReactNode;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>
        <Text style={styles.settingIconText}>{icon}</Text>
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && <Text style={styles.settingDesc}>{description}</Text>}
      </View>
      {right}
    </View>
  );
}

// ─── Main Settings Screen ─────────────────────────────────────────────────

export default function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const { rank, xp, xpProgress, initialize: initGamification, isLoaded: gamificationLoaded } = useGamificationStore();
  const { achievements, unlockedIds, newlyUnlockedQueue, dismissNewlyUnlocked, unlockedCount, totalCount } = useAchievements();
  const { fire: fireConfetti } = useConfetti();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('💩');
  const [isSaving, setIsSaving] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showLinkEmail, setShowLinkEmail] = useState(false);
  const [linkEmailValue, setLinkEmailValue] = useState('');
  const [linkPasswordValue, setLinkPasswordValue] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedTitleId, setSelectedTitleId] = useState('the_newbie');
  const sessions = useSessionStore((s) => s.sessions);

  const hasEmailIdentity = user?.identities?.some((i) => i.provider === 'email') ?? false;
  const pendingEmail = (user as any)?.new_email || (user as any)?.email_change || user?.user_metadata?.email;
  const hasEmail = !!user?.email || !!pendingEmail;
  const isAnonymous = !hasEmail && !hasEmailIdentity && user?.is_anonymous !== false;
  const linkedEmail = user?.email
    || pendingEmail
    || user?.identities?.find((i) => i.provider === 'email')?.identity_data?.email as string | undefined
    || null;

  const appVersion = Constants.expoConfig?.version ?? Constants.manifest2?.extra?.expoClient?.version ?? '1.0.0';

  const titleContext: TitleCheckContext = {
    totalSessions: sessions.length,
    currentStreak: useGamificationStore.getState().streak.count,
    totalXP: xp,
    hasSpeedrun: sessions.some((s) => s.duration_seconds != null && s.duration_seconds < 60),
    hasMarathon: sessions.some((s) => s.duration_seconds != null && s.duration_seconds > 1800),
    hasNightOwl: sessions.some((s) => {
      const h = new Date(s.started_at).getHours();
      return h >= 0 && h < 4;
    }),
    hasEarlyBird: sessions.some((s) => new Date(s.started_at).getHours() < 6),
    hasBuddyChat: false,
    rankId: rank.id,
  };

  const unlockedTitles = getUnlockedTitles(titleContext);
  const allAvatarEmojis = [...BASE_AVATAR_EMOJIS, ...LOCKED_AVATAR_EMOJIS];

  useEffect(() => {
    if (!gamificationLoaded) initGamification();
  }, [gamificationLoaded, initGamification]);

  useEffect(() => {
    getSelectedTitle().then(setSelectedTitleId);
  }, []);

  useEffect(() => {
    if (newlyUnlockedQueue.length > 0) {
      fireConfetti();
      const a = newlyUnlockedQueue[0];
      Alert.alert(
        `${a.emoji} Achievement Unlocked!`,
        `${a.name}\n\n"${a.flavor}"`,
        [{ text: 'Nice!', onPress: dismissNewlyUnlocked }]
      );
    }
  }, [newlyUnlockedQueue.length]);

  useEffect(() => {
    if (user?.id) {
      getProfile(user.id).then((p) => {
        if (p) {
          setProfile(p);
          setDisplayName(p.display_name);
          setSelectedEmoji(p.avatar_emoji);
        }
      });
    }
    AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY).then((val) => {
      if (val !== null) setNotificationsEnabled(val === 'true');
    });
  }, [user?.id]);

  const buildSyncData = async (): Promise<GamificationSyncData> => {
    const { xp: currentXP, streak } = useGamificationStore.getState();
    const [titleStr, titlesStr, achievementsStr, sessionCountStr] = await Promise.all([
      AsyncStorage.getItem('@throne_selected_title'),
      AsyncStorage.getItem('@throne_unlocked_titles'),
      AsyncStorage.getItem('@achievements_unlocked'),
      AsyncStorage.getItem('@throne_session_count'),
    ]);
    return {
      xp: currentXP,
      streakCount: streak.count,
      streakLastDate: streak.lastDate,
      streakFreezes: streak.freezesRemaining,
      selectedTitleId: titleStr ?? 'the_newbie',
      unlockedTitleIds: titlesStr ? JSON.parse(titlesStr) : ['the_newbie'],
      unlockedAchievementIds: achievementsStr ? JSON.parse(achievementsStr) : [],
      rewardSessionCount: sessionCountStr ? parseInt(sessionCountStr, 10) : 0,
    };
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      await updateProfile(user.id, {
        display_name: displayName.trim() || 'Anonymous Pooper',
        avatar_emoji: selectedEmoji,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved!', 'Your profile has been updated.');
    } catch {
      Alert.alert('Error', 'Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLinkEmail = async () => {
    if (!linkEmailValue.trim() || !linkPasswordValue.trim()) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    setIsLinking(true);
    try {
      const emailToLink = linkEmailValue.trim();
      const updatedUser = await linkEmail(emailToLink, linkPasswordValue.trim());
      if (updatedUser) {
        useAuthStore.setState({ user: updatedUser });
      }
      const userId = updatedUser?.id ?? user?.id;
      if (userId) {
        const syncData = await buildSyncData();
        await syncGamificationUp(userId, syncData).catch(() => {});
      }
      Alert.alert(
        'Email Linked!',
        `Your email ${emailToLink} has been linked. You can now sign in on any device.`
      );
      setShowLinkEmail(false);
      setLinkEmailValue('');
      setLinkPasswordValue('');
    } catch (err: any) {
      Alert.alert('Link Failed', err?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLinking(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      isAnonymous
        ? "You haven't linked an email — you will lose all your data. Are you sure?"
        : 'You can sign back in with your email to restore your data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await useGamificationStore.getState().reset();
            useSessionStore.getState().clearLocal();
            useCreditsStore.getState().reset();
            await signOut();
            router.replace('/(auth)/welcome');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you sure?',
              'Last chance — all sessions, stats, and chat history will be gone forever.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete Everything',
                  style: 'destructive',
                  onPress: async () => {
                    setIsDeleting(true);
                    try {
                      await deleteAccount();
                      await AsyncStorage.clear();
                      router.replace('/(auth)/welcome');
                    } catch {
                      setIsDeleting(false);
                      Alert.alert('Error', 'Failed to delete account. Please try again.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleNotificationToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, value.toString());
    if (value) {
      await scheduleSmartEngagementNotifications();
    } else {
      await cancelEngagementNotifications();
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen
        options={{
          title: 'Settings',
          headerStyle: { backgroundColor: COLORS.background },
          headerShadowVisible: false,
          headerTintColor: COLORS.text,
          headerTitleStyle: { fontWeight: '800', fontSize: 18, color: COLORS.text },
        }}
      />

      {/* ─── Profile ─── */}
      <SectionHeader title="Profile" />
      <Animated.View entering={FadeInDown.delay(50).duration(400).springify()} style={styles.card}>
        <Text style={styles.fieldLabel}>Display Name</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="person-outline" size={16} color={COLORS.textTertiary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Anonymous Pooper"
            placeholderTextColor={COLORS.textTertiary}
            maxLength={30}
          />
        </View>

        <Text style={[styles.fieldLabel, { marginTop: SPACING.md }]}>Avatar</Text>
        <View style={styles.emojiGrid}>
          {allAvatarEmojis.map((emoji) => {
            const unlocked = isAvatarUnlocked(emoji, rank.id);
            const lockedInfo = LOCKED_AVATARS.find((a) => a.emoji === emoji);
            const isSelected = selectedEmoji === emoji;
            return (
              <TouchableOpacity
                key={emoji}
                style={[
                  styles.emojiBtn,
                  isSelected && styles.emojiBtnSelected,
                  !unlocked && styles.emojiBtnLocked,
                ]}
                onPress={() => {
                  if (unlocked) {
                    setSelectedEmoji(emoji);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } else if (lockedInfo) {
                    Alert.alert('Locked', `Reach ${lockedInfo.rankName} to unlock this avatar.`);
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.emojiText, !unlocked && { opacity: 0.3 }]}>
                  {unlocked ? emoji : '🔒'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, isSaving && styles.btnDisabled]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={GRADIENTS.button}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveBtnGradient}
          >
            <Text style={styles.saveBtnText}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* ─── Throne Rank ─── */}
      <SectionHeader title="Throne Rank" />
      <Animated.View entering={FadeInDown.delay(100).duration(400).springify()} style={styles.card}>
        <View style={styles.rankRow}>
          <View style={styles.rankEmojiCircle}>
            <Text style={styles.rankEmoji}>{rank.emoji}</Text>
          </View>
          <View style={styles.rankInfo}>
            <Text style={styles.rankName}>{rank.name}</Text>
            <Text style={styles.rankDesc}>{rank.description}</Text>
          </View>
        </View>
        <View style={{ marginTop: SPACING.md }}>
          <XPProgressBar
            current={xpProgress.current}
            needed={xpProgress.needed}
            percentage={xpProgress.percentage}
            showLabel
          />
        </View>
        <Text style={styles.totalXP}>{xp.toLocaleString()} total XP</Text>
      </Animated.View>

      {/* ─── Throne Titles ─── */}
      <SectionHeader title="Throne Titles" />
      <Animated.View entering={FadeInDown.delay(150).duration(400).springify()} style={styles.card}>
        <Text style={styles.hintText}>Tap a title to equip it. Unlock more by playing!</Text>
        <View style={styles.titleGrid}>
          {THRONE_TITLES.map((title) => {
            const isUnlocked = unlockedTitles.some((t) => t.id === title.id);
            const isSelected = selectedTitleId === title.id;
            return (
              <TouchableOpacity
                key={title.id}
                style={[
                  styles.titleItem,
                  isSelected && styles.titleItemSelected,
                  !isUnlocked && styles.titleItemLocked,
                ]}
                onPress={async () => {
                  if (isUnlocked) {
                    setSelectedTitleId(title.id);
                    await persistSelectedTitle(title.id);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (user?.id) {
                      const syncData = await buildSyncData();
                      syncGamificationUp(user.id, syncData).catch(() => {});
                    }
                  } else {
                    Alert.alert(`🔒 ${title.name}`, `${title.unlockCondition}\n\n"${title.description}"`);
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.titleEmoji}>
                  {isUnlocked ? title.emoji : '🔒'}
                </Text>
                <Text
                  style={[
                    styles.titleName,
                    isSelected && styles.titleNameSelected,
                    !isUnlocked && styles.titleNameLocked,
                  ]}
                  numberOfLines={1}
                >
                  {title.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>

      {/* ─── Achievements ─── */}
      <SectionHeader title="Achievements" />
      <Animated.View entering={FadeInDown.delay(200).duration(400).springify()} style={styles.card}>
        <View style={styles.achievementsGrid}>
          {achievements.map((a) => {
            const isUnlocked = unlockedIds.includes(a.id);
            return (
              <TouchableOpacity
                key={a.id}
                style={[
                  styles.achievementItem,
                  isUnlocked && styles.achievementUnlocked,
                ]}
                onPress={() => {
                  Alert.alert(
                    `${a.emoji} ${a.name}`,
                    `${a.description}${isUnlocked ? `\n\n"${a.flavor}"` : '\n\nKeep going to unlock!'}`
                  );
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.achievementEmoji}>
                  {isUnlocked ? a.emoji : '🔒'}
                </Text>
                <Text
                  style={[styles.achievementName, !isUnlocked && styles.achievementNameLocked]}
                  numberOfLines={1}
                >
                  {a.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.achievementCountRow}>
          <Text style={styles.achievementCount}>{unlockedCount}/{totalCount} unlocked</Text>
          <View style={styles.achievementProgress}>
            <View
              style={[
                styles.achievementProgressFill,
                { width: `${(unlockedCount / totalCount) * 100}%` as any },
              ]}
            />
          </View>
        </View>
      </Animated.View>

      {/* ─── Notifications ─── */}
      <SectionHeader title="Notifications" />
      <Animated.View entering={FadeInDown.delay(250).duration(400).springify()} style={styles.card}>
        <SettingRow
          icon="🔔"
          label="Prediction Alerts"
          description="Get notified before your predicted session time"
          right={
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: COLORS.border, true: COLORS.accent + 'AA' }}
              thumbColor={notificationsEnabled ? COLORS.accent : COLORS.textTertiary}
              ios_backgroundColor={COLORS.border}
            />
          }
        />
      </Animated.View>

      {/* ─── Account ─── */}
      <SectionHeader title="Account" />
      <Animated.View entering={FadeInDown.delay(300).duration(400).springify()} style={styles.card}>
        {isAnonymous ? (
          <>
            <View style={styles.anonymousWarning}>
              <View style={styles.anonymousIconBg}>
                <Text style={styles.anonymousIcon}>⚠️</Text>
              </View>
              <View style={styles.anonymousInfo}>
                <Text style={styles.anonymousTitle}>Anonymous Account</Text>
                <Text style={styles.anonymousSub}>
                  Link an email to save your data across devices.
                </Text>
              </View>
            </View>

            {!showLinkEmail ? (
              <TouchableOpacity
                style={styles.linkBtn}
                onPress={() => setShowLinkEmail(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="mail-outline" size={16} color={COLORS.primaryDark} />
                <Text style={styles.linkBtnText}>Link Email Address</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.linkForm}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={16} color={COLORS.textTertiary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={linkEmailValue}
                    onChangeText={setLinkEmailValue}
                    placeholder="Email address"
                    placeholderTextColor={COLORS.textTertiary}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
                <View style={[styles.inputWrapper, { marginTop: SPACING.xs }]}>
                  <Ionicons name="lock-closed-outline" size={16} color={COLORS.textTertiary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { paddingRight: 40 }]}
                    value={linkPasswordValue}
                    onChangeText={setLinkPasswordValue}
                    placeholder="Password (min 6 chars)"
                    placeholderTextColor={COLORS.textTertiary}
                    secureTextEntry={!showPassword}
                  />
                  <Pressable
                    style={styles.passwordEye}
                    onPress={() => setShowPassword((v) => !v)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={16}
                      color={COLORS.textSecondary}
                    />
                  </Pressable>
                </View>
                <View style={styles.linkFormActions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setShowLinkEmail(false)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.linkBtn, { flex: 1, marginTop: 0 }, isLinking && styles.btnDisabled]}
                    onPress={handleLinkEmail}
                    disabled={isLinking}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.linkBtnText}>
                      {isLinking ? 'Linking...' : 'Link Email'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.signOutBtnText}>Sign Out</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.emailLinkedRow}>
              <View style={[styles.anonymousIconBg, { backgroundColor: COLORS.successBg }]}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              </View>
              <View style={styles.anonymousInfo}>
                <Text style={styles.anonymousTitle}>Email Linked</Text>
                <Text style={styles.anonymousSub}>{linkedEmail ?? 'Confirmed'}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.signOutBtnText}>Sign Out</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deleteBtn, isDeleting && styles.btnDisabled]}
              onPress={handleDeleteAccount}
              disabled={isDeleting}
            >
              <Ionicons name="trash-outline" size={16} color={COLORS.error} />
              <Text style={styles.deleteBtnText}>
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>

      {/* ─── About ─── */}
      <SectionHeader title="About" />
      <Animated.View entering={FadeInDown.delay(350).duration(400).springify()} style={styles.card}>
        <View style={styles.aboutRow}>
          <View style={styles.aboutAppIcon}>
            <Text style={styles.aboutAppEmoji}>👑</Text>
          </View>
          <View style={styles.aboutInfo}>
            <Text style={styles.aboutAppName}>Royal Throne</Text>
            <Text style={styles.aboutVersion}>v{appVersion}</Text>
          </View>
        </View>
        <Text style={styles.aboutTagline}>Built with love (and fiber).</Text>

        <View style={styles.aboutLinks}>
          <TouchableOpacity
            style={styles.aboutLinkRow}
            onPress={() => router.push('/about')}
            activeOpacity={0.7}
          >
            <Ionicons name="information-circle-outline" size={18} color={COLORS.accent} />
            <Text style={styles.aboutLinkText}>About Royal Throne</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
          </TouchableOpacity>

          <View style={styles.aboutLinkDivider} />

          <TouchableOpacity
            style={styles.aboutLinkRow}
            onPress={() => router.push('/privacy')}
            activeOpacity={0.7}
          >
            <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.accent} />
            <Text style={styles.aboutLinkText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
          </TouchableOpacity>

          <View style={styles.aboutLinkDivider} />

          <TouchableOpacity
            style={styles.aboutLinkRow}
            onPress={() => router.push('/contact')}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-outline" size={18} color={COLORS.accent} />
            <Text style={styles.aboutLinkText}>Contact & Feedback</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <View style={{ height: SPACING.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING['3xl'],
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: SPACING.xl,
    marginBottom: SPACING.xs + 2,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.subtle,
  },

  // Profile
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    letterSpacing: 0.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: SPACING.sm,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  emojiBtn: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiBtnSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent + '12',
  },
  emojiBtnLocked: {
    opacity: 0.5,
  },
  emojiText: {
    fontSize: 22,
  },
  saveBtn: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  saveBtnGradient: {
    paddingVertical: 13,
    alignItems: 'center',
  },
  saveBtnText: {
    color: COLORS.primaryDark,
    fontSize: 15,
    fontWeight: '800',
  },

  // Rank
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  rankEmojiCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  rankEmoji: {
    fontSize: 26,
  },
  rankInfo: {
    flex: 1,
  },
  rankName: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  rankDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontStyle: 'italic',
  },
  totalXP: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
  },

  // Titles
  hintText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginBottom: SPACING.sm,
  },
  titleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  titleItem: {
    width: '30.5%',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: 4,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  titleItemSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent + '10',
  },
  titleItemLocked: {
    opacity: 0.45,
  },
  titleEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  titleName: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  titleNameSelected: {
    color: COLORS.accent,
  },
  titleNameLocked: {
    color: COLORS.textTertiary,
  },

  // Achievements
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  achievementItem: {
    width: '30.5%',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: 4,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
  },
  achievementUnlocked: {
    backgroundColor: COLORS.accent + '10',
    borderWidth: 1,
    borderColor: COLORS.accent + '30',
  },
  achievementEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  achievementName: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  achievementNameLocked: {
    color: COLORS.textTertiary,
  },
  achievementCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  achievementCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  achievementProgress: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  achievementProgressFill: {
    height: 4,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.full,
  },

  // Setting row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingIconText: {
    fontSize: 17,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  settingDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Account
  anonymousWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  anonymousIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.warningBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anonymousIcon: {
    fontSize: 18,
  },
  anonymousInfo: {
    flex: 1,
  },
  anonymousTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  anonymousSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
  },
  linkBtnText: {
    color: COLORS.primaryDark,
    fontSize: 14,
    fontWeight: '800',
  },
  linkForm: {
    gap: 0,
    marginBottom: SPACING.sm,
  },
  linkFormActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
    alignItems: 'center',
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: SPACING.sm,
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  passwordEye: {
    position: 'absolute',
    right: SPACING.sm,
    padding: 4,
  },
  emailLinkedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: SPACING.xs,
  },
  signOutBtnText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.error + '35',
    backgroundColor: COLORS.errorBg,
  },
  deleteBtnText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.5,
  },

  // About
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  aboutAppIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.accent + '15',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.accent + '20',
  },
  aboutAppEmoji: {
    fontSize: 22,
  },
  aboutInfo: {},
  aboutAppName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  aboutVersion: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 1,
  },
  aboutTagline: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  aboutLinks: {
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  aboutLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  aboutLinkText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  aboutLinkDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 34,
  },
});
