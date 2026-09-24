<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import destination from '@turf/destination'
import bearing from '@turf/bearing'
import { point } from '@turf/helpers'
import QuestMap from '../map/QuestMap.vue'
import TimeToGate from '../components/TimeToGate.vue'
import WeatherChip from '../components/WeatherChip.vue'
import PlaceArt from '../components/PlaceArt.vue'
import { useMissionStore } from '../stores/mission.js'
import { useUiStore } from '../stores/ui.js'
import { loadCatalog, placeById } from '../lib/catalog.js'
import { geo, startGps, setFake, teleport, hasFix } from '../lib/geo.js'
import { checkInStatus } from '../lib/checkin.js'
import { travel, distanceM } from '../lib/travel.js'
import { fmtTime } from '../lib/hours.js'
import { rainLookup } from '../lib/weather.js'
import { RAIN_LIMIT } from '../lib/planner.js'
import { tick } from '../lib/clock.js'
import { DEV_PANEL } from '../lib/config.js'

const route = useRoute()
const store = useMissionStore()
const ui = useUiStore()
const mapRef = ref(null)
const following = ref(true)
const fatal = ref(null)
const stamping = ref(false)
const sheet = ref(null) // { type: 'stop', leg } | { type: 'sidequests' }
const tokens = ref([])
const seenTokens = new Set()
let tokenTimer = 0

onMounted(async () => {
  await loadCatalog()
  await store.loadActive()
  const first = store.mission?.legs.find((l) => l.kind === 'visit')
  if (!ui.weather) ui.loadWeather(first?.lat, first?.lng)
  if (geo.fake && !hasFix()) teleport(approachPoint())
  else startGps()
  refreshTokens()
  tokenTimer = setInterval(refreshTokens, 2000)
  // "On map" from the Mission list: look at that stop once the map has settled.
  const focus = store.mission?.legs.find((l) => String(l.seq) === String(route.query.focus))
  if (focus) setTimeout(() => mapRef.value?.flyTo(focus), 1500)
})
onBeforeUnmount(() => clearInterval(tokenTimer))

const m = computed(() => store.mission)
const next = computed(() => store.nextLeg)
const here = computed(() => (hasFix() ? { lat: geo.lat, lng: geo.lng } : null))

/** A spot ~220 m short of the next stop, on the line from the previous one. Demo-friendly start. */
function approachPoint() {
  const n = store.nextLeg
  if (!n) return store.mission?.origin || { lat: 1.2868, lng: 103.8545 }
  const idx = store.mission.legs.indexOf(n)
  const prev = idx > 0 ? store.mission.legs[idx - 1] : store.mission.origin
  const b = bearing(point([n.lng, n.lat]), point([prev.lng, prev.lat]))
  const [lng, lat] = destination(point([n.lng, n.lat]), 0.22, b, { units: 'kilometers' }).geometry.coordinates
  return { lat, lng }
}

const nextPlace = computed(() => (next.value?.kind === 'visit' ? placeById.value.get(next.value.place_id) : null))
const check = computed(() => {
  tick.value
  if (!nextPlace.value) return null
  return checkInStatus({ place: nextPlace.value, position: hasFix() ? { lat: geo.lat, lng: geo.lng, accuracy: geo.accuracy } : null, fake: geo.fake })
})
const liveTravel = computed(() => {
  if (!next.value || !here.value) return null
  return travel(here.value, next.value, { maxWalk: m.value?.prefs?.maxWalk, style: m.value?.style })
})
const distance = computed(() => (next.value && here.value ? distanceM(here.value, next.value) : null))
const leaveBy = computed(() => {
  tick.value
  return m.value ? store.leaveBy() : null
})
const lateBy = computed(() => {
  if (!next.value || !liveTravel.value) return 0
  const eta = tick.value + liveTravel.value.minutes * 60000
  return Math.round((eta - Date.parse(next.value.arrive_iso)) / 60000)
})
const atHome = computed(() => m.value && here.value && distanceM(here.value, m.value.origin) < 300)

const rainNow = computed(() => {
  if (ui.forceRain) return true
  const h = ui.weather?.hours?.find((x) => tick.value >= x.ms && tick.value < x.ms + 3600000)
  return (h?.prob ?? 0) > RAIN_LIMIT
})
const wetNext = computed(() => {
  const n = next.value
  if (!n || n.kind !== 'visit' || n.indoor !== false) return false
  return rainLookup(ui.weather, ui.forceRain)(Date.parse(n.arrive_iso)) > RAIN_LIMIT
})

const eligibleTokens = computed(() => tokens.value.filter((t) => t.eligible))

function refreshTokens() {
  if (!store.mission || !hasFix()) {
    tokens.value = []
    return
  }
  tokens.value = store.nearbySidequests({ lat: geo.lat, lng: geo.lng })
  for (const t of tokens.value) {
    if (t.eligible && !seenTokens.has(t.id)) {
      seenTokens.add(t.id)
      ui.toast(`✦ Sidequest ${Math.round(t.distance)} m away: ${t.title} (+${t.xp} XP)`, 'info', 4500)
      navigator.vibrate?.(60)
    }
  }
}
watch(() => store.mission?.legs.map((l) => l.status).join(), refreshTokens)

async function stampNext() {
  if (!next.value) return
  stamping.value = true
  try {
    await store.stamp(next.value)
  } catch (err) {
    ui.toast(err.message, 'warning', 4500)
  } finally {
    stamping.value = false
  }
}

async function acceptSidequest(sq) {
  await store.acceptSidequest(sq)
  sheet.value = null
  refreshTokens()
}

function toggleFake() {
  setFake(!geo.fake, approachPoint())
  if (geo.fake && !hasFix()) teleport(approachPoint())
  ui.toast(geo.fake ? 'Demo walk on: tap the map or use WASD to move.' : 'Using real GPS.', 'dark')
}

function jumpNear() {
  if (!geo.fake) setFake(true)
  teleport(approachPoint())
  mapRef.value?.recenter()
}

const modeIcon = { walk: 'bi-person-walking', mrt: 'bi-train-front', taxi: 'bi-taxi-front' }
const speeds = [1, 6, 20]
</script>

<template>
  <main class="map-page">
    <QuestMap
      v-if="!fatal"
      ref="mapRef"
      :mission="m"
      :next-leg="next"
      :tokens="tokens"
      :dark="ui.theme === 'dark'"
      @follow-change="following = $event"
      @select-stop="sheet = { type: 'stop', leg: $event }"
      @select-token="sheet = { type: 'sidequests' }"
      @fatal="fatal = $event"
    />
    <div v-else class="fatal p-4 text-center">
      <i class="bi bi-map display-4 text-muted"></i>
      <h1 class="h5 mt-2">This device can’t draw the 3D map</h1>
      <p class="text-muted small">{{ fatal.message }}. Your quest still works from the Mission tab.</p>
      <RouterLink to="/mission" class="btn btn-primary">Open mission list</RouterLink>
    </div>

    <div v-if="rainNow" class="rain" aria-hidden="true"></div>

    <!-- Top HUD -->
    <div class="hud-top">
      <div class="d-flex flex-column gap-2 align-items-start">
        <div class="city lq-glass"><i class="bi bi-geo-alt-fill text-danger"></i> Singapore</div>
        <WeatherChip />
        <span v-if="geo.fake" class="lq-pill sun lq-glass"><i class="bi bi-joystick"></i> Demo walk</span>
      </div>
      <TimeToGate v-if="m" :must-return-ms="store.mustReturnMs" :leave-by-ms="leaveBy?.ms" />
    </div>

    <!-- Right rail -->
    <div class="rail">
      <button class="rail-btn lq-glass" :class="{ active: following }" @click="mapRef?.recenter()" aria-label="Follow traveller"><i class="bi bi-crosshair"></i></button>
      <button class="rail-btn lq-glass" @click="mapRef?.overview()" aria-label="Show whole route"><i class="bi bi-arrows-fullscreen"></i></button>
      <button v-if="DEV_PANEL" class="rail-btn lq-glass" :class="{ active: geo.fake }" @click="toggleFake" aria-label="Toggle demo walk (fake GPS)"><i class="bi bi-joystick"></i></button>
    </div>

    <!-- Banners -->
    <div class="banners">
      <div v-if="geo.error && !geo.fake" class="banner lq-glass">
        <i class="bi bi-geo-alt text-danger"></i>
        <span class="small flex-grow-1">Location unavailable ({{ geo.error }}).</span>
        <button v-if="DEV_PANEL" class="btn btn-sm btn-primary" @click="jumpNear">Demo walk</button>
      </div>
      <div v-if="wetNext" class="banner rainy">
        <i class="bi bi-cloud-lightning-rain"></i>
        <span class="small flex-grow-1"><b>Rain at {{ next.name }}</b> around {{ fmtTime(next.arrive_iso) }}.</span>
        <button class="btn btn-sm btn-light" :disabled="store.status === 'planning'" @click="store.replan('rain')">Indoor rewrite</button>
      </div>
    </div>

    <!-- Sidequest FAB -->
    <button v-if="eligibleTokens.length" class="fab lq-pulse" @click="sheet = { type: 'sidequests' }">
      <i class="bi bi-gem"></i> Nearby sidequest
      <span class="badge rounded-pill text-bg-light ms-1">{{ eligibleTokens.length }}</span>
    </button>

    <!-- Next stop card -->
    <div class="next-card lq-glass" v-if="m && next">
      <template v-if="next.kind === 'visit'">
        <div class="d-flex align-items-center gap-3">
          <div class="flex-grow-1 min-w-0">
            <div class="tiny fw-800 text-muted text-uppercase">
              Next stop · <i class="bi" :class="modeIcon[liveTravel?.mode || next.travel_mode]"></i>
              {{ liveTravel ? liveTravel.minutes : next.travel_min }} min · stay {{ next.stay_min }}
            </div>
            <div class="h5 mb-0 text-truncate display-font">{{ next.seq }}. {{ next.name }}</div>
            <div class="tiny">
              <span v-if="distance != null" class="mono">{{ distance < 1000 ? Math.round(distance) + ' m' : (distance / 1000).toFixed(1) + ' km' }}</span>
              <span v-if="lateBy > 5" class="text-danger fw-800"> · {{ lateBy }} min behind plan</span>
              <span v-else-if="liveTravel" class="text-success fw-800"> · on time</span>
            </div>
          </div>
          <button class="stamp-btn" :class="{ ready: check?.ok }" :disabled="!check?.ok || stamping" @click="stampNext" :aria-label="check?.message">
            <i class="bi bi-patch-check-fill"></i>
            <span>{{ check?.ok ? 'Stamp!' : 'Stamp' }}</span>
          </button>
        </div>
        <div v-if="check && !check.ok" class="tiny text-muted mt-1">{{ check.message }}</div>
        <div class="d-flex gap-2 mt-2">
          <RouterLink :to="`/place/${next.place_id}`" class="btn btn-sm btn-soft"><i class="bi bi-info-circle"></i> About</RouterLink>
          <button class="btn btn-sm btn-soft" @click="mapRef?.flyTo(next)"><i class="bi bi-eye"></i> Look</button>
          <button v-if="DEV_PANEL" class="btn btn-sm btn-soft ms-auto" @click="jumpNear" title="Skip the MRT ride: teleport 220 m from the stop"><i class="bi bi-lightning-charge"></i> Arrive</button>
        </div>
      </template>
      <template v-else>
        <div class="d-flex align-items-center gap-3">
          <div class="flex-grow-1">
            <div class="tiny fw-800 text-muted text-uppercase">Head home · <i class="bi" :class="modeIcon[liveTravel?.mode || next.travel_mode]"></i> {{ liveTravel?.minutes ?? next.travel_min }} min</div>
            <div class="h5 mb-0 display-font">{{ m.origin.label }}</div>
            <div class="tiny">Arrive by <b class="mono">{{ fmtTime(next.arrive_by) }}</b> · leave by <b class="mono">{{ leaveBy ? fmtTime(leaveBy.ms) : '—' }}</b></div>
          </div>
          <button class="stamp-btn home" :class="{ ready: atHome }" :disabled="!atHome && !geo.fake" @click="store.completeReturn()">
            <i class="bi bi-airplane-fill"></i><span>At gate</span>
          </button>
        </div>
      </template>
      <div v-if="DEV_PANEL && geo.fake" class="dev-strip tiny mt-2">
        <span><i class="bi bi-keyboard"></i> WASD / arrows · tap map to walk</span>
        <span class="ms-auto">Speed</span>
        <button v-for="s in speeds" :key="s" class="lq-chip py-0 px-2" :class="{ active: geo.speed === s }" @click="geo.speed = s">{{ s }}×</button>
      </div>
    </div>

    <div v-else-if="m && !next" class="next-card lq-glass text-center">
      <div class="h5 display-font mb-1">Quest complete 🎉</div>
      <RouterLink to="/passport" class="btn btn-primary btn-sm">Open passport</RouterLink>
    </div>

    <div v-else-if="!m && store.status !== 'planning'" class="next-card lq-glass text-center">
      <div class="h5 display-font mb-1">No quest yet</div>
      <p class="small text-muted mb-2">Explore the toy city, or plan a layover to get a path.</p>
      <RouterLink to="/plan" class="btn btn-primary btn-sm">Plan a layover</RouterLink>
    </div>

    <!-- Sheets -->
    <Transition name="sheet">
      <div v-if="sheet" class="sheet-backdrop" @click.self="sheet = null">
        <div class="sheet lq-card" role="dialog" aria-modal="true">
          <button class="btn-close float-end" aria-label="Close" @click="sheet = null"></button>
          <template v-if="sheet.type === 'stop'">
            <PlaceArt :place="placeById.get(sheet.leg.place_id) || sheet.leg" :height="120" class="mb-3" />
            <div class="tiny text-muted fw-800 mono">{{ fmtTime(sheet.leg.arrive_iso) }}–{{ fmtTime(sheet.leg.depart_iso) }}</div>
            <h2 class="h5">{{ sheet.leg.name }}</h2>
            <p class="small text-muted">{{ sheet.leg.why }}</p>
            <div class="d-flex gap-2">
              <RouterLink :to="`/place/${sheet.leg.place_id}`" class="btn btn-primary btn-sm">Place page</RouterLink>
              <button class="btn btn-soft btn-sm" @click="mapRef?.flyTo(sheet.leg); sheet = null">Fly there</button>
            </div>
          </template>
          <template v-else>
            <h2 class="h5 mb-1"><i class="bi bi-gem text-warning"></i> Sidequests nearby</h2>
            <p class="tiny text-muted">Only offered if the detour still gets you back with your buffer intact.</p>
            <div v-if="!tokens.length" class="small text-muted">Nothing within 400 m right now. Keep walking.</div>
            <div v-for="sq in tokens" :key="sq.id" class="sq-row" :class="{ off: !sq.eligible }">
              <div class="flex-grow-1">
                <div class="fw-800">{{ sq.title }}</div>
                <div class="tiny text-muted">{{ sq.place.name }} · {{ Math.round(sq.distance) }} m · +{{ sq.extra_min }} min · +{{ sq.xp }} XP</div>
                <div class="tiny">{{ sq.prompt }}</div>
              </div>
              <button v-if="sq.eligible" class="btn btn-sm btn-coral" @click="acceptSidequest(sq)">Add</button>
              <span v-else class="tiny fw-800 text-muted text-nowrap">Not enough time</span>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </main>
</template>

<style scoped>
.map-page { position: fixed; inset: 0; overflow: hidden; background: #cfe9da; }
[data-bs-theme='dark'] .map-page { background: #172a35; }
.fatal { position: absolute; inset: 0; display: grid; place-content: center; }
.hud-top { position: absolute; top: max(12px, env(safe-area-inset-top)); left: 12px; right: 12px; display: flex; justify-content: space-between; align-items: flex-start; pointer-events: none; z-index: 10; }
.hud-top > * { pointer-events: auto; }
.city { font-family: 'Fredoka', sans-serif; font-weight: 700; padding: 6px 12px; border-radius: 999px; box-shadow: var(--lq-shadow); }
.rail { position: absolute; right: 12px; top: 150px; display: flex; flex-direction: column; gap: 8px; z-index: 10; }
.rail-btn { width: 44px; height: 44px; border-radius: 14px; border: none; font-size: 1.15rem; color: var(--lq-ink); box-shadow: var(--lq-shadow); }
.rail-btn.active { color: #fff; background: var(--lq-teal); }
.banners { position: absolute; top: 150px; left: 12px; right: 68px; display: flex; flex-direction: column; gap: 8px; z-index: 10; }
.banner { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 16px; box-shadow: var(--lq-shadow); }
.banner.rainy { background: linear-gradient(135deg, #2f7de1, #1f5fb3); color: #fff; }
.fab { position: absolute; right: 12px; bottom: calc(var(--lq-nav-h) + 200px); z-index: 11; border: none; border-radius: 999px; padding: 10px 16px; font-weight: 800; color: #3b2a00; background: linear-gradient(135deg, #ffd166, #ffb703); box-shadow: 0 8px 20px rgba(255, 183, 3, 0.45); }
.next-card { position: absolute; left: 50%; transform: translateX(-50%); bottom: calc(var(--lq-nav-h) + 22px); width: min(520px, calc(100% - 20px)); border-radius: 22px; padding: 12px 14px; box-shadow: var(--lq-shadow); z-index: 10; }
.min-w-0 { min-width: 0; }
.stamp-btn { flex: none; width: 76px; height: 76px; border-radius: 50%; border: none; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: 800; font-size: 0.72rem; color: #fff; background: #b8c4c9; }
.stamp-btn i { font-size: 1.6rem; line-height: 1; }
.stamp-btn.ready { background: radial-gradient(circle at 35% 30%, #ff8a7d, #e0412f); animation: lq-pulse 1.2s infinite; box-shadow: 0 6px 0 #a32a1d; }
.stamp-btn.home.ready { background: radial-gradient(circle at 35% 30%, #5aa7ff, #1f5fb3); box-shadow: 0 6px 0 #164a8c; }
.stamp-btn:active:not(:disabled) { transform: translateY(4px); box-shadow: 0 2px 0 #a32a1d; }
.dev-strip { display: flex; align-items: center; gap: 6px; border-top: 1px dashed var(--lq-line); padding-top: 8px; color: var(--lq-muted); }
.rain { position: absolute; inset: 0; pointer-events: none; z-index: 5; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='120'%3E%3Cg stroke='rgba(200,222,255,0.8)' stroke-width='1.6' stroke-linecap='round'%3E%3Cline x1='10' y1='8' x2='6' y2='26'/%3E%3Cline x1='44' y1='40' x2='40' y2='58'/%3E%3Cline x1='70' y1='12' x2='66' y2='30'/%3E%3Cline x1='24' y1='76' x2='20' y2='94'/%3E%3Cline x1='58' y1='90' x2='54' y2='108'/%3E%3C/g%3E%3C/svg%3E"), url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='130' height='170'%3E%3Cg stroke='rgba(170,200,255,0.55)' stroke-width='1.2' stroke-linecap='round'%3E%3Cline x1='20' y1='20' x2='17' y2='34'/%3E%3Cline x1='90' y1='60' x2='87' y2='74'/%3E%3Cline x1='55' y1='120' x2='52' y2='134'/%3E%3Cline x1='115' y1='140' x2='112' y2='154'/%3E%3C/g%3E%3C/svg%3E"); background-size: 80px 120px, 130px 170px; animation: rain 0.5s linear infinite; background-color: rgba(40, 70, 110, 0.12); }
@keyframes rain { from { background-position: 0 0, 0 0; } to { background-position: -20px 120px, -13px 170px; } }
.sheet-backdrop { position: fixed; inset: 0; z-index: 1200; background: rgba(10, 30, 36, 0.35); display: flex; align-items: flex-end; justify-content: center; }
.sheet { width: min(560px, 100%); border-radius: 24px 24px 0 0; padding: 18px 18px calc(18px + env(safe-area-inset-bottom)); max-height: 75vh; overflow: auto; }
.sq-row { display: flex; gap: 12px; align-items: center; padding: 10px 0; border-top: 1px solid var(--lq-line); }
.sq-row.off { opacity: 0.55; }
.sheet-enter-active, .sheet-leave-active { transition: opacity 0.2s; }
.sheet-enter-active .sheet, .sheet-leave-active .sheet { transition: transform 0.25s; }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
.sheet-enter-from .sheet, .sheet-leave-to .sheet { transform: translateY(40px); }
</style>
