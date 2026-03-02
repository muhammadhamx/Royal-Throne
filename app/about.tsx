import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Share, Alert, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import * as Clipboard from 'expo-clipboard';
import { COLORS, GRADIENTS, RADIUS, SPACING, SHADOWS, SUPPORT_LINKS } from '@/utils/constants';

const PROMISES = [
  {
    emoji: '🚫',
    title: 'No Data Collection',
    body: 'We don\'t track you, profile you, or harvest your data. Your poop schedule is YOUR business.',
  },
  {
    emoji: '🔒',
    title: 'Anonymous by Default',
    body: 'No email required. No sign-up forms. You get an anonymous account the moment you open the app. That\'s it.',
  },
  {
    emoji: '🗑️',
    title: 'Delete Everything, Anytime',
    body: 'Hit delete in Settings and every byte of your data vanishes from our servers. No 90-day retention tricks.',
  },
  {
    emoji: '🤷',
    title: 'We Don\'t Even Want Your Data',
    body: 'Seriously. We built this because tracking poops is surprisingly satisfying. That\'s the whole reason.',
  },
];

const FUN_FACTS = [
  'The average person spends about 1.5 years of their life on the toilet.',
  'The first known flush toilet was invented for Queen Elizabeth I in 1596.',
  'Astronauts use a $19 million toilet on the ISS.',
  'The World Toilet Organization celebrates World Toilet Day on November 19.',
  'Ancient Romans used communal toilets as social gathering places.',
];

export default function AboutScreen() {
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const randomFact = FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)];

  const handleCryptoDonate = () => {
    Alert.alert(
      '₿ Donate via Crypto',
      'Choose a cryptocurrency to copy the wallet address:',
      [
        {
          text: 'BTC (Bitcoin)',
          onPress: async () => {
            await Clipboard.setStringAsync(SUPPORT_LINKS.CRYPTO.BTC);
            Alert.alert('Copied!', 'BTC address copied to clipboard. Thank you! 🙏');
          },
        },
        {
          text: 'ETH (Ethereum)',
          onPress: async () => {
            await Clipboard.setStringAsync(SUPPORT_LINKS.CRYPTO.ETH);
            Alert.alert('Copied!', 'ETH address copied to clipboard. Thank you! 🙏');
          },
        },
        {
          text: 'USDT (TRC20)',
          onPress: async () => {
            await Clipboard.setStringAsync(SUPPORT_LINKS.CRYPTO.USDT_TRC20);
            Alert.alert('Copied!', 'USDT TRC20 address copied to clipboard. Thank you! 🙏');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: SUPPORT_LINKS.SHARE_TEXT });
    } catch {}
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <LinearGradient
          colors={GRADIENTS.accent}
          style={styles.logoCircle}
        >
          <Text style={styles.logoEmoji}>👑</Text>
        </LinearGradient>
        <Text style={styles.appName}>Royal Throne</Text>
        <Text style={styles.tagline}>Your porcelain kingdom awaits.</Text>
        <Text style={styles.version}>v{appVersion}</Text>
      </View>

      {/* Mission */}
      <View style={styles.missionCard}>
        <Text style={styles.missionTitle}>Why Royal Throne?</Text>
        <Text style={styles.missionText}>
          Let's be honest — everyone poops, but nobody talks about it. We built Royal Throne to make the most underrated part of your day actually fun.
          {'\n\n'}
          Track your sessions. See your patterns. Compete with friends. Find a poop buddy. Earn XP for doing what you were going to do anyway.
          {'\n\n'}
          This is not a medical app. This is not a wellness tracker. This is an app that celebrates the throne time you deserve.
        </Text>
      </View>

      {/* Our Promises */}
      <Text style={styles.sectionLabel}>OUR PROMISES TO YOU</Text>
      {PROMISES.map((p) => (
        <View key={p.title} style={styles.promiseCard}>
          <View style={styles.promiseEmojiCircle}>
            <Text style={styles.promiseEmoji}>{p.emoji}</Text>
          </View>
          <View style={styles.promiseInfo}>
            <Text style={styles.promiseTitle}>{p.title}</Text>
            <Text style={styles.promiseBody}>{p.body}</Text>
          </View>
        </View>
      ))}

      {/* Support */}
      <Text style={styles.sectionLabel}>SUPPORT THE DEVELOPER</Text>
      <View style={styles.supportCard}>
        <View style={styles.supportHeader}>
          <LinearGradient
            colors={GRADIENTS.fire}
            style={styles.supportIconCircle}
          >
            <Text style={styles.supportIconText}>❤️</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.supportTitle}>This Dev is Broke 😭</Text>
            <Text style={styles.supportSub}>Your support keeps this app alive!</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.supportCryptoBtn}
          onPress={handleCryptoDonate}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={GRADIENTS.buttonWarm}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.supportCryptoBtnInner}
          >
            <Text style={styles.supportCryptoBtnIcon}>₿</Text>
            <Text style={styles.supportCryptoBtnText}>Donate via Crypto</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.supportOutlineBtn}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <Ionicons name="share-social-outline" size={16} color={COLORS.accent} />
          <Text style={styles.supportOutlineBtnText}>Share with Friends</Text>
        </TouchableOpacity>
      </View>

      {/* Fun fact */}
      <View style={styles.factCard}>
        <Text style={styles.factLabel}>DID YOU KNOW?</Text>
        <Text style={styles.factText}>{randomFact}</Text>
      </View>

      {/* Navigation links */}
      <Text style={styles.sectionLabel}>LEGAL STUFF</Text>
      <View style={styles.linksCard}>
        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => router.push('/privacy')}
          activeOpacity={0.7}
        >
          <View style={styles.linkIcon}>
            <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.accent} />
          </View>
          <Text style={styles.linkText}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
        </TouchableOpacity>

        <View style={styles.linkDivider} />

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => router.push('/contact')}
          activeOpacity={0.7}
        >
          <View style={styles.linkIcon}>
            <Ionicons name="chatbubble-outline" size={18} color={COLORS.accent} />
          </View>
          <Text style={styles.linkText}>Contact & Feedback</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Built with love (and fiber).
        </Text>
        <Text style={styles.footerSub}>
          Now go have an amazing poop time.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING['3xl'],
  },

  // Hero
  hero: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.glow,
  },
  logoEmoji: {
    fontSize: 36,
  },
  appName: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  version: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 6,
  },

  // Mission
  missionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  missionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    letterSpacing: -0.3,
  },
  missionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },

  // Promises
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textTertiary,
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
    paddingHorizontal: 2,
  },
  promiseCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
    ...SHADOWS.subtle,
  },
  promiseEmojiCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  promiseEmoji: {
    fontSize: 20,
  },
  promiseInfo: {
    flex: 1,
  },
  promiseTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 3,
  },
  promiseBody: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  // Support
  supportCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: SPACING.md,
    ...SHADOWS.subtle,
  },
  supportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  supportIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportIconText: {
    fontSize: 20,
  },
  supportTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  supportSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  supportCryptoBtn: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  supportCryptoBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    gap: 8,
  },
  supportCryptoBtnIcon: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  supportCryptoBtnText: {
    color: COLORS.primaryDark,
    fontSize: 14,
    fontWeight: '800',
  },
  supportOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  supportOutlineBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },

  // Fun fact
  factCard: {
    backgroundColor: COLORS.accentWarm + '12',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.accentWarm + '25',
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  factLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.accentWarm,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  factText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
    fontStyle: 'italic',
  },

  // Links
  linksCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
    ...SHADOWS.subtle,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  linkDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textTertiary,
    fontStyle: 'italic',
  },
  footerSub: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 4,
  },
});
