/** XP curve: level n needs 100·n² total XP (L2 at 100, L3 at 400, L4 at 900…). */
export function levelFor(xp = 0) {
  const level = Math.floor(Math.sqrt(xp / 100)) + 1
  const floor = 100 * (level - 1) ** 2
  const next = 100 * level ** 2
  return { level, floor, next, progress: (xp - floor) / (next - floor) }
}

export const TITLES = ['Transit Rookie', 'Kopi Scout', 'Lane Walker', 'Skyline Seeker', 'Hawker Hero', 'City Cartographer', 'Layover Legend']
export const titleFor = (level) => TITLES[Math.min(TITLES.length - 1, level - 1)]
