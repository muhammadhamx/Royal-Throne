/**
 * Notification deduplication system.
 * Uses FNV-1a hashing + AsyncStorage set to prevent repeat notifications.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NotificationResult, NotificationCategory, UserContext } from './notificationTemplates';
import { generateFromCategory, ALL_CATEGORIES } from './notificationTemplates';

const DEDUP_KEY = '@notification_dedup_hashes';
const MAX_HASHES = 5000;
const MAX_RETRIES = 10;

// ─── FNV-1a Hash ─────────────────────────────────────────────────────────────

/**
 * Fast, zero-dependency 32-bit FNV-1a hash.
 * Returns a hex string.
 */
function fnv1a(str: string): string {
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    // FNV prime: multiply by 16777619
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash.toString(16);
}

// ─── Hash Set Management ─────────────────────────────────────────────────────

let _cachedHashes: string[] | null = null;

async function loadHashes(): Promise<string[]> {
  if (_cachedHashes) return _cachedHashes;
  try {
    const raw = await AsyncStorage.getItem(DEDUP_KEY);
    _cachedHashes = raw ? JSON.parse(raw) : [];
  } catch {
    _cachedHashes = [];
  }
  return _cachedHashes!;
}

async function saveHashes(hashes: string[]): Promise<void> {
  // FIFO eviction: keep only the most recent MAX_HASHES entries
  const trimmed = hashes.length > MAX_HASHES
    ? hashes.slice(hashes.length - MAX_HASHES)
    : hashes;
  _cachedHashes = trimmed;
  try {
    await AsyncStorage.setItem(DEDUP_KEY, JSON.stringify(trimmed));
  } catch {
    // Silent fail
  }
}

function hashNotification(notification: NotificationResult): string {
  return fnv1a(notification.body);
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Check if a notification has been shown before.
 */
export async function isDuplicate(notification: NotificationResult): Promise<boolean> {
  const hashes = await loadHashes();
  const hash = hashNotification(notification);
  return hashes.includes(hash);
}

/**
 * Mark a notification as shown (add its hash to the set).
 */
export async function markAsShown(notification: NotificationResult): Promise<void> {
  const hashes = await loadHashes();
  const hash = hashNotification(notification);
  if (!hashes.includes(hash)) {
    hashes.push(hash);
    await saveHashes(hashes);
  }
}

/**
 * Generate a unique notification for a given category.
 * Retries up to MAX_RETRIES times to avoid duplicates.
 * Falls back to a random category if the primary keeps producing dupes.
 */
export async function generateUniqueNotification(
  category: NotificationCategory,
  ctx: UserContext,
): Promise<NotificationResult | null> {
  const hashes = await loadHashes();

  // Try primary category first
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const notification = generateFromCategory(category, ctx);
    if (!notification) break;

    const hash = hashNotification(notification);
    if (!hashes.includes(hash)) {
      // Mark as shown
      hashes.push(hash);
      await saveHashes(hashes);
      return notification;
    }
  }

  // Fallback: try other categories
  const otherCategories = ALL_CATEGORIES.filter((c) => c !== category);
  for (const fallbackCategory of otherCategories) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const notification = generateFromCategory(fallbackCategory, ctx);
      if (!notification) break;

      const hash = hashNotification(notification);
      if (!hashes.includes(hash)) {
        hashes.push(hash);
        await saveHashes(hashes);
        return notification;
      }
    }
  }

  // Last resort: return any notification even if duplicate
  const lastResort = generateFromCategory(category, ctx);
  if (lastResort) {
    const hash = hashNotification(lastResort);
    if (!hashes.includes(hash)) {
      hashes.push(hash);
      await saveHashes(hashes);
    }
  }
  return lastResort;
}

/**
 * Clear the dedup cache (e.g., on account reset).
 */
export async function clearDedupCache(): Promise<void> {
  _cachedHashes = null;
  await AsyncStorage.removeItem(DEDUP_KEY).catch(() => {});
}
