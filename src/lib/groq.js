import { validateChoice, validateMission } from './itinerarySchema.js'
import { planDeterministic, sequencePicks, groqCatalogSlice, computeBudget } from './planner.js'

/**
 * Mission pipeline:  Groq chooses → validate → (retry once) → time with Turf/MRT → validate
 *                    └─ on any failure: deterministic greedy planner. The demo never dies.
 */
async function postJson(url, body, timeoutMs) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal
    })
    const json = await res.json().catch(() => ({}))
    return { status: res.status, ok: res.ok, json }
  } finally {
    clearTimeout(timer)
  }
}

export async function buildMission(ctx, { onStatus } = {}) {
  const placeIds = new Set(ctx.catalog.map((p) => p.id))
  const slice = groqCatalogSlice(ctx)
  const allowed = new Set(slice.map((p) => p.id))
  const budget = computeBudget(ctx)
  const startMs = ctx.start?.ms ?? budget.departMs
  let reason = null

  if (slice.length && !ctx.offlineOnly) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      onStatus?.(attempt === 1 ? 'Groq is choosing your stops…' : 'Groq went off-script — retrying once…')
      try {
        const r = await postJson('/api/plan', {
          input: {
            origin: ctx.origin, start_iso: new Date(startMs).toISOString(), must_return_iso: new Date(ctx.mustReturnMs).toISOString(),
            energy: ctx.energy, style: ctx.style, interests: ctx.interests, indoor_pref: ctx.indoorPref,
            max_walk_min_per_leg: ctx.maxWalk, party_size: ctx.partySize
          },
          leftover_min: Math.round((budget.arriveByMs - startMs) / 60000),
          rain_risk: Boolean(ctx.forceRain || ctx.forceIndoor),
          catalog: slice
        }, 15000)
        if (r.status === 404 || r.status === 503) { reason = r.json.error || 'Groq unavailable'; break }
        if (!r.ok) { reason = r.json.error || `HTTP ${r.status}`; continue }
        const v = validateChoice(r.json.choice, allowed)
        if (!v.ok) { reason = v.errors.slice(0, 3).join('; '); continue }
        const why = Object.fromEntries(r.json.choice.picks.map((p) => [p.place_id, p.why]))
        const seq = sequencePicks(ctx, r.json.choice.picks.map((p) => p.place_id), {
          ...ctx.meta, title: r.json.choice.title, why, source: 'groq', groq_model: r.json.model
        })
        if (!seq.ok) { reason = seq.reason; continue }
        const mv = validateMission(seq.mission, placeIds)
        if (!mv.ok) { reason = mv.errors.slice(0, 3).join('; '); continue }
        return { ...seq, source: 'groq' }
      } catch (err) {
        reason = err.name === 'AbortError' ? 'Groq timed out' : err.message
      }
    }
  }

  onStatus?.('Planning offline with the route engine…')
  const r = planDeterministic({ ...ctx, meta: { ...ctx.meta, source: 'fallback' } })
  if (r.ok) {
    const mv = validateMission(r.mission, placeIds)
    if (!mv.ok) return { ok: false, budget: r.budget, reason: 'Planner produced an invalid mission: ' + mv.errors[0] }
    r.mission.fallback_reason = reason
  }
  return { ...r, source: 'fallback', fallbackReason: reason }
}

/** Place page AI blurb with a stored-content fallback and a local cache. */
export async function summarizePlace(place) {
  const key = `lq.summary.${place.id}`
  try {
    const cached = JSON.parse(localStorage.getItem(key))
    if (cached) return cached
  } catch {}
  try {
    const r = await postJson('/api/summary', { place }, 12000)
    if (r.ok && r.json.summary) {
      const out = { summary: r.json.summary, tips: r.json.tips || [], source: 'groq', model: r.json.model }
      try { localStorage.setItem(key, JSON.stringify(out)) } catch {}
      return out
    }
  } catch {}
  return {
    summary: [place.blurb, place.captions?.[0]].filter(Boolean).join(' '),
    tips: [place.captions?.[1], place.safety_notes].filter(Boolean).slice(0, 2),
    source: 'stored'
  }
}
