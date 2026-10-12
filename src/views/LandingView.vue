<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user.js'
import { useUiStore } from '../stores/ui.js'

/** Landing page. Copy and layout follow the Zoot pitch deck (Matthew: design QA). */
const router = useRouter()
const user = useUserStore()
const ui = useUiStore()

const worries = [
  'How much buffer do I need to get back?',
  'No SIM. No clue how the MRT works.',
  'How long will immigration take?'
]
const problems = [
  'Static lists leave travellers to figure out routing, timing and weather.',
  'Layover passengers fear immigration delays, transit confusion and missing their flight.',
  'Guided tours can’t personalise the day for one traveller.'
]
const features = [
  { icon: 'bi-geo-alt-fill', title: '3D quest map', text: 'A tilted toy-city Singapore with your route, the weather and a live countdown to your gate, all on one screen.' },
  { icon: 'bi-stars', title: 'AI place picker', text: 'Tell it your hours and interests. It picks the stops, the app times every leg, and it refuses plans that risk your flight.' },
  { icon: 'bi-patch-check-fill', title: 'Check-ins and XP', text: 'Walk into a stop’s ring, slam a chop into your 3D passport and level up as the trip goes on.' }
]
</script>

<template>
  <main class="landing">
    <section class="hero zt-rays">
      <header class="top container d-flex align-items-center justify-content-between">
        <span class="zt-pill paper">Singapore · Changi</span>
        <div class="d-flex gap-2">
          <button class="btn btn-soft btn-sm" @click="ui.toggleTheme()" :aria-label="`Switch to ${ui.theme === 'dark' ? 'light' : 'dark'} mode`">
            <i class="bi" :class="ui.theme === 'dark' ? 'bi-sun-fill' : 'bi-moon-stars-fill'"></i>
          </button>
          <RouterLink v-if="!user.isAuthed" to="/auth" class="btn btn-soft btn-sm">Sign in</RouterLink>
          <RouterLink v-else to="/map" class="btn btn-soft btn-sm">Open map</RouterLink>
        </div>
      </header>

      <div class="container hero-body">
        <div class="row align-items-center g-4">
          <div class="col-lg-6">
            <img src="/brand/zoot-wordmark.png" alt="Zoot" class="wordmark" width="581" height="282" />
            <p class="tagline">Short layover, just Zoot!</p>
            <h1 class="headline">You land in Singapore.<br />Your flight leaves in <span class="hours">10 hours.</span></h1>
            <p class="lede">Zoot turns those hours into a timed walking quest across the city. Planned to the minute, played on the street, and it always gets you back to the gate.</p>
            <div class="d-flex flex-wrap gap-3 align-items-center">
              <button class="btn btn-pop btn-lg" @click="router.push('/plan')"><i class="bi bi-play-fill"></i> Start a layover</button>
              <RouterLink to="/place/supertree-grove" class="btn btn-soft btn-lg">Peek at a stop</RouterLink>
            </div>
            <div class="stats">
              <div><b>89</b><span>Singapore stops</span></div>
              <div><b>90</b><span>min airport buffer</span></div>
              <div><b>4</b><span>travel styles</span></div>
            </div>
          </div>
          <div class="col-lg-6">
            <div class="scene" aria-hidden="true">
              <img src="/brand/zoot-runner.webp" alt="" class="runner" width="900" height="604" />
              <div v-for="(w, i) in worries" :key="w" class="bubble" :class="'b' + (i + 1)">{{ w }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="container block">
      <h2 class="zt-display block-title">Endless options, ticking clock</h2>
      <ol class="problems list-unstyled">
        <li v-for="(p, i) in problems" :key="p" class="zt-band"><b class="zt-display">{{ i + 1 }}</b><span>{{ p }}</span></li>
      </ol>
    </section>

    <section class="container block">
      <h2 class="zt-display block-title">What is Zoot?</h2>
      <div class="d-flex flex-wrap gap-2 mb-4">
        <span class="zt-pill big">On-the-go trip planner</span>
        <span class="zt-pill big">Designed for short layovers</span>
        <span class="zt-pill big">Interactive planning</span>
      </div>
      <div class="row g-3">
        <div v-for="(f, i) in features" :key="f.title" class="col-md-4">
          <div class="zt-card p-4 h-100 feature">
            <span class="zt-pill mb-3">Feature {{ i + 1 }}</span>
            <div class="feature-icon"><i class="bi" :class="f.icon"></i></div>
            <h3 class="h5 mt-3">{{ f.title }}</h3>
            <p class="text-muted mb-0">{{ f.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="container block">
      <div class="persona">
        <div class="row g-4 align-items-center">
          <div class="col-md-5">
            <span class="zt-pill ink mb-2">Meet Sonion, 21</span>
            <h2 class="zt-display persona-title">What does he do?</h2>
            <p class="mb-0">He stays in the terminal. Not because there’s nothing to do, but because he can’t tell what’s safe to try. With Zoot he gets this instead:</p>
          </div>
          <div class="col-md-7">
            <ol class="timeline list-unstyled mb-0">
              <li><b class="mono">10:00</b> Lands at T3 · 30 min to clear immigration</li>
              <li><b class="mono">10:30</b> <span class="zt-pill ink">MRT</span> Into town, every leg timed</li>
              <li><b class="mono">13:00</b> Hawker lunch, then Gardens by the Bay (domes if it rains)</li>
              <li><b class="mono">16:30</b> Back at T3 · <span class="zt-pill pink">90 min buffer</span></li>
            </ol>
          </div>
        </div>
      </div>
    </section>

    <footer class="container pb-5 text-center tiny text-muted">
      <img src="/brand/zoot-badge-192.png" alt="" width="44" height="44" class="mb-2" /><br />
      SMU IS216 · G3T4 · Built with Vue 3, Bootstrap 5, MapLibre GL, Three.js, Turf, Supabase and Groq.<br />
      Map data © OpenStreetMap contributors, tiles by OpenFreeMap.
    </footer>
  </main>
</template>

<style scoped>
.landing { min-height: 100vh; }
.hero { color: #111; border-bottom: var(--zt-bw) solid #111; padding-bottom: 44px; overflow: hidden; }
.top { padding-top: 16px; padding-bottom: 8px; }
.hero :deep(.btn-soft) { --bs-btn-bg: #fff; --bs-btn-color: #111; --bs-btn-border-color: #111; box-shadow: 0 4px 0 #111; }
.hero :deep(.btn-pop) { --bs-btn-border-color: #111; box-shadow: 0 4px 0 #111; }
.hero :deep(.zt-pill.paper) { background: #fff; color: #111; border-color: #111; }
.hero-body { padding-top: 12px; }
.wordmark { width: min(300px, 62vw); height: auto; display: block; margin-left: -6px; }
.tagline { font-family: var(--zt-font-head); font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; font-size: 1.05rem; margin: 2px 0 18px; }
.headline { font-size: clamp(2.6rem, 7vw, 4.4rem); margin-bottom: 14px; }
.hours { color: var(--zt-orange); white-space: nowrap; }
.lede { font-size: 1.02rem; font-weight: 500; max-width: 34rem; margin-bottom: 22px; }
.stats { display: flex; gap: 26px; margin-top: 26px; }
.stats div { display: flex; flex-direction: column; }
.stats b { font-family: var(--zt-font-display); font-size: 2.4rem; line-height: 1; font-weight: 400; }
.stats span { font-size: 0.68rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }

.scene { position: relative; max-width: 560px; margin: 0 auto; padding: 36px 0 10px; }
.runner { width: 100%; height: auto; display: block; animation: zt-bob 3.2s ease-in-out infinite; }
.bubble {
  position: absolute; max-width: 190px; padding: 9px 13px; background: #fff; color: #111; border: var(--zt-bw) solid #111; border-radius: 18px;
  font-family: var(--zt-font-head); font-weight: 600; font-size: 0.78rem; line-height: 1.2; text-transform: uppercase; box-shadow: 3px 3px 0 #111;
}
.bubble::after { content: ''; position: absolute; width: 14px; height: 14px; background: #fff; border: var(--zt-bw) solid #111; border-top: none; border-left: none; bottom: -9px; left: 26px; transform: rotate(45deg); }
.b1 { top: 0; left: 0; transform: rotate(-4deg); }
.b2 { top: 4%; right: 0; transform: rotate(3deg); }
.b2::after { left: auto; right: 26px; }
.b3 { bottom: 4%; left: 4%; transform: rotate(2deg); }
.b3::after { bottom: auto; top: -9px; border: var(--zt-bw) solid #111; border-bottom: none; border-right: none; }

.block { padding-top: 48px; }
.block-title { font-size: clamp(2.2rem, 6vw, 3.4rem); margin-bottom: 18px; }
.problems { display: grid; gap: 12px; margin: 0; }
.problems li { display: flex; align-items: center; gap: 16px; padding: 14px 18px; font-family: var(--zt-font-head); font-weight: 600; text-transform: uppercase; font-size: 0.95rem; line-height: 1.25; box-shadow: 4px 4px 0 var(--zt-shadow-color); }
.problems b { font-size: 2.4rem; line-height: 1; min-width: 26px; }
.zt-pill.big { font-size: 0.82rem; padding: 6px 16px; border-width: var(--zt-bw); }
.feature-icon { width: 56px; height: 56px; border-radius: 50%; display: grid; place-items: center; font-size: 1.5rem; background: var(--zt-yellow); color: #111; border: var(--zt-bw) solid var(--zt-line); }
.feature .zt-pill { display: inline-flex; }

.persona { background: var(--zt-yellow-soft); color: #111; border: var(--zt-bw) solid #111; border-radius: 26px; padding: 28px; box-shadow: 6px 6px 0 var(--zt-shadow-color); }
.persona-title { font-size: 2.6rem; margin: 4px 0 8px; }
.timeline li { padding: 10px 0 10px 20px; border-left: 3px solid #111; position: relative; font-weight: 500; }
.timeline li::before { content: ''; position: absolute; left: -9px; top: 14px; width: 15px; height: 15px; border-radius: 50%; background: var(--zt-yellow); border: 3px solid #111; }
.timeline b { margin-right: 8px; font-weight: 800; }
footer { padding-top: 48px; }
@media (max-width: 991px) { .scene { padding-top: 56px; } .bubble { font-size: 0.7rem; max-width: 160px; } }
</style>
