import { defineStore } from 'pinia'
import { ORIGINS } from '../data/origins.js'
import { getDb } from '../lib/db/index.js'
import { now } from '../lib/clock.js'
import { toSgLocalInput, fromSgLocalInput } from '../lib/hours.js'
import { useUserStore } from './user.js'

/** Planner form draft + saved trip rows (Ganaden: form UI · Kayra: trips table). */
export const useTripStore = defineStore('trip', {
  state: () => ({
    draft: defaultDraft(),
    current: null
  }),
  getters: {
    origin: (s) => ORIGINS.find((o) => o.id === s.draft.originId) || ORIGINS[0],
    startMs: () => now(),
    mustReturnMs: (s) => fromSgLocalInput(s.draft.mustReturnLocal)
  },
  actions: {
    setHours(h) {
      this.draft.hours = h
      this.draft.mustReturnLocal = toSgLocalInput(roundTo5(now() + h * 3600e3))
    },
    syncHoursFromReturn() {
      this.draft.hours = Math.max(1, Math.round(((this.mustReturnMs - now()) / 3600e3) * 2) / 2)
    },
    async saveTrip() {
      const user = useUserStore()
      const db = await getDb()
      const d = this.draft
      this.current = await db.saveTrip({
        user_id: user.userId,
        origin: { ...this.origin },
        start_at: new Date(now()).toISOString(),
        must_return_at: new Date(this.mustReturnMs).toISOString(),
        style: user.profile?.style || 'budget',
        interests: [...d.interests],
        energy: d.energy,
        indoorPref: d.indoorPref,
        maxWalk: d.maxWalk,
        partySize: d.partySize,
        cleared: d.cleared
      })
      return this.current
    }
  }
})

function roundTo5(ms) {
  return Math.ceil(ms / 300000) * 300000
}

function defaultDraft() {
  return {
    originId: 'changi-t3',
    hours: 8,
    mustReturnLocal: toSgLocalInput(roundTo5(now() + 8 * 3600e3)),
    interests: ['hawker', 'gardens', 'photo'],
    energy: 'med',
    indoorPref: 'any',
    maxWalk: 18,
    partySize: 1,
    cleared: false
  }
}
