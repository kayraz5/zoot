import circle from '@turf/circle'
import { point } from '@turf/helpers'
import { travel } from '../lib/travel.js'

/**
 * GeoJSON layers drawn by MapLibre under the Three.js world:
 * the dotted quest path (by travel mode), the check-in geofence and stop labels.
 */
const EMPTY = { type: 'FeatureCollection', features: [] }
const MODE_COLOR = { walk: '#ff6b5b', mrt: '#8e6bff', taxi: '#f4a300' }

export const DASH_SEQUENCE = [
  [0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5], [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0],
  [0, 0.5, 3, 3.5], [0, 1, 3, 3], [0, 1.5, 3, 2.5], [0, 2, 3, 2], [0, 2.5, 3, 1.5], [0, 3, 3, 1], [0, 3.5, 3, 0.5]
]

export function addQuestLayers(map, beforeId) {
  map.addSource('lq-route', { type: 'geojson', data: EMPTY })
  map.addSource('lq-fence', { type: 'geojson', data: EMPTY })
  map.addSource('lq-labels', { type: 'geojson', data: EMPTY })

  map.addLayer({ id: 'lq-fence-fill', type: 'fill', source: 'lq-fence', paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.16 } }, beforeId)
  map.addLayer({ id: 'lq-fence-line', type: 'line', source: 'lq-fence', paint: { 'line-color': ['get', 'color'], 'line-width': 2.5, 'line-dasharray': [2, 1.5] } }, beforeId)
  map.addLayer({
    id: 'lq-route-casing', type: 'line', source: 'lq-route',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#ffffff', 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 4, 17, 12], 'line-opacity': ['case', ['get', 'active'], 0.95, 0.55] }
  }, beforeId)
  map.addLayer({
    id: 'lq-route', type: 'line', source: 'lq-route',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': ['match', ['get', 'mode'], 'mrt', MODE_COLOR.mrt, 'taxi', MODE_COLOR.taxi, MODE_COLOR.walk],
      'line-width': ['interpolate', ['linear'], ['zoom'], 12, 2.5, 17, 7],
      'line-opacity': ['case', ['get', 'active'], 1, 0.55],
      'line-dasharray': DASH_SEQUENCE[0]
    }
  }, beforeId)
  map.addLayer({
    id: 'lq-labels', type: 'symbol', source: 'lq-labels', minzoom: 13.5,
    layout: {
      'text-field': ['get', 'label'], 'text-font': ['Noto Sans Bold'], 'text-size': 12,
      'text-anchor': 'top', 'text-offset': [0, 1.2], 'text-max-width': 10, 'text-allow-overlap': false
    },
    paint: { 'text-color': '#15313a', 'text-halo-color': '#ffffff', 'text-halo-width': 2 }
  })
}

/**
 * Route from the traveller → every pending stop → home. Each segment keeps its travel mode.
 * The segment the traveller is on is `active` (bold); later ones are faded.
 */
export function routeGeoJSON(mission, here) {
  if (!mission) return EMPTY
  const pending = mission.legs.filter((l) => l.status === 'pending')
  const features = []
  let prev = here || null
  pending.forEach((l, i) => {
    if (prev) {
      // The live segment uses how you'd travel from *here*, not the planned leg from the last stop.
      const mode = i === 0 && here ? travel(here, l, { maxWalk: mission.prefs?.maxWalk, style: mission.style }).mode : l.travel_mode
      features.push({
        type: 'Feature',
        properties: { mode, active: i === 0 },
        geometry: { type: 'LineString', coordinates: [[prev.lng, prev.lat], [l.lng, l.lat]] }
      })
    }
    prev = l
  })
  return { type: 'FeatureCollection', features }
}

export function fenceGeoJSON(leg, radiusM, color = '#ff6b5b') {
  if (!leg) return EMPTY
  const c = circle(point([leg.lng, leg.lat]), radiusM / 1000, { steps: 48, units: 'kilometers' })
  c.properties = { color }
  return { type: 'FeatureCollection', features: [c] }
}

export function labelsGeoJSON(mission) {
  if (!mission) return EMPTY
  return {
    type: 'FeatureCollection',
    features: mission.legs.map((l) => ({
      type: 'Feature',
      properties: { label: l.kind === 'return' ? `⌂ ${mission.origin.label}` : `${l.seq}. ${l.name}` },
      geometry: { type: 'Point', coordinates: [l.lng, l.lat] }
    }))
  }
}
