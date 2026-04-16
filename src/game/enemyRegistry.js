// Module-level registry for enemy positions and damage callbacks.
// Avoids per-frame Zustand updates for position tracking.
export const enemyRegistry = new Map()
// id -> { getPosition: () => [x, z], takeDamage: (amount) => void }

export const ATTACK_DAMAGE = 25  // player's attack damage
export const ATTACK_RANGE  = 4.0 // max distance for player melee attack
