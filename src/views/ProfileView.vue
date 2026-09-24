<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user.js'
import { usePassportStore } from '../stores/passport.js'
import { useUiStore } from '../stores/ui.js'
import { STYLES } from '../data/origins.js'
import { DEV_PANEL } from '../lib/config.js'

const user = useUserStore()
const passport = usePassportStore()
const ui = useUiStore()
const router = useRouter()
const editing = ref(false)
const name = ref(user.profile?.display_name || '')
const style = computed(() => STYLES[user.profile?.style] || STYLES.budget)
const COVERS = ['#0e6f69', '#1f3c88', '#7a1f3d', '#2d5a27', '#5b2a86', '#8a4b08']

async function saveName() {
  await user.updateProfile({ display_name: name.value.trim() || 'Field Traveller' })
  editing.value = false
}
async function signOut() {
  await user.signOut()
  router.push('/')
}
</script>

<template>
  <main class="lq-page">
    <section class="lq-card p-4 text-center hero">
      <div class="avatar mx-auto mb-2" :style="{ background: user.profile?.cover_color || '#0e6f69' }">
        <i class="bi bi-person-walking"></i>
        <span class="lvl">L{{ user.level.level }}</span>
      </div>
      <div v-if="!editing" class="d-flex justify-content-center align-items-center gap-2">
        <h1 class="h4 mb-0">{{ user.profile?.display_name }}</h1>
        <button class="btn btn-sm btn-link p-0" @click="editing = true" aria-label="Edit name"><i class="bi bi-pencil"></i></button>
      </div>
      <form v-else class="d-flex gap-2 justify-content-center" @submit.prevent="saveName">
        <input v-model="name" class="form-control form-control-sm" style="max-width: 200px" maxlength="32" aria-label="Display name" />
        <button class="btn btn-sm btn-primary">Save</button>
      </form>
      <div class="text-muted small">{{ user.title }} · <i class="bi" :class="style.icon"></i> {{ style.label }} traveller</div>
      <div class="xp mt-3">
        <div class="d-flex justify-content-between tiny fw-800"><span>{{ user.profile?.xp || 0 }} XP</span><span>L{{ user.level.level + 1 }} at {{ user.level.next }}</span></div>
        <div class="progress" style="height: 10px"><div class="progress-bar bg-warning" :style="{ width: user.level.progress * 100 + '%' }"></div></div>
      </div>
      <div class="row g-2 mt-3 stats">
        <div class="col"><b>{{ passport.stamps.length }}</b><span>stamps</span></div>
        <div class="col"><b>{{ passport.chopCount }}</b><span>chops</span></div>
        <div class="col"><b>{{ passport.seen.size }}</b><span>places seen</span></div>
      </div>
    </section>

    <section class="lq-card p-3 mt-3">
      <div class="small fw-800 mb-2">Passport cover</div>
      <div class="d-flex gap-2">
        <button v-for="c in COVERS" :key="c" class="swatch" :class="{ active: user.profile?.cover_color === c }" :style="{ background: c }" :aria-label="`Cover colour ${c}`" @click="user.updateProfile({ cover_color: c })"></button>
      </div>
    </section>

    <div class="list-group mt-3 lq-card overflow-hidden">
      <RouterLink to="/codex" class="list-group-item list-group-item-action"><i class="bi bi-grid-3x3-gap"></i> City Codex</RouterLink>
      <RouterLink to="/swipe" class="list-group-item list-group-item-action"><i class="bi bi-gem"></i> Sidequest deck</RouterLink>
      <RouterLink to="/plan" class="list-group-item list-group-item-action"><i class="bi bi-plus-circle"></i> Plan a new layover</RouterLink>
      <RouterLink to="/onboard" class="list-group-item list-group-item-action"><i class="bi bi-shuffle"></i> Retake the style quiz</RouterLink>
      <RouterLink to="/party" class="list-group-item list-group-item-action"><i class="bi bi-people"></i> Quest parties <span class="lq-pill sun ms-1">Soon</span></RouterLink>
      <button class="list-group-item list-group-item-action" @click="ui.toggleTheme()"><i class="bi" :class="ui.theme === 'dark' ? 'bi-sun' : 'bi-moon-stars'"></i> {{ ui.theme === 'dark' ? 'Light' : 'Dark' }} mode</button>
      <RouterLink v-if="DEV_PANEL" to="/dev" class="list-group-item list-group-item-action"><i class="bi bi-joystick"></i> Dev panel</RouterLink>
    </div>

    <section class="lq-card p-3 mt-3 small">
      <div class="fw-800 mb-1"><i class="bi bi-passport"></i> Entering Singapore on a layover</div>
      <p class="text-muted mb-2">Many passport holders can enter visa-free for short stays, and arrivals must submit the SG Arrival Card before landing. Rules change — always confirm with ICA before you leave the airport.</p>
      <div class="d-flex gap-2 flex-wrap">
        <a class="btn btn-soft btn-sm" href="https://www.ica.gov.sg/enter-transit-depart/entering-singapore" target="_blank" rel="noopener">ICA entry rules</a>
        <a class="btn btn-soft btn-sm" href="https://www.trip.com/flights/" target="_blank" rel="noopener">Search flights</a>
      </div>
    </section>

    <p class="tiny text-muted text-center mt-3">Signed in via {{ user.mode === 'supabase' ? 'Supabase' : 'guest mode (this device)' }}</p>
    <button class="btn btn-outline-danger w-100" @click="signOut"><i class="bi bi-box-arrow-right"></i> Sign out</button>
  </main>
</template>

<style scoped>
.hero { background: radial-gradient(circle at 50% 0%, rgba(18, 179, 168, 0.18), transparent 60%), var(--lq-card); }
.avatar { width: 92px; height: 92px; border-radius: 30px; display: grid; place-items: center; color: #fff; font-size: 2.6rem; position: relative; transform: rotate(-4deg); box-shadow: var(--lq-shadow); }
.lvl { position: absolute; bottom: -8px; right: -8px; background: var(--lq-sun); color: #3b2a00; font-size: 0.8rem; font-weight: 800; border-radius: 999px; padding: 2px 8px; transform: rotate(4deg); }
.stats b { display: block; font-family: 'Fredoka', sans-serif; font-size: 1.5rem; }
.stats span { font-size: 0.75rem; color: var(--lq-muted); font-weight: 800; }
.swatch { width: 36px; height: 36px; border-radius: 10px; border: 3px solid transparent; }
.swatch.active { border-color: var(--lq-sun); }
.list-group-item { display: flex; gap: 10px; align-items: center; font-weight: 700; background: var(--lq-card); border-color: var(--lq-line); color: var(--lq-ink); }
</style>
