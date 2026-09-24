import { CITY } from './config.js'

/**
 * Opening-hours helpers. Place hours are Singapore local time:
 *   "24h" or [["07:00","12:00"],["18:00","21:00"]] and optional closed_days (0 = Sunday).
 * We convert timestamps to SG wall-clock with a fixed +08:00 offset (no DST in SG).
 */
export function sgParts(ms) {
  const d = new Date(ms + CITY.utcOffsetMin * 60000)
  return { minutes: d.getUTCHours() * 60 + d.getUTCMinutes(), day: d.getUTCDay(), hour: d.getUTCHours() }
}

const toMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** True if the place is open for the whole visit [arriveMs, departMs]. */
export function isOpenFor(place, arriveMs, departMs) {
  if (!place.hours || place.hours === '24h') return !isClosedDay(place, arriveMs)
  if (isClosedDay(place, arriveMs)) return false
  const a = sgParts(arriveMs).minutes
  const span = Math.round((departMs - arriveMs) / 60000)
  return place.hours.some(([o, c]) => {
    const open = toMin(o)
    let close = toMin(c)
    if (c === '23:59') close = 24 * 60
    if (close <= open) close += 24 * 60 // past midnight
    return a >= open && a + span <= close
  })
}

function isClosedDay(place, ms) {
  return Array.isArray(place.closed_days) && place.closed_days.includes(sgParts(ms).day)
}

export function hoursLabel(place) {
  if (!place.hours || place.hours === '24h') return 'Open 24 hours'
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const ranges = place.hours.map(([o, c]) => `${o}–${c === '23:59' ? '24:00' : c}`).join(', ')
  const closed = place.closed_days?.length ? ` · closed ${place.closed_days.map((d) => days[d]).join(', ')}` : ''
  return ranges + closed
}

/** "14:05" in Singapore time. */
export function fmtTime(msOrIso) {
  const ms = typeof msOrIso === 'string' ? Date.parse(msOrIso) : msOrIso
  const { minutes } = sgParts(ms)
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

export function fmtDuration(min) {
  const m = Math.max(0, Math.round(min))
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const r = m % 60
  return r ? `${h} h ${r} min` : `${h} h`
}

/** "2026-09-24T18:30" (SG wall clock) for <input type="datetime-local">. */
export function toSgLocalInput(ms) {
  const d = new Date(ms + CITY.utcOffsetMin * 60000)
  return d.toISOString().slice(0, 16)
}

export function fromSgLocalInput(value) {
  return Date.parse(value + ':00Z') - CITY.utcOffsetMin * 60000
}
