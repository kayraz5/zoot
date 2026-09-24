<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUiStore } from '../stores/ui.js'
import { useUserStore } from '../stores/user.js'
import { AREAS } from '../data/origins.js'

const ui = useUiStore()
const user = useUserStore()
const router = useRouter()
const c = computed(() => ui.celebration)
const ink = computed(() => AREAS.find((a) => a.id === c.value?.area)?.ink || '#c0392b')
const glyph = computed(() => AREAS.find((a) => a.id === c.value?.area)?.glyph || '✦')

function close() { ui.celebrate(null) }
function toPassport() { close(); router.push('/passport') }
</script>

<template>
  <Transition name="lq-fade">
    <div v-if="c" class="celebrate" role="dialog" aria-modal="true" aria-label="Stamp collected" @click.self="close">
      <div class="card-pop lq-card text-center p-4">
        <template v-if="c.returned">
          <div class="gate-icon mb-2"><i class="bi" :class="c.onTime ? 'bi-airplane-fill' : 'bi-alarm'"></i></div>
          <h2 class="h3 mb-1">{{ c.onTime ? 'Back with time to spare' : 'Back — a little late' }}</h2>
          <p class="text-muted mb-3">{{ c.onTime ? 'Quest complete. Enjoy the flight.' : 'You made it, but the buffer was eaten. Next time, leave earlier.' }}</p>
          <div v-if="c.xp" class="xp-burst mb-3">+{{ c.xp }} XP</div>
        </template>
        <template v-else>
          <div class="chop-stage mb-2">
            <div class="chop" :style="{ '--ink': ink }">
              <span class="glyph">{{ glyph }}</span>
              <span class="ring-text">{{ c.area }}</span>
            </div>
            <div class="splat" :style="{ '--ink': ink }"></div>
          </div>
          <h2 class="h4 mb-1">{{ c.place?.name }}</h2>
          <p class="text-muted mb-2">Stamped · Level {{ user.level.level }} · {{ user.title }}</p>
          <div class="xp-burst mb-2">+{{ c.xp }} XP</div>
          <p v-if="c.firstInArea" class="lq-pill sun mb-3"><i class="bi bi-journal-plus"></i> New passport page: {{ c.area }}</p>
        </template>
        <div class="d-flex gap-2 justify-content-center">
          <button v-if="c.firstInArea" class="btn btn-soft" @click="toPassport"><i class="bi bi-journal-bookmark"></i> See chop</button>
          <button class="btn btn-primary px-4" @click="close" autofocus>Nice!</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.celebrate { position: fixed; inset: 0; z-index: 1900; display: grid; place-items: center; padding: 16px; background: rgba(10, 30, 36, 0.45); backdrop-filter: blur(3px); }
.card-pop { width: min(360px, 100%); animation: pop 0.35s cubic-bezier(0.2, 1.6, 0.4, 1); }
@keyframes pop { from { transform: scale(0.85); opacity: 0; } to { transform: none; opacity: 1; } }
.chop-stage { position: relative; height: 150px; display: grid; place-items: center; }
.chop {
  width: 120px; height: 120px; border-radius: 50%; border: 6px double var(--ink); color: var(--ink);
  display: grid; place-items: center; position: relative; transform: rotate(-12deg);
  animation: slam 0.55s cubic-bezier(0.3, 0.1, 0.3, 1.5) both; background: rgba(255, 255, 255, 0.02);
}
.chop .glyph { font-size: 46px; font-weight: 700; line-height: 1; font-family: 'Fredoka', serif; }
.chop .ring-text { position: absolute; bottom: 14px; font-size: 10px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; }
.splat { position: absolute; width: 150px; height: 150px; border-radius: 50%; background: radial-gradient(circle, color-mix(in srgb, var(--ink) 22%, transparent) 0 40%, transparent 62%); animation: splat 0.6s 0.3s ease-out both; }
@keyframes slam { 0% { transform: scale(2.6) rotate(-30deg); opacity: 0; } 60% { transform: scale(0.92) rotate(-10deg); opacity: 1; } 100% { transform: scale(1) rotate(-12deg); } }
@keyframes splat { from { transform: scale(0.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.xp-burst { font-family: 'Fredoka', sans-serif; font-size: 2rem; font-weight: 700; color: var(--lq-coral); animation: lq-bob 1.2s ease-in-out infinite; }
.gate-icon { font-size: 3rem; color: var(--lq-teal); }
.lq-fade-enter-active, .lq-fade-leave-active { transition: opacity 0.2s; }
.lq-fade-enter-from, .lq-fade-leave-to { opacity: 0; }
</style>
