import { ref } from 'vue'

/**
 * App clock. Everything time-sensitive (HUD, planner, replans) reads now()
 * so the /dev panel can "skip wait" by shifting the offset.
 */
const offsetMs = ref(readOffset())
export const tick = ref(Date.now())

function readOffset() {
  try { return Number(localStorage.getItem('lq.clockOffset') || 0) } catch { return 0 }
}

export function now() {
  return Date.now() + offsetMs.value
}

export function clockOffsetMin() {
  return Math.round(offsetMs.value / 60000)
}

export function skipMinutes(min) {
  offsetMs.value += min * 60000
  try { localStorage.setItem('lq.clockOffset', String(offsetMs.value)) } catch {}
  tick.value = now()
}

export function resetClock() {
  offsetMs.value = 0
  try { localStorage.removeItem('lq.clockOffset') } catch {}
  tick.value = now()
}

// A 1 s heartbeat that components can depend on for countdowns.
setInterval(() => { tick.value = now() }, 1000)
