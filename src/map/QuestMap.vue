<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import './maplibreSetup.js'
import { Map as MapLibreMap, Marker } from 'maplibre-gl'
import { questStyle } from './style.js'
import { addQuestLayers, routeGeoJSON, fenceGeoJSON, labelsGeoJSON, DASH_SEQUENCE } from './questLayers.js'
import { WorldLayer } from '../gl/worldLayer.js'
import { geo, stepWalk, nudge, walkTo, hasFix } from '../lib/geo.js'
import { radiusFor } from '../lib/checkin.js'
import { CITY } from '../lib/config.js'

/**
 * The 3D overworld (Matthew's lane). MapLibre draws the pastel city + quest path,
 * WorldLayer (Three.js) draws the traveller and stamp totems in the same GL context.
 */
const props = defineProps({
  mission: { type: Object, default: null },
  nextLeg: { type: Object, default: null },
  tokens: { type: Array, default: () => [] },
  dark: { type: Boolean, default: false }
})
const emit = defineEmits(['select-stop', 'select-token', 'follow-change', 'fatal'])

const el = ref(null)
const flat = ref(false) // 2D fallback (pitch 0 + emoji avatar) when Three.js cannot start
let map = null
let world = null
let raf = 0
let lastT = 0
let display = null
let following = true
let dashStep = 0
let lastDash = 0
let lastRoute = 0
let emoji = null
const keys = new Set()

const FOLLOW = { zoom: 16.5, pitch: 56 }
const KEY_DIRS = { w: 0, arrowup: 0, s: 180, arrowdown: 180, a: -90, arrowleft: -90, d: 90, arrowright: 90 }

function startCenter() {
  if (hasFix()) return [geo.lng, geo.lat]
  const l = props.nextLeg || props.mission?.legs?.[0]
  return l ? [l.lng, l.lat] : [CITY.lng, CITY.lat]
}

function worldOrigin() {
  const l = props.mission?.legs?.find((x) => x.kind === 'visit')
  return l ? { lng: l.lng, lat: l.lat } : { lng: CITY.lng, lat: CITY.lat }
}

onMounted(() => {
  try {
    map = new MapLibreMap({
      container: el.value,
      style: questStyle({ dark: props.dark }),
      center: startCenter(),
      zoom: FOLLOW.zoom,
      pitch: FOLLOW.pitch,
      bearing: -18,
      maxPitch: 72,
      minZoom: 10,
      attributionControl: { compact: true },
      canvasContextAttributes: { antialias: true },
      pixelRatio: Math.min(window.devicePixelRatio || 1, 2)
    })
  } catch (err) {
    emit('fatal', err)
    return
  }
  if (import.meta.env.DEV) window.__zootMap = map
  map.scrollZoom.enable({ around: 'center' })
  map.touchZoomRotate.enable({ around: 'center' })
  map.on('style.load', setupLayers)
  map.on('dragstart', () => setFollow(false))
  map.on('click', onClick)
  map.on('resize', applyPadding)
  map.on('webglcontextlost', () => emit('fatal', new Error('WebGL context lost')))
  applyPadding()
  window.addEventListener('keydown', onKey)
  window.addEventListener('keyup', onKeyUp)
  raf = requestAnimationFrame(loop)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('keyup', onKeyUp)
  emoji?.remove()
  map?.remove()
  map = null
  world = null
})

/** Keep the traveller in the clear band between the top HUD and the next-stop card. */
function applyPadding() {
  if (!map) return
  const h = map.getContainer().clientHeight
  map.setPadding({ top: Math.round(h * 0.06), bottom: Math.round(h * 0.32), left: 0, right: 0 })
}

function setupLayers() {
  addQuestLayers(map, { dark: props.dark })
  map.addLayer({
    id: 'zt-stops-2d', type: 'circle', source: 'zt-labels',
    paint: { 'circle-radius': 9, 'circle-color': '#ffcc00', 'circle-stroke-color': '#111111', 'circle-stroke-width': 3, 'circle-opacity': flat.value ? 1 : 0, 'circle-stroke-opacity': flat.value ? 1 : 0 }
  }, 'zt-labels')
  try {
    if (flat.value) throw new Error('flat mode')
    world = new WorldLayer(worldOrigin(), { dark: props.dark })
    map.addLayer(world)
  } catch (err) {
    goFlat(err)
  }
  syncMission()
  syncTokens()
}

function goFlat(err) {
  if (err?.message !== 'flat mode') console.warn('[map] 3D layer unavailable, using 2D fallback:', err)
  flat.value = true
  world = null
  map.setPitch(0)
  map.setPaintProperty('zt-stops-2d', 'circle-opacity', 1)
  map.setPaintProperty('zt-stops-2d', 'circle-stroke-opacity', 1)
  if (!emoji) {
    const node = document.createElement('div')
    node.className = 'emoji-avatar'
    node.textContent = '🧍'
    emoji = new Marker({ element: node })
  }
}

function legStatus(l) {
  if (l.status === 'stamped') return 'stamped'
  if (l.kind === 'return') return 'return'
  return l === props.nextLeg ? 'next' : 'pending'
}

function syncMission() {
  if (!map?.getSource('zt-labels')) return
  const m = props.mission
  map.getSource('zt-labels').setData(labelsGeoJSON(m))
  const next = props.nextLeg
  map.getSource('zt-fence').setData(next && next.kind === 'visit' ? fenceGeoJSON(next, radiusFor(geo.accuracy ?? 10)) : fenceGeoJSON(null))
  map.getSource('zt-route').setData(routeGeoJSON(m, display))
  world?.setStops((m?.legs || []).filter((l) => l.status !== 'skipped').map((l) => ({ key: `${l.seq}-${l.place_id}`, lng: l.lng, lat: l.lat, status: legStatus(l) })))
}

function syncTokens() {
  world?.setTokens(props.tokens.map((t) => ({ key: t.id, lng: t.place.lng, lat: t.place.lat, eligible: t.eligible })))
}

watch(() => [props.mission, props.nextLeg], syncMission, { deep: true })
watch(() => props.tokens, syncTokens, { deep: true })
watch(() => props.dark, (dark) => {
  if (!map) return
  world = null
  map.setStyle(questStyle({ dark }))
})

function setFollow(on) {
  if (following === on) return
  following = on
  emit('follow-change', on)
}

function loop(t) {
  raf = requestAnimationFrame(loop)
  if (!map) return
  const dt = lastT ? Math.min(100, t - lastT) : 16
  lastT = t

  if (geo.fake) {
    stepWalk(dt)
    const dirs = [...keys].map((k) => KEY_DIRS[k]).filter((d) => d !== undefined)
    if (dirs.length && hasFix()) {
      const x = dirs.reduce((s, d) => s + Math.sin((d * Math.PI) / 180), 0)
      const y = dirs.reduce((s, d) => s + Math.cos((d * Math.PI) / 180), 0)
      const rel = (Math.atan2(x, y) * 180) / Math.PI
      const speed = (keys.has('shift') ? 4 : 1) * 3 * Math.max(1, geo.speed) // m/s
      nudge(speed * (dt / 1000), map.getBearing() + rel)
      geo.walkTarget = null
      setFollow(true)
    }
  }

  if (hasFix()) {
    if (!display) display = { lng: geo.lng, lat: geo.lat }
    const a = 1 - Math.exp(-dt / 300) // 300 ms follow lerp
    const prev = { ...display }
    display.lng += (geo.lng - display.lng) * a
    display.lat += (geo.lat - display.lat) * a
    const dx = (display.lng - prev.lng) * 111320 * Math.cos((display.lat * Math.PI) / 180)
    const dy = (display.lat - prev.lat) * 110540
    const speed = Math.hypot(dx, dy) / (dt / 1000)
    world?.setAvatar({ lng: display.lng, lat: display.lat, heading: geo.heading, moving: speed > 0.4 })
    if (flat.value && emoji) {
      emoji.setLngLat([display.lng, display.lat])
      if (!emoji._map) emoji.addTo(map)
    }
    if (following) map.jumpTo({ center: [display.lng, display.lat] })
  }

  if (t - lastRoute > 250 && map.getSource('zt-route')) {
    lastRoute = t
    map.getSource('zt-route').setData(routeGeoJSON(props.mission, display))
  }
  if (t - lastDash > 70 && map.getLayer('zt-route')) {
    lastDash = t
    dashStep = (dashStep + 1) % DASH_SEQUENCE.length
    map.setPaintProperty('zt-route', 'line-dasharray', DASH_SEQUENCE[dashStep])
  }
}

function onClick(e) {
  const p = e.point
  const near = (lng, lat, above = 110) => {
    const s = map.project([lng, lat])
    return Math.abs(s.x - p.x) < 40 && p.y < s.y + 30 && p.y > s.y - above
  }
  const leg = props.mission?.legs.find((l) => l.status === 'pending' && near(l.lng, l.lat))
  if (leg) return emit('select-stop', leg)
  const tok = props.tokens.find((t) => near(t.place.lng, t.place.lat, 80))
  if (tok) return emit('select-token', tok)
  if (geo.fake) {
    walkTo({ lng: e.lngLat.lng, lat: e.lngLat.lat })
    setFollow(true)
  }
}

function onKey(e) {
  if (!geo.fake || e.target.closest?.('input, textarea, select')) return
  const k = e.key.toLowerCase()
  if (k in KEY_DIRS || k === 'shift') {
    keys.add(k)
    if (k.startsWith('arrow')) e.preventDefault()
  }
}
function onKeyUp(e) {
  keys.delete(e.key.toLowerCase())
}

defineExpose({
  recenter() {
    setFollow(true)
    map?.easeTo({ zoom: FOLLOW.zoom, pitch: flat.value ? 0 : FOLLOW.pitch, duration: 600 })
  },
  overview() {
    if (!map || !props.mission) return
    setFollow(false)
    const pts = props.mission.legs.filter((l) => l.status === 'pending').map((l) => [l.lng, l.lat])
    if (display) pts.push([display.lng, display.lat])
    const lngs = pts.map((p) => p[0])
    const lats = pts.map((p) => p[1])
    const h = map.getContainer().clientHeight
    // Leave room for the HUD on top and the next-stop card at the bottom.
    map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], {
      padding: { top: 110, bottom: Math.round(h * 0.38), left: 40, right: 70 }, pitch: flat.value ? 0 : 40, maxZoom: 16, duration: 900
    })
  },
  flyTo(leg) {
    if (!map) return
    setFollow(false)
    map.flyTo({ center: [leg.lng, leg.lat], zoom: 16.8, pitch: flat.value ? 0 : FOLLOW.pitch, duration: 1200 })
  }
})
</script>

<template>
  <div ref="el" class="quest-map" :class="{ flat }"></div>
</template>

<style scoped>
.quest-map { position: absolute; inset: 0; }
.quest-map :deep(.emoji-avatar) { font-size: 34px; filter: drop-shadow(0 4px 4px rgba(0, 0, 0, 0.3)); }
.quest-map :deep(.maplibregl-ctrl-attrib) { font-size: 10px; }
.quest-map :deep(.maplibregl-ctrl-bottom-right) { bottom: calc(var(--zt-nav-h) + 16px); }
</style>
