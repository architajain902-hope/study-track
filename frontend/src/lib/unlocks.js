// Mascot cosmetic unlocks — earned by total focused study time.
export const UNLOCKS = [
  { id: 'hat', name: 'Grad cap', emoji: '🎓', mins: 30 },
  { id: 'glasses', name: 'Scholar glasses', emoji: '🤓', mins: 90 },
  { id: 'bowtie', name: 'Bow tie', emoji: '🎀', mins: 180 },
  { id: 'scarf', name: 'Cozy scarf', emoji: '🧣', mins: 360 },
  { id: 'star', name: 'Star student', emoji: '🌟', mins: 600 },
  { id: 'rocket', name: 'Rocket focus', emoji: '🚀', mins: 1200 },
  { id: 'crown', name: 'Royal scholar', emoji: '👑', mins: 2400 },
];

export function totalFocusMinutes(studySessions = []) {
  return Math.round(studySessions.reduce((a, s) => a + (s.duration_seconds || 0), 0) / 60);
}

export function unlockedIds(unlocks = []) {
  const set = new Set(unlocks || []);
  return UNLOCKS.filter((u) => set.has(u.id)).map((u) => u.id);
}

// Newly earned cosmetics not yet recorded on the profile.
export function newUnlocks(profile, studySessions = []) {
  const total = totalFocusMinutes(studySessions);
  const owned = new Set(profile?.unlocks || []);
  return UNLOCKS
    .filter((u) => u.mins <= total && !owned.has(u.id))
    .sort((a, b) => a.mins - b.mins);
}

export function nextUnlock(profile, studySessions = []) {
  const total = totalFocusMinutes(studySessions);
  const owned = new Set(profile?.unlocks || []);
  return UNLOCKS.filter((u) => u.mins > total && !owned.has(u.id))[0] || null;
}

export function equippedCosmetic(profile) {
  return UNLOCKS.find((u) => u.id === profile?.mascot_skin) || null;
}

export function unlockMessage(unlock) {
  return `${unlock.emoji} New cosmetic unlocked: ${unlock.name}! Equip it from your profile.`;
}