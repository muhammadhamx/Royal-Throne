import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING, SHADOWS } from '@/utils/constants';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    items: [
      {
        heading: 'Account Info',
        body: 'The App uses anonymous authentication by default. No email, name, or identifying info is required. You may optionally link an email for recovery, set a display name, or choose an avatar.',
      },
      {
        heading: 'Session Data',
        body: 'When you log a session, we store: start/end timestamps, duration, your rating, and any notes you add.',
      },
      {
        heading: 'Chat Messages',
        body: 'Messages you send in buddy chats and group rooms are stored with timestamps. Chat messages are automatically deleted after 30 days.',
      },
      {
        heading: 'Technical Info',
        body: 'Minimal device info (OS version, app version, crash logs). We do NOT use third-party analytics.',
      },
    ],
  },
  {
    title: '2. How We Use Your Info',
    items: [
      {
        heading: 'What we DO',
        body: 'Provide the app features (session logs, chat, stats), fix bugs, send local on-device notifications (not from our servers).',
      },
      {
        heading: 'What we NEVER do',
        body: 'Sell your data. Share it with analytics providers. Build marketing profiles. Period.',
      },
    ],
  },
  {
    title: '3. Data Storage & Security',
    items: [
      {
        heading: 'Where',
        body: 'Your data is stored on Supabase (PostgreSQL) hosted in the US East region.',
      },
      {
        heading: 'How we protect it',
        body: 'HTTPS/TLS encryption, row-level security policies, anonymous auth by default. No method is 100% secure, but we do our best.',
      },
    ],
  },
  {
    title: '4. Your Rights',
    items: [
      {
        heading: 'View & Delete',
        body: 'View your data anytime in the app. Delete your account and ALL data permanently from Settings. We process deletion requests within 30 days.',
      },
    ],
  },
  {
    title: '5. Notifications',
    items: [
      {
        heading: 'Local only',
        body: 'All notifications are generated on your device. No push tokens are sent to our servers. Disable anytime in your device settings.',
      },
    ],
  },
  {
    title: '6. Children',
    items: [
      {
        heading: 'Age requirement',
        body: 'The App is not intended for children under 13. If you believe a child under 13 has used the app, contact us and we will delete their data.',
      },
    ],
  },
];

export default function PrivacyPolicyScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerCard}>
        <Text style={styles.headerEmoji}>🔒</Text>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <Text style={styles.headerDate}>Last Updated: February 22, 2026</Text>
      </View>

      <View style={styles.tldrCard}>
        <Text style={styles.tldrLabel}>TL;DR</Text>
        <Text style={styles.tldrText}>
          We collect the bare minimum to make the app work. We never sell your data and never track you. You can delete everything anytime. That's it. Now go poop in peace.
        </Text>
      </View>

      {SECTIONS.map((section) => (
        <View key={section.title} style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.items.map((item) => (
            <View key={item.heading} style={styles.item}>
              <Text style={styles.itemHeading}>{item.heading}</Text>
              <Text style={styles.itemBody}>{item.body}</Text>
            </View>
          ))}
        </View>
      ))}

      <View style={styles.contactCard}>
        <Text style={styles.contactLabel}>Questions?</Text>
        <Text style={styles.contactEmail}>royalthroneapp@gmail.com</Text>
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
  headerCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  headerDate: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
  tldrCard: {
    backgroundColor: COLORS.accent + '12',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.accent + '25',
    marginBottom: SPACING.md,
  },
  tldrLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 1,
    marginBottom: 6,
  },
  tldrText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: SPACING.sm,
    ...SHADOWS.subtle,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    letterSpacing: -0.2,
  },
  item: {
    marginBottom: SPACING.sm,
  },
  itemHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accent,
    marginBottom: 3,
  },
  itemBody: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  contactCard: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  contactLabel: {
    fontSize: 13,
    color: COLORS.textTertiary,
    marginBottom: 4,
  },
  contactEmail: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.accent,
  },
});
