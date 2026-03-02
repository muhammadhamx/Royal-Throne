/**
 * Compositional notification template engine.
 * Each category has templates that take UserContext and return {title, body} | null.
 * Variable pools (greetings, adjectives, emojis, closers) create millions of unique combos.
 */

// ─── UserContext ─────────────────────────────────────────────────────────────

export interface UserContext {
  // gamificationStore
  xp: number;
  streakCount: number;
  rankName: string;
  nextRankName: string | null;
  xpToNextRank: number;
  dailyChallengesCompleted: number;
  totalChallenges: number;
  freezesRemaining: number;

  // sessionStore
  totalSessions: number;
  todaySessions: number;
  lastSessionHoursAgo: number | null;

  // creditsStore
  credits: number;

  // leagueStore
  leagueCount: number;
  leagueName: string | null;

  // chatStore
  activePoopersCount: number;
  hasBuddy: boolean;

  // community RPC (optional — may not be loaded)
  activeSessions?: number;
  globalSessionsToday?: number;
  totalUsers?: number;
  leagueRank?: number;
  buddyLastActivity?: string | null;
}

// ─── Variable Pools ──────────────────────────────────────────────────────────

const GREETINGS = [
  'Hey there', 'Yo', 'Psst', 'Ahoy', 'Well well well', 'Guess what',
  'Breaking news', 'Alert', 'Quick update', 'Fun fact time',
  'Your Highness', 'Dear throne sitter', 'Royal update',
  'Heads up', 'Attention', 'Good news', 'Did you know',
  'Hot take', 'Throne report', 'Incoming intel',
  'Listen up', 'Word on the street',
];

const ADJECTIVES = [
  'epic', 'legendary', 'magnificent', 'glorious', 'majestic',
  'incredible', 'impressive', 'stellar', 'phenomenal', 'outstanding',
  'spectacular', 'remarkable', 'extraordinary', 'splendid', 'brilliant',
  'awesome', 'formidable', 'royal', 'noble', 'supreme',
  'unstoppable', 'fierce',
];

const EMOJIS = [
  '🔥', '💪', '👑', '🚀', '⚡', '🎯', '💎', '🏆', '✨', '🌟',
  '🎉', '💫', '🧠', '🦸', '🏅',
];

const CLOSERS = [
  'Keep it up!', 'You got this!', "Let's go!", 'Stay royal!',
  'The throne awaits!', 'Long live the king!', 'Onward!',
  'Keep the streak alive!', 'Your throne needs you!',
  'Time to shine!', 'Make it count!', "Don't stop now!",
  'Another day, another flush!', 'Stay legendary!',
  'The porcelain gods approve!', 'Rise and grind!',
  'History in the making!', 'Your legacy grows!',
  'Champions never rest!', 'The realm salutes you!',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

export type NotificationCategory =
  | 'streak'
  | 'rankProgress'
  | 'challenges'
  | 'social'
  | 'league'
  | 'health'
  | 'milestones'
  | 'funFacts';

export interface NotificationResult {
  title: string;
  body: string;
  category: NotificationCategory;
}

type TemplateFunction = (ctx: UserContext) => NotificationResult | null;

// ─── Template Definitions ────────────────────────────────────────────────────

const streakTemplates: TemplateFunction[] = [
  (ctx) => ctx.streakCount > 0 ? {
    title: `${pick(EMOJIS)} ${ctx.streakCount}-Day Streak!`,
    body: `${pick(GREETINGS)}! Your ${pick(ADJECTIVES)} ${ctx.streakCount}-day streak is on fire. ${pick(CLOSERS)}`,
    category: 'streak',
  } : null,
  (ctx) => ctx.streakCount >= 3 ? {
    title: `🔥 Streak Watch: Day ${ctx.streakCount}`,
    body: `${pick(GREETINGS)}, you've been consistent for ${ctx.streakCount} days straight. That's ${pick(ADJECTIVES)}! ${pick(CLOSERS)}`,
    category: 'streak',
  } : null,
  (ctx) => ctx.streakCount >= 7 ? {
    title: `🗓️ Week ${Math.floor(ctx.streakCount / 7)} Complete!`,
    body: `${ctx.streakCount} days without missing — you're ${pick(ADJECTIVES)}. Most people can't do 3 days. ${pick(CLOSERS)}`,
    category: 'streak',
  } : null,
  (ctx) => ctx.streakCount > 0 && ctx.lastSessionHoursAgo !== null && ctx.lastSessionHoursAgo > 16 ? {
    title: `⚠️ Streak at Risk!`,
    body: `${pick(GREETINGS)}! Your ${pick(ADJECTIVES)} ${ctx.streakCount}-day streak needs you today. Don't let it die! ${pick(CLOSERS)}`,
    category: 'streak',
  } : null,
  (ctx) => ctx.streakCount === 0 ? {
    title: `💪 Start a New Streak Today`,
    body: `${pick(GREETINGS)}! Every ${pick(ADJECTIVES)} streak starts with day 1. Log a session and begin your comeback! ${pick(CLOSERS)}`,
    category: 'streak',
  } : null,
  (ctx) => ctx.streakCount >= 5 ? {
    title: `${pick(EMOJIS)} ${ctx.streakCount} Days Strong`,
    body: `Your consistency is ${pick(ADJECTIVES)}. ${ctx.streakCount} days and counting — your gut thanks you. ${pick(CLOSERS)}`,
    category: 'streak',
  } : null,
  (ctx) => ctx.freezesRemaining > 0 && ctx.streakCount > 0 ? {
    title: `🧊 Streak Shield Active`,
    body: `You have ${ctx.freezesRemaining} streak freeze${ctx.freezesRemaining > 1 ? 's' : ''} ready. Your ${ctx.streakCount}-day streak is protected. ${pick(CLOSERS)}`,
    category: 'streak',
  } : null,
  (ctx) => ctx.streakCount >= 10 ? {
    title: `🏆 Double Digits!`,
    body: `${ctx.streakCount} days in a row. That's not luck — that's ${pick(ADJECTIVES)} dedication. ${pick(CLOSERS)}`,
    category: 'streak',
  } : null,
  (ctx) => ctx.streakCount >= 2 ? {
    title: `${pick(EMOJIS)} Day ${ctx.streakCount} Locked In`,
    body: `${pick(GREETINGS)}! ${ctx.streakCount} consecutive days on the throne. You're building something ${pick(ADJECTIVES)}. ${pick(CLOSERS)}`,
    category: 'streak',
  } : null,
  (ctx) => ctx.streakCount >= 14 ? {
    title: `👑 Two Weeks Running`,
    body: `14+ days of pure ${pick(ADJECTIVES)} regularity. Your throne room attendance is ${pick(ADJECTIVES)}. ${pick(CLOSERS)}`,
    category: 'streak',
  } : null,
];

const rankProgressTemplates: TemplateFunction[] = [
  (ctx) => ctx.nextRankName ? {
    title: `📈 ${ctx.xpToNextRank} XP to ${ctx.nextRankName}`,
    body: `${pick(GREETINGS)}! You're so close to ranking up. Just ${ctx.xpToNextRank} more XP to become ${ctx.nextRankName}. ${pick(CLOSERS)}`,
    category: 'rankProgress',
  } : null,
  (ctx) => ctx.nextRankName && ctx.xpToNextRank <= 100 ? {
    title: `🔥 Almost ${ctx.nextRankName}!`,
    body: `Only ${ctx.xpToNextRank} XP away from your next rank. One or two sessions could do it! ${pick(CLOSERS)}`,
    category: 'rankProgress',
  } : null,
  (ctx) => ({
    title: `${pick(EMOJIS)} ${ctx.rankName} Status`,
    body: `${pick(GREETINGS)}, ${ctx.rankName}! You've earned ${ctx.xp.toLocaleString()} XP total. That's ${pick(ADJECTIVES)}! ${pick(CLOSERS)}`,
    category: 'rankProgress',
  }),
  (ctx) => ctx.xp >= 100 ? {
    title: `💎 ${ctx.xp.toLocaleString()} XP Earned`,
    body: `Your ${pick(ADJECTIVES)} journey as ${ctx.rankName} continues. Every session gets you closer to the top. ${pick(CLOSERS)}`,
    category: 'rankProgress',
  } : null,
  (ctx) => ctx.nextRankName && ctx.xpToNextRank <= 50 ? {
    title: `⚡ SO Close to ${ctx.nextRankName}`,
    body: `${pick(GREETINGS)}! Just ${ctx.xpToNextRank} XP separates you from ${ctx.nextRankName}. One ${pick(ADJECTIVES)} session could clinch it! ${pick(CLOSERS)}`,
    category: 'rankProgress',
  } : null,
  (ctx) => ({
    title: `🏅 Rank Report: ${ctx.rankName}`,
    body: `You're currently ${ctx.rankName} with ${ctx.xp.toLocaleString()} XP. ${ctx.nextRankName ? `Next: ${ctx.nextRankName} (${ctx.xpToNextRank} XP away)` : "You've reached the top!"}`,
    category: 'rankProgress',
  }),
  (ctx) => ctx.nextRankName ? {
    title: `🎯 Rank Up Challenge`,
    body: `Can you earn ${ctx.xpToNextRank} XP today to become ${ctx.nextRankName}? Sessions, ratings, and challenges all count! ${pick(CLOSERS)}`,
    category: 'rankProgress',
  } : null,
  (ctx) => !ctx.nextRankName ? {
    title: `👑 Max Rank Achieved!`,
    body: `${pick(GREETINGS)}! You're ${ctx.rankName} — the highest rank. You are truly ${pick(ADJECTIVES)}. ${pick(CLOSERS)}`,
    category: 'rankProgress',
  } : null,
  (ctx) => ctx.xp >= 500 ? {
    title: `✨ XP Milestone: ${Math.floor(ctx.xp / 100) * 100}+`,
    body: `You've crossed ${Math.floor(ctx.xp / 100) * 100} XP as ${ctx.rankName}. Your ${pick(ADJECTIVES)} progress is real. ${pick(CLOSERS)}`,
    category: 'rankProgress',
  } : null,
  (ctx) => ctx.nextRankName ? {
    title: `${pick(EMOJIS)} Path to ${ctx.nextRankName}`,
    body: `${ctx.xpToNextRank} XP until you level up. Rate sessions, complete challenges, and chat with buddies to earn more! ${pick(CLOSERS)}`,
    category: 'rankProgress',
  } : null,
];

const challengeTemplates: TemplateFunction[] = [
  (ctx) => ctx.dailyChallengesCompleted > 0 ? {
    title: `🎯 ${ctx.dailyChallengesCompleted}/${ctx.totalChallenges} Challenges Done`,
    body: `${pick(GREETINGS)}! You've completed ${ctx.dailyChallengesCompleted} challenge${ctx.dailyChallengesCompleted > 1 ? 's' : ''} today. ${ctx.dailyChallengesCompleted < ctx.totalChallenges ? `${ctx.totalChallenges - ctx.dailyChallengesCompleted} left!` : "All done — you're " + pick(ADJECTIVES) + '!'}`,
    category: 'challenges',
  } : null,
  (ctx) => ctx.dailyChallengesCompleted === 0 ? {
    title: `📋 Daily Challenges Await`,
    body: `${pick(GREETINGS)}! ${ctx.totalChallenges} fresh challenges are waiting. Each one is worth 40 XP. ${pick(CLOSERS)}`,
    category: 'challenges',
  } : null,
  (ctx) => ctx.dailyChallengesCompleted === ctx.totalChallenges && ctx.totalChallenges > 0 ? {
    title: `🏆 All Challenges Complete!`,
    body: `${pick(ADJECTIVES).charAt(0).toUpperCase() + pick(ADJECTIVES).slice(1)}! You crushed every challenge today. Come back tomorrow for more. ${pick(CLOSERS)}`,
    category: 'challenges',
  } : null,
  (ctx) => ({
    title: `⚡ Quick XP Boost`,
    body: `${pick(GREETINGS)}! Complete a daily challenge for an easy 40 XP. ${ctx.dailyChallengesCompleted < ctx.totalChallenges ? `You have ${ctx.totalChallenges - ctx.dailyChallengesCompleted} uncompleted!` : 'Check back tomorrow!'} ${pick(CLOSERS)}`,
    category: 'challenges',
  }),
  (ctx) => ctx.dailyChallengesCompleted < ctx.totalChallenges ? {
    title: `🔔 Challenges Expiring Soon`,
    body: `Today's challenges reset at midnight! You still have ${ctx.totalChallenges - ctx.dailyChallengesCompleted} to complete. ${pick(CLOSERS)}`,
    category: 'challenges',
  } : null,
  (ctx) => ({
    title: `${pick(EMOJIS)} Challenge Yourself`,
    body: `Daily challenges are the fastest way to rank up. ${ctx.dailyChallengesCompleted > 0 ? `You've already done ${ctx.dailyChallengesCompleted} today!` : 'Start your first one now!'} ${pick(CLOSERS)}`,
    category: 'challenges',
  }),
  (ctx) => ctx.totalChallenges > 0 ? {
    title: `🎲 Today's Missions`,
    body: `${ctx.totalChallenges} challenges, ${ctx.totalChallenges * 40} XP up for grabs. ${ctx.dailyChallengesCompleted > 0 ? `${ctx.dailyChallengesCompleted} down, ${ctx.totalChallenges - ctx.dailyChallengesCompleted} to go.` : 'None completed yet — get started!'} ${pick(CLOSERS)}`,
    category: 'challenges',
  } : null,
  (ctx) => ({
    title: `💡 Pro Tip`,
    body: `${pick(GREETINGS)}! Completing all daily challenges is the fastest rank-up strategy. Each gives 40 XP! ${pick(CLOSERS)}`,
    category: 'challenges',
  }),
  (ctx) => ctx.dailyChallengesCompleted >= 1 && ctx.dailyChallengesCompleted < ctx.totalChallenges ? {
    title: `🏃 Keep the Momentum`,
    body: `${ctx.dailyChallengesCompleted} challenge${ctx.dailyChallengesCompleted > 1 ? 's' : ''} done! Just ${ctx.totalChallenges - ctx.dailyChallengesCompleted} more for a perfect day. ${pick(CLOSERS)}`,
    category: 'challenges',
  } : null,
  (ctx) => ({
    title: `${pick(EMOJIS)} Daily Grind`,
    body: `Challenges refresh every day. ${pick(GREETINGS).toLowerCase()}, your current score: ${ctx.dailyChallengesCompleted}/${ctx.totalChallenges}. ${pick(CLOSERS)}`,
    category: 'challenges',
  }),
];

const socialTemplates: TemplateFunction[] = [
  (ctx) => ctx.activePoopersCount > 0 ? {
    title: `🚽 ${ctx.activePoopersCount} Active Pooper${ctx.activePoopersCount > 1 ? 's' : ''}`,
    body: `${pick(GREETINGS)}! ${ctx.activePoopersCount} ${ctx.activePoopersCount > 1 ? 'people are' : 'person is'} on the throne right now. You're not alone! ${pick(CLOSERS)}`,
    category: 'social',
  } : null,
  (ctx) => ctx.hasBuddy ? {
    title: `🤝 Buddy Check-In`,
    body: `${pick(GREETINGS)}! Your poop buddy is out there. Send them a message and compare throne times! ${pick(CLOSERS)}`,
    category: 'social',
  } : null,
  (ctx) => !ctx.hasBuddy ? {
    title: `🔍 Find a Poop Buddy`,
    body: `${pick(GREETINGS)}! Poop buddies make sessions ${pick(ADJECTIVES)}. Start a session and find your match! ${pick(CLOSERS)}`,
    category: 'social',
  } : null,
  (ctx) => ctx.globalSessionsToday && ctx.globalSessionsToday > 0 ? {
    title: `🌍 ${ctx.globalSessionsToday} Sessions Today`,
    body: `The Royal Throne community logged ${ctx.globalSessionsToday} sessions today. You're part of something ${pick(ADJECTIVES)}! ${pick(CLOSERS)}`,
    category: 'social',
  } : null,
  (ctx) => ctx.totalUsers && ctx.totalUsers > 1 ? {
    title: `👥 Community Growing`,
    body: `${pick(GREETINGS)}! ${ctx.totalUsers} throne sitters and counting. This community is ${pick(ADJECTIVES)}! ${pick(CLOSERS)}`,
    category: 'social',
  } : null,
  (ctx) => ({
    title: `💬 Social Hour`,
    body: `${pick(GREETINGS)}! Chat rooms are open — share tips, jokes, and throne stories with fellow poopers. ${pick(CLOSERS)}`,
    category: 'social',
  }),
  (ctx) => ctx.activePoopersCount > 1 ? {
    title: `${pick(EMOJIS)} You've Got Company`,
    body: `${ctx.activePoopersCount} people are also on the throne right now. The porcelain council is in session! ${pick(CLOSERS)}`,
    category: 'social',
  } : null,
  (ctx) => ctx.activeSessions && ctx.activeSessions > 0 ? {
    title: `🏰 Throne Room Status`,
    body: `${ctx.activeSessions} active session${ctx.activeSessions > 1 ? 's' : ''} right now across the kingdom. Join the royal gathering! ${pick(CLOSERS)}`,
    category: 'social',
  } : null,
  (ctx) => ({
    title: `🎭 Meet Fellow Sitters`,
    body: `Join a chat room to connect with other throne enthusiasts. It's more fun when it's social! ${pick(CLOSERS)}`,
    category: 'social',
  }),
  (ctx) => ctx.hasBuddy ? {
    title: `${pick(EMOJIS)} Buddy Bond`,
    body: `Your poop buddy partnership is ${pick(ADJECTIVES)}! Keep chatting and supporting each other's throne journeys. ${pick(CLOSERS)}`,
    category: 'social',
  } : null,
];

const leagueTemplates: TemplateFunction[] = [
  (ctx) => ctx.leagueCount > 0 ? {
    title: `🏟️ League Update`,
    body: `${pick(GREETINGS)}! You're competing in ${ctx.leagueCount} league${ctx.leagueCount > 1 ? 's' : ''}${ctx.leagueName ? ` including ${ctx.leagueName}` : ''}. ${pick(CLOSERS)}`,
    category: 'league',
  } : null,
  (ctx) => ctx.leagueRank ? {
    title: `📊 Rank #${ctx.leagueRank} in Your League`,
    body: `You're currently ranked #${ctx.leagueRank}${ctx.leagueName ? ` in ${ctx.leagueName}` : ''}. ${ctx.leagueRank <= 3 ? "You're in the top 3! " + pick(ADJECTIVES) + '!' : 'Push for the top!'} ${pick(CLOSERS)}`,
    category: 'league',
  } : null,
  (ctx) => ctx.leagueCount === 0 ? {
    title: `🏆 Join a League`,
    body: `${pick(GREETINGS)}! Leagues add a ${pick(ADJECTIVES)} competitive edge. Create one or join with a code! ${pick(CLOSERS)}`,
    category: 'league',
  } : null,
  (ctx) => ctx.leagueCount > 0 ? {
    title: `⚔️ League Competition`,
    body: `Every session earns XP for your league rankings. Make your contribution ${pick(ADJECTIVES)} today! ${pick(CLOSERS)}`,
    category: 'league',
  } : null,
  (ctx) => ctx.leagueRank && ctx.leagueRank <= 5 ? {
    title: `${pick(EMOJIS)} Top 5 Alert`,
    body: `You're #${ctx.leagueRank} in your league! One ${pick(ADJECTIVES)} session could push you higher. ${pick(CLOSERS)}`,
    category: 'league',
  } : null,
  (ctx) => ctx.leagueCount > 0 ? {
    title: `🗓️ Weekly League Reset`,
    body: `League rankings reset weekly. Make every session count this week! ${pick(CLOSERS)}`,
    category: 'league',
  } : null,
  (ctx) => ({
    title: `🌍 Global Rankings`,
    body: `${pick(GREETINGS)}! Check the global leaderboard to see how you stack up against all throne sitters. ${pick(CLOSERS)}`,
    category: 'league',
  }),
  (ctx) => ctx.leagueCount > 1 ? {
    title: `🏅 Multi-League Warrior`,
    body: `Competing in ${ctx.leagueCount} leagues? That's ${pick(ADJECTIVES)}! Dominate them all! ${pick(CLOSERS)}`,
    category: 'league',
  } : null,
  (ctx) => ctx.leagueCount === 0 ? {
    title: `${pick(EMOJIS)} Invite Friends`,
    body: `Create a league and invite friends to compete. Nothing motivates like friendly ${pick(ADJECTIVES)} rivalry! ${pick(CLOSERS)}`,
    category: 'league',
  } : null,
  (ctx) => ctx.leagueCount > 0 ? {
    title: `📈 Climb the Ranks`,
    body: `Your league position is based on weekly XP. Sessions, challenges, and ratings all contribute! ${pick(CLOSERS)}`,
    category: 'league',
  } : null,
];

const healthTemplates: TemplateFunction[] = [
  () => ({
    title: `🩺 Health Tip`,
    body: `${pick(GREETINGS)}! ${pick(['A healthy poop should take less than 10 minutes. Speed up with more fiber!', 'Squatting is the most natural position. Consider a footstool!', 'Drinking water keeps things moving. Aim for 8 glasses daily.', 'Regular bathroom habits = happy gut. Try the same time each day.', "Don't scroll too long on the toilet — it increases hemorrhoid risk.", '95% of your serotonin is produced in your gut. Happy gut, happy you!', 'Adults need 25-30g of fiber daily. Most people only get half that.', 'Changes in poop consistency lasting more than 2 weeks? See a doctor.'])} ${pick(CLOSERS)}`,
    category: 'health',
  }),
  () => ({
    title: `💧 Hydration Check`,
    body: `${pick(GREETINGS)}! Your gut works best when hydrated. ${pick(['Have you had 8 glasses today?', 'Water is your colon\'s best friend.', 'Dehydration can cause constipation. Drink up!', 'Tea, water, or juice — just keep those fluids coming.'])} ${pick(CLOSERS)}`,
    category: 'health',
  }),
  () => ({
    title: `🥦 Fiber Alert`,
    body: `${pick(['Beans, broccoli, and berries', 'Oats, apples, and lentils', 'Whole grains, nuts, and seeds', 'Avocados, peas, and sweet potatoes'])} — ${pick(ADJECTIVES)} sources of fiber for ${pick(ADJECTIVES)} gut health. ${pick(CLOSERS)}`,
    category: 'health',
  }),
  () => ({
    title: `☕ Did You Know?`,
    body: `Coffee makes 30% of people need to poop within 20 minutes. ${pick(['Science is beautiful.', 'Your gut has a coffee alarm clock.', 'The original productivity hack.', 'That\'s one way to get things moving.'])} ${pick(CLOSERS)}`,
    category: 'health',
  }),
  () => ({
    title: `🧠 Gut-Brain Connection`,
    body: `${pick(GREETINGS)}! Your gut has over 100 million neurons — literally your second brain. ${pick(['Treat it well!', 'Feed it fiber!', 'It knows things.', 'Mind-blowing, right?'])} ${pick(CLOSERS)}`,
    category: 'health',
  }),
  () => ({
    title: `🎯 Bristol Stool Tip`,
    body: `The ideal poop is Type 4 on the Bristol Stool Chart — smooth, soft, and sausage-shaped. ${pick(['How does yours compare?', 'Aim for perfection!', 'Gold standard of poops.', 'The holy grail.'])} ${pick(CLOSERS)}`,
    category: 'health',
  }),
  () => ({
    title: `⏰ Routine Matters`,
    body: `${pick(GREETINGS)}! ${pick(['Try going at the same time each day.', 'Morning sessions after breakfast work best for most people.', 'Your gut loves predictability.', 'Consistency breeds regularity — literally.'])} ${pick(CLOSERS)}`,
    category: 'health',
  }),
  () => ({
    title: `🏃 Movement Helps`,
    body: `${pick(['Walking', 'Light exercise', 'Stretching', 'A short jog'])} can stimulate bowel movements. ${pick(['Your gut loves when you move!', 'Motion creates motion.', 'Sedentary life = sluggish gut.', 'Get moving for better poops.'])} ${pick(CLOSERS)}`,
    category: 'health',
  }),
  () => ({
    title: `🍎 Snack Smart`,
    body: `${pick(GREETINGS)}! ${pick(['Prunes are nature\'s laxative.', 'Chia seeds expand with water — great for digestion.', 'Greek yogurt has probiotics for gut health.', 'An apple a day keeps constipation away.'])} ${pick(CLOSERS)}`,
    category: 'health',
  }),
  () => ({
    title: `💤 Sleep & Digestion`,
    body: `Poor sleep messes with your gut. ${pick(['Aim for 7-8 hours.', 'Your gut resets while you sleep.', 'Good sleep = good poops.', 'Rest well, poop well.'])} ${pick(CLOSERS)}`,
    category: 'health',
  }),
  () => ({
    title: `🔬 Pro Tip`,
    body: `${pick(['A footstool under your feet mimics squatting and makes things easier.', 'Never hold it in — that trains your body to ignore signals.', 'Taking deep breaths on the toilet can help relax your pelvic floor.', 'Stress can cause both constipation and diarrhea. Manage it!'])} ${pick(CLOSERS)}`,
    category: 'health',
  }),
];

const milestoneTemplates: TemplateFunction[] = [
  (ctx) => ctx.totalSessions >= 10 ? {
    title: `🎉 ${ctx.totalSessions} Sessions Logged!`,
    body: `${pick(GREETINGS)}! You've logged ${ctx.totalSessions} sessions. That's ${pick(ADJECTIVES)} dedication to throne tracking! ${pick(CLOSERS)}`,
    category: 'milestones',
  } : null,
  (ctx) => ctx.totalSessions >= 50 ? {
    title: `💯 Half Century!`,
    body: `${ctx.totalSessions} sessions and still going. You're a ${pick(ADJECTIVES)} throne veteran! ${pick(CLOSERS)}`,
    category: 'milestones',
  } : null,
  (ctx) => ctx.totalSessions >= 100 ? {
    title: `🏆 Centurion!`,
    body: `${ctx.totalSessions} sessions! You're basically a professional throne sitter. ${pick(ADJECTIVES)} achievement unlocked! ${pick(CLOSERS)}`,
    category: 'milestones',
  } : null,
  (ctx) => ctx.xp >= 1000 ? {
    title: `💎 ${Math.floor(ctx.xp / 1000)}K XP Club`,
    body: `You've earned over ${Math.floor(ctx.xp / 1000)},000 XP. Welcome to the ${pick(ADJECTIVES)} elite! ${pick(CLOSERS)}`,
    category: 'milestones',
  } : null,
  (ctx) => ctx.credits >= 50 ? {
    title: `💰 ${ctx.credits} Credits Banked`,
    body: `${pick(GREETINGS)}! Your credit balance of ${ctx.credits} is looking ${pick(ADJECTIVES)}. Check the reward shop! ${pick(CLOSERS)}`,
    category: 'milestones',
  } : null,
  (ctx) => ctx.todaySessions >= 2 ? {
    title: `📈 ${ctx.todaySessions} Sessions Today!`,
    body: `You've already logged ${ctx.todaySessions} sessions today. That's ${pick(ADJECTIVES)} productivity! ${pick(CLOSERS)}`,
    category: 'milestones',
  } : null,
  (ctx) => ctx.totalSessions >= 5 ? {
    title: `${pick(EMOJIS)} Journey Update`,
    body: `${ctx.totalSessions} sessions tracked, ${ctx.xp.toLocaleString()} XP earned, ${ctx.streakCount}-day streak. Your ${pick(ADJECTIVES)} stats speak for themselves! ${pick(CLOSERS)}`,
    category: 'milestones',
  } : null,
  (ctx) => ctx.totalSessions >= 25 ? {
    title: `🎯 Quarter Century`,
    body: `${ctx.totalSessions}+ sessions! You've committed to this throne journey and it shows. ${pick(ADJECTIVES)}! ${pick(CLOSERS)}`,
    category: 'milestones',
  } : null,
  (ctx) => ctx.totalSessions < 5 ? {
    title: `🌱 Just Getting Started`,
    body: `${pick(GREETINGS)}! ${ctx.totalSessions} session${ctx.totalSessions !== 1 ? 's' : ''} so far — every ${pick(ADJECTIVES)} journey starts small. ${pick(CLOSERS)}`,
    category: 'milestones',
  } : null,
  (ctx) => ctx.streakCount >= 30 ? {
    title: `🗓️ Monthly Milestone`,
    body: `${ctx.streakCount} consecutive days! A whole month of ${pick(ADJECTIVES)} consistency. You're in rare company! ${pick(CLOSERS)}`,
    category: 'milestones',
  } : null,
];

const funFactTemplates: TemplateFunction[] = [
  () => ({
    title: `💩 Fun Fact`,
    body: `${pick(GREETINGS)}! ${pick(['The average person spends 3 months of their life on the toilet.', 'The world\'s oldest known toilet is 4,000 years old.', 'Astronauts train for 6 months to use a space toilet.', 'Ancient Romans used communal toilets as social spaces.', 'The toilet is flushed more times during the Super Bowl halftime than any other time.', 'King George II of England died falling off a toilet in 1760.', 'Japan has more vending machines than public toilets.', 'The first toilet paper was invented in 6th century China.'])} ${pick(CLOSERS)}`,
    category: 'funFacts',
  }),
  () => ({
    title: `🌍 Around the World`,
    body: `${pick(['In Japan, toilets play music to mask sounds.', 'Finland hosts the annual Mobile Phone Throwing Championship in a toilet.', 'In Germany, there\'s a toilet museum with exhibits from 2,500 years ago.', 'In India, cow dung was historically used as a natural disinfectant for toilets.', 'Swiss toilets have a "half flush" and "full flush" button to save water.'])} ${pick(CLOSERS)}`,
    category: 'funFacts',
  }),
  () => ({
    title: `🔢 By the Numbers`,
    body: `${pick(GREETINGS)}! ${pick(['You produce about 360 pounds of poop per year.', 'The average poop weighs about half a pound.', 'Your large intestine is about 5 feet long.', 'Food takes 24-72 hours to travel through your digestive system.', 'Americans use 141 rolls of toilet paper per person per year.'])} ${pick(CLOSERS)}`,
    category: 'funFacts',
  }),
  () => ({
    title: `🏰 Royal Throne Trivia`,
    body: `${pick(['Medieval kings had a "Groom of the Stool" — a servant dedicated to their toilet needs.', 'The word "toilet" comes from the French "toilette" meaning "cloth" for wrapping clothes.', 'Thomas Crapper didn\'t invent the toilet, but he did improve the ballcock.', 'The first public flush toilet debuted at the Crystal Palace Exhibition in 1851.'])} ${pick(CLOSERS)}`,
    category: 'funFacts',
  }),
  () => ({
    title: `🐾 Animal Kingdom`,
    body: `${pick(GREETINGS)}! ${pick(['Wombats poop cubes. Scientists still aren\'t sure why.', 'Sloths only poop once a week and lose 1/3 of their body weight.', 'Hippos use their tail as a poop propeller to mark territory.', 'Caterpillars can launch their poop 40 times their body length.', 'Parrotfish poop creates white sand beaches.'])} ${pick(CLOSERS)}`,
    category: 'funFacts',
  }),
  () => ({
    title: `🧪 Science Says`,
    body: `${pick(['Poop is about 75% water.', 'The brown color comes from bilirubin, a byproduct of dead red blood cells.', 'Your gut bacteria produce about 1 liter of gas per day.', 'Poop contains more bacteria than cells in your entire body.', 'Corn appears whole in poop because of its cellulose outer layer.'])} ${pick(CLOSERS)}`,
    category: 'funFacts',
  }),
  () => ({
    title: `📱 Tech & Toilets`,
    body: `${pick(GREETINGS)}! ${pick(['75% of people use their phone on the toilet.', 'The average phone has 10x more bacteria than a toilet seat.', 'Bill Gates invested in reinventing the toilet for developing countries.', 'Smart toilets in Japan can analyze your health from your poop.'])} ${pick(CLOSERS)}`,
    category: 'funFacts',
  }),
  () => ({
    title: `${pick(EMOJIS)} Random Toilet Fact`,
    body: `${pick(['The word "crap" isn\'t named after Thomas Crapper — it\'s from the Medieval Latin "crappa."', 'There\'s a World Toilet Day celebrated on November 19th.', 'The average person visits the toilet 6-8 times per day.', 'The International Space Station toilet cost $19 million.'])} ${pick(CLOSERS)}`,
    category: 'funFacts',
  }),
  () => ({
    title: `🎭 Toilet Humor`,
    body: `${pick(GREETINGS)}! ${pick(['Why did the toilet paper roll down the hill? To get to the bottom.', 'What did one toilet say to the other? "You look flushed!"', 'Why was the plumber always tired? Because his work was draining.', 'What\'s a toilet\'s favorite game? Call of Doody.'])} ${pick(CLOSERS)}`,
    category: 'funFacts',
  }),
  () => ({
    title: `🏅 Poop Records`,
    body: `${pick(['The longest poop ever recorded was allegedly 26 feet long.', 'The world record for longest time on a toilet is over 100 hours.', 'The most expensive toilet is on the ISS at $19 million.', 'The oldest surviving toilet is from 2800 BC in Mohenjo-daro.'])} ${pick(CLOSERS)}`,
    category: 'funFacts',
  }),
];

// ─── Template Registry ───────────────────────────────────────────────────────

export const TEMPLATE_REGISTRY: Record<NotificationCategory, TemplateFunction[]> = {
  streak: streakTemplates,
  rankProgress: rankProgressTemplates,
  challenges: challengeTemplates,
  social: socialTemplates,
  league: leagueTemplates,
  health: healthTemplates,
  milestones: milestoneTemplates,
  funFacts: funFactTemplates,
};

export const ALL_CATEGORIES: NotificationCategory[] = Object.keys(TEMPLATE_REGISTRY) as NotificationCategory[];

/**
 * Generate a notification from a specific category.
 * Returns null if no applicable template found after several attempts.
 */
export function generateFromCategory(
  category: NotificationCategory,
  ctx: UserContext,
): NotificationResult | null {
  const templates = TEMPLATE_REGISTRY[category];
  if (!templates || templates.length === 0) return null;

  // Shuffle and try each template until one returns non-null
  const shuffled = [...templates].sort(() => Math.random() - 0.5);
  for (const template of shuffled) {
    const result = template(ctx);
    if (result) return result;
  }
  return null;
}
