// All humor content centralized here for easy editing

export const LOADING_MESSAGES = [
  'Assuming the position...',
  'Warming up the throne...',
  'Consulting the porcelain oracle...',
  'Preparing for launch...',
  'Engaging bowel protocols...',
  'Checking toilet paper reserves...',
  'Initiating throne sequence...',
  'Buffering your business...',
];

export const STILL_POOPING_MESSAGES: Record<number, string> = {
  600: "Still going? You're a champion. 🏆",
  1200: 'Your legs are definitely asleep by now. 🦵',
  1800: "We're sending a search party. 🔍",
  2700: 'Legend has it, they\'re still sitting there... 📖',
};

export const SESSION_SUMMARY_MESSAGES: Record<string, string[]> = {
  speedrun: [
    'Speedrun Any% world record pace!',
    'Blink and you\'d miss it!',
    'In and out. A true professional.',
    'That was faster than a microwave burrito.',
  ],
  normal: [
    'A solid reading session.',
    'Perfectly balanced, as all things should be.',
    'Standard operating procedure complete.',
    'Another successful mission.',
  ],
  long: [
    'Were you redecorating in there?',
    'Did you fall asleep on the throne?',
    'That was an epic saga.',
    'You just broke your own record. Impressive... or concerning.',
  ],
  marathon: [
    'You might want to see a doctor. Or a plumber.',
    'We were about to file a missing persons report.',
    'Congratulations on your new bathroom residency.',
    'At this point, just move your desk in there.',
  ],
};

export const EMPTY_STATE_MESSAGES = {
  sessions: [
    'Nothing to show yet. Go eat some fiber.',
    'Your throne awaits its first visitor.',
    'No sessions recorded. Are you a camel?',
  ],
  stats: [
    'No stats yet. The data throne is empty.',
    'Start logging to unlock your poop analytics.',
    'Your bowel biography is a blank page.',
  ],
  prediction: [
    'Need more data. Keep pooping.',
    "Can't predict the future without the past. Log some sessions!",
    'The porcelain oracle needs at least 5 offerings.',
  ],
  chat: [
    'No one is pooping right now. Or maybe they just aren\'t tracking it.',
    'The throne room is empty. Be the first!',
  ],
};

export const PREDICTION_NOTIFICATIONS = [
  'T-minus 10 minutes to launch 🚀',
  'Your bowels have entered the chat 💬',
  'The throne awaits your presence 👑',
  'Incoming transmission from your gut 📡',
  'Nature is about to call 📞',
  'Your scheduled appointment with the throne is approaching 🕐',
];

export const BUDDY_ICEBREAKERS = [
  'So... come here often?',
  'What brings you to the throne today?',
  'Great weather we\'re having... in the bathroom.',
  'On a scale of 1-10, how\'s your day going?',
  'First time? Or are you a regular?',
  'What are you reading in there?',
];

export const ACHIEVEMENT_HUMOR: Record<string, string> = {
  early_bird: 'The early bird gets the... you know.',
  night_owl: 'Things happen after midnight.',
  speed_run: 'Efficiency is the highest form of beauty.',
  marathon: 'Some say they\'re still sitting there.',
  regular: 'Your colon runs like a Swiss watch.',
  social_butterfly: 'Making friends in the unlikeliest of places.',
  throne_regular: 'You should have a reserved seat.',
  first_session: 'Every journey begins with a single plop.',
  week_streak: 'Seven days, seven victories.',
  centurion: 'One hundred sessions. You\'re basically a professional.',
};

export function getRandomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function getSessionSummaryMessage(durationSeconds: number): string {
  let category: keyof typeof SESSION_SUMMARY_MESSAGES;
  if (durationSeconds < 120) {
    category = 'speedrun';
  } else if (durationSeconds < 600) {
    category = 'normal';
  } else if (durationSeconds < 1800) {
    category = 'long';
  } else {
    category = 'marathon';
  }
  return getRandomItem(SESSION_SUMMARY_MESSAGES[category]);
}
