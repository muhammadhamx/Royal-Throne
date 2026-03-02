/**
 * ML-inspired notification scorer using epsilon-greedy multi-armed bandit.
 * Picks the best notification category based on user context,
 * with exploration to prevent staleness.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NotificationCategory, UserContext } from './notificationTemplates';
import { ALL_CATEGORIES } from './notificationTemplates';

const RECENT_CATEGORIES_KEY = '@notification_recent_categories';
const MAX_RECENT = 6;
const EPSILON = 0.15; // 15% random exploration

// ─── Base Weights ────────────────────────────────────────────────────────────

const BASE_WEIGHTS: Record<NotificationCategory, number> = {
  streak: 1.0,
  rankProgress: 1.0,
  challenges: 1.0,
  social: 0.8,
  league: 0.7,
  health: 1.2,
  milestones: 0.9,
  funFacts: 1.0,
};

// ─── Contextual Boosters ─────────────────────────────────────────────────────

function computeWeights(ctx: UserContext): Record<NotificationCategory, number> {
  const weights = { ...BASE_WEIGHTS };

  // High streak → boost streak category
  if (ctx.streakCount >= 7) weights.streak += 0.5;
  if (ctx.streakCount >= 14) weights.streak += 0.3;

  // Streak at risk → heavily boost streak
  if (ctx.streakCount > 0 && ctx.lastSessionHoursAgo !== null && ctx.lastSessionHoursAgo > 16) {
    weights.streak += 1.5;
  }

  // No streak → slight boost to get one started
  if (ctx.streakCount === 0) weights.streak += 0.3;

  // Close to rank up → boost rankProgress
  if (ctx.nextRankName && ctx.xpToNextRank <= 100) weights.rankProgress += 1.2;
  if (ctx.nextRankName && ctx.xpToNextRank <= 50) weights.rankProgress += 0.8;

  // Uncompleted challenges → boost challenges
  if (ctx.dailyChallengesCompleted < ctx.totalChallenges) weights.challenges += 0.6;
  // All challenges done → reduce challenges
  if (ctx.dailyChallengesCompleted >= ctx.totalChallenges && ctx.totalChallenges > 0) {
    weights.challenges *= 0.3;
  }

  // Has buddy → boost social
  if (ctx.hasBuddy) weights.social += 0.6;
  // Active poopers → boost social
  if (ctx.activePoopersCount > 0) weights.social += 0.4;

  // In leagues → boost league
  if (ctx.leagueCount > 0) weights.league += 0.5;
  // Top rank in league → boost league
  if (ctx.leagueRank && ctx.leagueRank <= 3) weights.league += 0.4;
  // No leagues → slight boost to encourage joining
  if (ctx.leagueCount === 0) weights.league += 0.2;

  // High sessions → boost milestones
  if (ctx.totalSessions >= 50) weights.milestones += 0.4;
  if (ctx.totalSessions >= 100) weights.milestones += 0.3;

  // Low sessions (new user) → boost health and funFacts for engagement
  if (ctx.totalSessions < 10) {
    weights.health += 0.5;
    weights.funFacts += 0.5;
  }

  // High credits → slight milestone boost
  if (ctx.credits >= 100) weights.milestones += 0.3;

  return weights;
}

// ─── Category Cooldown ───────────────────────────────────────────────────────

async function getRecentCategories(): Promise<NotificationCategory[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_CATEGORIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function recordCategory(category: NotificationCategory): Promise<void> {
  try {
    const recent = await getRecentCategories();
    recent.push(category);
    // Keep only the last MAX_RECENT entries
    const trimmed = recent.slice(-MAX_RECENT);
    await AsyncStorage.setItem(RECENT_CATEGORIES_KEY, JSON.stringify(trimmed));
  } catch {
    // Silent fail
  }
}

function applyCooldown(
  weights: Record<NotificationCategory, number>,
  recent: NotificationCategory[],
): Record<NotificationCategory, number> {
  const cooled = { ...weights };
  for (const category of recent) {
    if (cooled[category]) {
      // Each recent appearance reduces weight by 40%
      cooled[category] *= 0.6;
    }
  }
  return cooled;
}

// ─── Roulette Wheel Selection ────────────────────────────────────────────────

function weightedRandomSelect(
  weights: Record<NotificationCategory, number>,
): NotificationCategory {
  const entries = ALL_CATEGORIES.map((cat) => ({
    category: cat,
    weight: Math.max(weights[cat] || 0, 0.01), // Minimum weight to avoid zero
  }));

  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);
  let random = Math.random() * totalWeight;

  for (const entry of entries) {
    random -= entry.weight;
    if (random <= 0) return entry.category;
  }

  // Fallback (shouldn't happen)
  return entries[entries.length - 1].category;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Score and select a notification category using epsilon-greedy bandit.
 * Returns the selected category.
 */
export async function selectCategory(ctx: UserContext): Promise<NotificationCategory> {
  // Epsilon-greedy: random exploration 15% of the time
  if (Math.random() < EPSILON) {
    const randomCategory = ALL_CATEGORIES[Math.floor(Math.random() * ALL_CATEGORIES.length)];
    await recordCategory(randomCategory);
    return randomCategory;
  }

  // Compute contextual weights
  const baseWeights = computeWeights(ctx);

  // Apply cooldown from recent categories
  const recent = await getRecentCategories();
  const finalWeights = applyCooldown(baseWeights, recent);

  // Weighted random selection (roulette wheel)
  const selected = weightedRandomSelect(finalWeights);
  await recordCategory(selected);

  return selected;
}

/**
 * Select multiple categories, ensuring diversity.
 * Used when scheduling 3 notifications per day.
 */
export async function selectCategories(
  ctx: UserContext,
  count: number,
): Promise<NotificationCategory[]> {
  const selected: NotificationCategory[] = [];
  const tempRecent = await getRecentCategories();

  for (let i = 0; i < count; i++) {
    // Epsilon-greedy: random exploration 15% of the time
    if (Math.random() < EPSILON) {
      const available = ALL_CATEGORIES.filter((c) => !selected.includes(c));
      const pick = available.length > 0
        ? available[Math.floor(Math.random() * available.length)]
        : ALL_CATEGORIES[Math.floor(Math.random() * ALL_CATEGORIES.length)];
      selected.push(pick);
      tempRecent.push(pick);
      continue;
    }

    // Compute weights with accumulated cooldown
    const baseWeights = computeWeights(ctx);

    // Penalize already-selected categories in this batch
    for (const cat of selected) {
      baseWeights[cat] *= 0.2;
    }

    const finalWeights = applyCooldown(baseWeights, tempRecent);
    const category = weightedRandomSelect(finalWeights);
    selected.push(category);
    tempRecent.push(category);
  }

  // Persist the final recent categories
  const trimmed = tempRecent.slice(-MAX_RECENT);
  await AsyncStorage.setItem(RECENT_CATEGORIES_KEY, JSON.stringify(trimmed)).catch(() => {});

  return selected;
}

/**
 * Clear scorer state (e.g., on account reset).
 */
export async function clearScorerState(): Promise<void> {
  await AsyncStorage.removeItem(RECENT_CATEGORIES_KEY).catch(() => {});
}
