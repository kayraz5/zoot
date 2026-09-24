<script setup>
import { computed, onMounted, ref } from 'vue'
import { catalog, loadCatalog } from '../lib/catalog.js'
import { usePassportStore } from '../stores/passport.js'
import { AREAS } from '../data/origins.js'

/** City Codex: every place, seen vs stamped (the collection screen). */
const passport = usePassportStore()
const filter = ref('all')
onMounted(loadCatalog)

const groups = computed(() =>
  AREAS.map((a) => {
    const places = catalog.value.filter((p) => p.area === a.id)
    return { ...a, places, stamped: places.filter((p) => passport.stampedIds.has(p.id)).length }
  }).filter((g) => g.places.length)
)
const total = computed(() => catalog.value.length)
const stampedTotal = computed(() => catalog.value.filter((p) => passport.stampedIds.has(p.id)).length)
const seenTotal = computed(() => catalog.value.filter((p) => passport.seen.has(p.id)).length)
const state = (p) => (passport.stampedIds.has(p.id) ? 'stamped' : passport.seen.has(p.id) ? 'seen' : 'unknown')
const visible = (p) => filter.value === 'all' || state(p) === filter.value
</script>

<template>
  <main class="lq-page">
    <h1 class="h3 mb-1">City Codex</h1>
    <p class="text-muted small">Singapore · {{ stampedTotal }} stamped · {{ seenTotal }} seen · {{ total }} total</p>
    <div class="progress mb-3" style="height: 12px" role="progressbar" :aria-valuenow="stampedTotal" aria-valuemin="0" :aria-valuemax="total">
      <div class="progress-bar bg-danger" :style="{ width: (stampedTotal / total) * 100 + '%' }"></div>
      <div class="progress-bar" :style="{ width: ((seenTotal - stampedTotal) / total) * 100 + '%', background: 'var(--lq-teal)', opacity: 0.5 }"></div>
    </div>
    <div class="d-flex gap-2 mb-3">
      <button v-for="f in ['all', 'stamped', 'seen', 'unknown']" :key="f" class="lq-chip text-capitalize" :class="{ active: filter === f }" @click="filter = f">{{ f === 'unknown' ? 'undiscovered' : f }}</button>
    </div>

    <section v-for="g in groups" :key="g.id" class="mb-3">
      <div class="lq-section-title">
        <span class="area-glyph" :style="{ color: g.ink }">{{ g.glyph }}</span> {{ g.id }}
        <span class="ms-auto tiny text-muted mono">{{ g.stamped }}/{{ g.places.length }}</span>
      </div>
      <div class="codex-grid">
        <RouterLink v-for="p in g.places.filter(visible)" :key="p.id" :to="`/place/${p.id}`" class="cell" :class="state(p)">
          <span class="icon">
            <i v-if="state(p) === 'stamped'" class="bi bi-patch-check-fill"></i>
            <i v-else-if="state(p) === 'seen'" class="bi bi-eye"></i>
            <i v-else class="bi bi-question-lg"></i>
          </span>
          <span class="name">{{ state(p) === 'unknown' ? '???' : p.name }}</span>
        </RouterLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.area-glyph { font-size: 1.3rem; }
.codex-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 8px; }
.cell { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px 6px; border-radius: 16px; border: 2px solid var(--lq-line); background: var(--lq-card); text-decoration: none; color: var(--lq-ink); text-align: center; }
.cell .icon { width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; background: var(--lq-bg); font-size: 1.2rem; color: var(--lq-muted); }
.cell.stamped { border-color: #e7b3ad; }
.cell.stamped .icon { background: #c0392b; color: #fff; }
.cell.seen .icon { color: var(--lq-teal); }
.cell.unknown .name { color: var(--lq-muted); letter-spacing: 0.2em; }
.name { font-size: 0.75rem; font-weight: 800; line-height: 1.15; }
</style>
