// access.js

export const TIER_LEVELS = {
  Rookie: 1,
  Veteran: 2,
  "All-Star": 3,
  "Hall-of-Famer": 4,
  Legend: 5
};

export function getTierLevel(tier) {
  return TIER_LEVELS[tier] || 1;
}

export function hasAccess(userTier, requiredTier) {
  return getTierLevel(userTier) >= getTierLevel(requiredTier);
}