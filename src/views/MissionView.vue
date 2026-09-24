<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMissionStore } from '../stores/mission.js'
import { useUiStore } from '../stores/ui.js'
import { loadCatalog } from '../lib/catalog.js'
import { fmtTime, fmtDuration } from '../lib/hours.js'
import { rainLookup } from '../lib/weather.js'
import { RAIN_LIMIT } from '../lib/planner.js'
import { STYLES } from '../data/origins.js'
import TimeToGate from '../components/TimeToGate.vue'
import BufferBar from '../components/BufferBar.vue'
import WeatherChip from '../components/WeatherChip.vue'

const route = useRoute()
const router = useRouter()
const store = useMissionStore()
const ui = useUiStore()

async function load() {
  await loadCatalog()
  if (route.params.id) await store.load(route.params.id)
  else await store.loadActive()
  if (!ui.weather && store.mission) ui.loadWeather(store.mission.legs[0].lat, store.mission.legs[0].lng)
}
onMounted(load)
watch(() => route.params.id, load)

const m = computed(() => store.mission)
const style = computed(() => STYLES[m.value?.style] || STYLES.budget)
const leaveBy = computed(() => (m.value ? store.leaveBy() : null))

const modeIcon = { walk: 'bi-person-walking', mrt: 'bi-train-front', taxi: 'bi-taxi-front' }
const modePill = { walk: '', mrt: 'violet', taxi: 'sun' }

/** Outdoor legs whose visit hour is forecast > 60% rain (or forced rain from /dev). */
const wetLegs = computed(() => {
  if (!m.value) return []
  const rainAt = rainLookup(ui.weather, ui.forceRain)
  return m.value.legs.filter((l) => l.kind === 'visit' && l.status === 'pending' && l.indoor === false && rainAt(Date.parse(l.arrive_iso)) > RAIN_LIMIT)
})

const replans = [
  { mode: 'behind', label: "I'm behind", icon: 'bi-hourglass-bottom' },
  { mode: 'less-walking', label: 'Less walking', icon: 'bi-train-front' },
  { mode: 'swap', label: 'Swap next stop', icon: 'bi-arrow-left-right' },
  { mode: 'rain', label: 'Rain plan', icon: 'bi-umbrella' }
]
</script>

<template>
  <main class="lq-page">
    <div v-if="!m" class="text-center py-5">
      <div v-if="store.status === 'planning'" class="spinner-border text-primary"></div>
      <template v-else>
        <i class="bi bi-signpost-split display-4 text-muted"></i>
        <h1 class="h4 mt-3">No mission yet</h1>
        <p class="text-muted">Tell us your layover and we’ll build one.</p>
        <RouterLink to="/plan" class="btn btn-primary">Plan a layover</RouterLink>
      </template>
    </div>

    <template v-else>
      <header class="d-flex justify-content-between align-items-start gap-3 mb-3">
        <div>
          <div class="d-flex flex-wrap gap-2 mb-2">
            <span class="lq-pill"><i class="bi" :class="style.icon"></i> {{ style.label }}</span>
            <span v-if="m.source === 'groq'" class="lq-pill violet" :title="m.groq_model"><i class="bi bi-stars"></i> Picked by Groq</span>
            <span v-else class="lq-pill sky" :title="m.fallback_reason || ''"><i class="bi bi-cpu"></i> Offline planner</span>
            <span v-if="m.replans" class="lq-pill sun">Replanned ×{{ m.replans }}</span>
          </div>
          <h1 class="h3 mb-1">{{ m.title }}</h1>
          <p class="text-muted small mb-0">From {{ m.origin.label }} · {{ store.stampedCount }}/{{ store.visitLegs.length }} stamped</p>
        </div>
        <TimeToGate :must-return-ms="store.mustReturnMs" :leave-by-ms="leaveBy?.ms" />
      </header>

      <section class="lq-card p-3 mb-3">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <b class="small">Where your {{ fmtDuration(Math.round((store.mustReturnMs - Date.parse(m.start_iso)) / 60000)) }} goes</b>
          <WeatherChip />
        </div>
        <BufferBar
          :window-min="Math.round((store.mustReturnMs - Date.parse(m.start_iso)) / 60000)"
          :exit-min="m.buffers.exit_min" :out-min="m.total_out_min"
          :reentry-min="m.buffers.reentry_min" :safety-min="m.buffers.safety_min" />
      </section>

      <div v-if="wetLegs.length" class="alert rain-alert d-flex align-items-center gap-3" role="alert">
        <i class="bi bi-cloud-lightning-rain fs-3"></i>
        <div class="flex-grow-1 small">
          <b>Rain likely during {{ wetLegs.map((l) => l.name).join(', ') }}.</b>
          Swap outdoor stops for indoor ones nearby?
        </div>
        <button class="btn btn-light btn-sm" :disabled="store.status === 'planning'" @click="store.replan('rain')">Indoor rewrite</button>
      </div>

      <ol class="timeline list-unstyled">
        <li class="tl-start">
          <div class="dot start"><i class="bi bi-airplane-fill"></i></div>
          <div class="small"><b class="mono">{{ fmtTime(Date.parse(m.start_iso) + m.buffers.exit_min * 60000) }}</b> Leave {{ m.origin.label }}<span v-if="m.buffers.exit_min" class="text-muted"> (after {{ m.buffers.exit_min }} min immigration)</span></div>
        </li>
        <template v-for="leg in m.legs" :key="leg.seq + leg.place_id">
          <li class="tl-travel">
            <span class="lq-pill" :class="modePill[leg.travel_mode]"><i class="bi" :class="modeIcon[leg.travel_mode]"></i> {{ leg.travel_min }} min</span>
            <span class="tiny text-muted ms-2">{{ leg.travel_detail }}</span>
          </li>
          <li :class="['tl-stop', leg.kind, leg.status, { next: store.nextLeg === leg }]">
            <div class="dot">
              <i v-if="leg.kind === 'return'" class="bi bi-house-door-fill"></i>
              <i v-else-if="leg.status === 'stamped'" class="bi bi-patch-check-fill"></i>
              <span v-else>{{ leg.seq }}</span>
            </div>
            <div class="lq-card p-3 stop-card">
              <div class="d-flex justify-content-between gap-2">
                <div>
                  <div class="tiny text-muted fw-800 mono">
                    {{ fmtTime(leg.arrive_iso) }}<template v-if="leg.kind === 'visit'">–{{ fmtTime(leg.depart_iso) }} · stay {{ leg.stay_min }} min</template>
                    <template v-else> · must arrive by {{ fmtTime(leg.arrive_by) }}</template>
                  </div>
                  <h2 class="h6 mb-1">
                    <RouterLink v-if="leg.kind === 'visit'" :to="`/place/${leg.place_id}`" class="text-reset">{{ leg.name }}</RouterLink>
                    <span v-else>{{ leg.name }}</span>
                  </h2>
                </div>
                <div class="text-end">
                  <span class="lq-pill coral text-nowrap">+{{ leg.xp }} XP</span>
                  <div v-if="leg.kind === 'visit'" class="tiny mt-1" :class="leg.indoor ? 'text-muted' : 'text-warning-emphasis'">
                    <i class="bi" :class="leg.indoor ? 'bi-house' : 'bi-sun'"></i> {{ leg.indoor ? 'Indoor' : 'Outdoor' }}
                  </div>
                </div>
              </div>
              <p class="small mb-2 why">{{ leg.why }}</p>
              <div v-if="leg.sidequest" class="lq-pill sun mb-2"><i class="bi bi-gem"></i> Sidequest</div>
              <div class="d-flex gap-2 flex-wrap" v-if="leg.kind === 'visit' && leg.status === 'pending'">
                <RouterLink :to="`/map?focus=${leg.seq}`" class="btn btn-sm btn-soft"><i class="bi bi-geo"></i> On map</RouterLink>
                <button class="btn btn-sm btn-link text-muted" @click="store.skip(leg)">Skip</button>
              </div>
              <div v-else-if="leg.status === 'stamped'" class="tiny text-success fw-800"><i class="bi bi-check2-circle"></i> Stamped {{ leg.stamped_at ? fmtTime(leg.stamped_at) : '' }}</div>
              <div v-else-if="leg.status === 'skipped'" class="tiny text-muted fw-800">Skipped</div>
            </div>
          </li>
        </template>
      </ol>

      <section class="lq-card p-3 mb-3">
        <div class="small fw-800 mb-2"><i class="bi bi-arrow-repeat"></i> Plans change. Rewrite the rest:</div>
        <div class="d-flex flex-wrap gap-2">
          <button v-for="r in replans" :key="r.mode" class="btn btn-soft btn-sm" :disabled="store.status === 'planning'" @click="store.replan(r.mode)">
            <i class="bi" :class="r.icon"></i> {{ r.label }}
          </button>
        </div>
        <p class="tiny text-muted mb-0 mt-2">Stamped stops stay. Only future legs are replaced, from where you are now.</p>
      </section>

      <div class="play-bar">
        <button class="btn btn-coral btn-lg w-100" @click="router.push('/map')"><i class="bi bi-controller"></i> Play on map</button>
      </div>
    </template>
  </main>
</template>

<style scoped>
.timeline { position: relative; margin: 0 0 16px; }
.timeline::before { content: ''; position: absolute; left: 17px; top: 8px; bottom: 8px; border-left: 3px dotted var(--lq-teal); opacity: 0.6; }
.timeline li { position: relative; padding-left: 50px; }
.tl-start { padding-bottom: 8px; display: flex; align-items: center; min-height: 36px; }
.tl-travel { padding: 6px 0 6px 50px; }
.tl-stop { padding-bottom: 4px; }
.dot { position: absolute; left: 0; top: 10px; width: 37px; height: 37px; border-radius: 50%; background: var(--lq-teal); color: #fff; display: grid; place-items: center; font-weight: 800; font-family: 'Fredoka', sans-serif; border: 4px solid var(--lq-bg); z-index: 1; }
.tl-start .dot { top: 0; background: var(--lq-sky); }
.tl-stop.return .dot { background: var(--lq-sky); }
.tl-stop.stamped .dot { background: #c0392b; }
.tl-stop.skipped { opacity: 0.55; }
.tl-stop.next .dot { background: var(--lq-coral); animation: lq-pulse 1.4s infinite; }
.tl-stop.next .stop-card { border-color: var(--lq-coral); }
.why { color: var(--lq-muted); }
.rain-alert { background: linear-gradient(135deg, #2f7de1, #1f5fb3); color: #fff; border: none; border-radius: 18px; }
.play-bar { position: sticky; bottom: calc(var(--lq-nav-h) + 20px); z-index: 5; }
</style>
