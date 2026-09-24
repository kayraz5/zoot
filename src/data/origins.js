/**
 * Origin presets for the /plan form. `kind` decides the buffers:
 * airport → exit + re-entry immigration + 45 min safety; hotel → 20 min safety.
 */
export const ORIGINS = [
  { id: 'changi-t3', label: 'Changi Airport T3', short: 'Changi T3', kind: 'airport', lat: 1.3563, lng: 103.9866 },
  { id: 'changi-t1', label: 'Changi Airport T1', short: 'Changi T1', kind: 'airport', lat: 1.3618, lng: 103.9899 },
  { id: 'changi-t2', label: 'Changi Airport T2', short: 'Changi T2', kind: 'airport', lat: 1.3553, lng: 103.9886 },
  { id: 'jewel', label: 'Jewel Changi (landside)', short: 'Jewel', kind: 'airport', lat: 1.3602, lng: 103.9894 },
  { id: 'hotel-city-hall', label: 'Downtown hotel (City Hall)', short: 'Hotel', kind: 'hotel', lat: 1.2935, lng: 103.8532 }
]

export const INTERESTS = [
  { id: 'hawker', label: 'Hawker', icon: 'bi-egg-fried' },
  { id: 'gardens', label: 'Gardens', icon: 'bi-flower1' },
  { id: 'photo', label: 'Photo', icon: 'bi-camera' },
  { id: 'views', label: 'Views', icon: 'bi-binoculars' },
  { id: 'culture', label: 'Culture', icon: 'bi-bank' },
  { id: 'museum', label: 'Museums', icon: 'bi-easel' },
  { id: 'heritage', label: 'Heritage', icon: 'bi-hourglass-split' },
  { id: 'food', label: 'Food', icon: 'bi-cup-hot' },
  { id: 'shopping', label: 'Shopping', icon: 'bi-bag' },
  { id: 'nightlife', label: 'Nightlife', icon: 'bi-moon-stars' },
  { id: 'nature', label: 'Nature', icon: 'bi-tree' },
  { id: 'beach', label: 'Beach', icon: 'bi-water' }
]

export const STYLES = {
  budget: { label: 'Budget', icon: 'bi-piggy-bank', blurb: 'Hawkers, free sights, MRT everywhere.', color: '#12b3a8' },
  adventurous: { label: 'Adventurous', icon: 'bi-compass', blurb: 'More stops, more walking, big views.', color: '#ff6b5b' },
  party: { label: 'Party', icon: 'bi-stars', blurb: 'Buzzing streets, late food, rooftop energy.', color: '#8e6bff' },
  conservative: { label: 'Conservative', icon: 'bi-shield-check', blurb: 'Fewer stops, big buffers, indoor-friendly.', color: '#2f7de1' }
}

/** Passport pages, in book order. Colours are the chop ink per area. */
export const AREAS = [
  { id: 'Changi', ink: '#c0392b', glyph: '✈' },
  { id: 'Marina Bay', ink: '#d35400', glyph: '◈' },
  { id: 'Civic District', ink: '#8e44ad', glyph: '⚖' },
  { id: 'Chinatown', ink: '#c0392b', glyph: '龍' },
  { id: 'Tiong Bahru', ink: '#16a085', glyph: '◐' },
  { id: 'Kampong Glam', ink: '#b8860b', glyph: '☾' },
  { id: 'Little India', ink: '#d81b60', glyph: '✿' },
  { id: 'Orchard', ink: '#2e7d32', glyph: '❦' },
  { id: 'Tanglin', ink: '#388e3c', glyph: '❀' },
  { id: 'East Coast', ink: '#1565c0', glyph: '≈' },
  { id: 'HarbourFront', ink: '#00838f', glyph: '⚓' },
  { id: 'Sentosa', ink: '#ef6c00', glyph: '☀' },
  { id: 'West', ink: '#6d4c41', glyph: '⛩' },
  { id: 'North', ink: '#558b2f', glyph: '♣' }
]
