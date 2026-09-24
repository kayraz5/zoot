<script setup>
import { computed, onMounted, ref } from 'vue'
import PlaceArt from '../components/PlaceArt.vue'
import { useMissionStore } from '../stores/mission.js'
import { useUiStore } from '../stores/ui.js'
import { loadCatalog, placeById } from '../lib/catalog.js'
import { SIDEQUESTS } from '../data/sidequests.js'
import { distanceM } from '../lib/travel.js'

/**
 * P1 sidequest deck: swipe right to add one to the route, left to pass.
 * Shows sidequests within 600 m of any remaining stop, greyed if the clock can't afford them.
 */
const store = useMissionStore()
const ui = useUiStore()
const passed = ref(new Set())
const drag = ref({ x: 0, active: false, startX: 0 })

onMounted(async () => {
  await loadCatalog()
  await store.loadActive()
})

const deck = computed(() => {
  if (!store.mission) return []
  const pending = store.legs.filter((l) => l.status === 'pending')
  const slack = store.slack()
  return SIDEQUESTS
    .map((sq) => ({ ...sq, place: placeById.value.get(sq.place_id) }))
    .filter((sq) => sq.place && !passed.value.has(sq.id) && !store.missionPlaceIds.has(sq.place_id) && !store.mission.sidequests_done?.includes(sq.id))
    .map((sq) => {
      const near = Math.min(...pending.map((l) => distanceM(l, sq.place)))
      return { ...sq, near, eligible: slack != null && slack >= sq.stay_min + 20 }
    })
    .filter((sq) => sq.near <= 600)
    .sort((a, b) => a.near - b.near)
})
const top = computed(() => deck.value[0])

function down(e) {
  drag.value = { x: 0, active: true, startX: e.clientX }
  e.target.setPointerCapture?.(e.pointerId)
}
function move(e) {
  if (drag.value.active) drag.value.x = e.clientX - drag.value.startX
}
async function up() {
  const x = drag.value.x
  drag.value = { x: 0, active: false, startX: 0 }
  if (x > 110) await take()
  else if (x < -110) pass()
}
function pass() {
  passed.value = new Set([...passed.value, top.value.id])
}
async function take() {
  const sq = top.value
  if (!sq.eligible) {
    ui.toast('Not enough time for this one — it would break your buffer.', 'warning')
    return pass()
  }
  await store.acceptSidequest({ ...sq })
  passed.value = new Set([...passed.value, sq.id])
}
</script>

<template>
  <main class="lq-page" style="max-width: 460px">
    <h1 class="h3 mb-1">Sidequest deck</h1>
    <p class="text-muted small">Swipe right to add it before your next stop. Future legs are re-timed.</p>

    <div v-if="!store.mission" class="text-center py-5 text-muted">Plan a mission first. <RouterLink to="/plan">Plan</RouterLink></div>
    <div v-else-if="!top" class="text-center py-5">
      <i class="bi bi-inboxes display-5 text-muted"></i>
      <p class="text-muted mt-2">No more sidequests near your route.</p>
      <RouterLink to="/map" class="btn btn-primary">Back to map</RouterLink>
    </div>
    <div v-else class="deck">
      <div class="card-stack">
        <div v-if="deck[1]" class="swipe-card lq-card under"></div>
        <div class="swipe-card lq-card" :class="{ off: !top.eligible }"
          :style="{ transform: `translateX(${drag.x}px) rotate(${drag.x / 18}deg)`, transition: drag.active ? 'none' : 'transform .25s' }"
          @pointerdown="down" @pointermove="move" @pointerup="up" @pointercancel="up">
          <PlaceArt :place="top.place" :height="200" />
          <div class="p-3">
            <span class="lq-pill sun mb-2"><i class="bi bi-gem"></i> +{{ top.xp }} XP · {{ top.stay_min }} min</span>
            <h2 class="h4 mb-1">{{ top.title }}</h2>
            <div class="small text-muted mb-2">{{ top.place.name }} · {{ Math.round(top.near) }} m from your route</div>
            <p class="mb-0">{{ top.prompt }}</p>
            <p v-if="!top.eligible" class="text-danger fw-800 small mt-2 mb-0"><i class="bi bi-hourglass-bottom"></i> Not enough time</p>
          </div>
          <div class="stamp-hint yes" :style="{ opacity: Math.max(0, drag.x / 120) }">ADD</div>
          <div class="stamp-hint no" :style="{ opacity: Math.max(0, -drag.x / 120) }">PASS</div>
        </div>
      </div>
      <div class="d-flex justify-content-center gap-4 mt-4">
        <button class="round-btn" @click="pass" aria-label="Pass"><i class="bi bi-x-lg"></i></button>
        <button class="round-btn yes" @click="take" :disabled="!top.eligible" aria-label="Add to route"><i class="bi bi-plus-lg"></i></button>
      </div>
    </div>
  </main>
</template>

<style scoped>
.card-stack { position: relative; height: 430px; }
.swipe-card { position: absolute; inset: 0; overflow: hidden; touch-action: pan-y; cursor: grab; user-select: none; }
.swipe-card.under { transform: scale(0.95) translateY(12px); opacity: 0.6; }
.swipe-card.off { filter: grayscale(0.7); }
.stamp-hint { position: absolute; top: 24px; font-family: 'Fredoka', sans-serif; font-size: 1.8rem; font-weight: 700; padding: 2px 12px; border: 4px solid; border-radius: 12px; transform: rotate(-12deg); }
.stamp-hint.yes { left: 20px; color: var(--lq-teal); }
.stamp-hint.no { right: 20px; color: var(--lq-coral); transform: rotate(12deg); }
.round-btn { width: 64px; height: 64px; border-radius: 50%; border: 2px solid var(--lq-line); background: var(--lq-card); font-size: 1.5rem; color: var(--lq-coral); box-shadow: var(--lq-shadow); }
.round-btn.yes { color: #fff; background: var(--lq-teal); border-color: var(--lq-teal); }
.round-btn:disabled { opacity: 0.4; }
</style>
