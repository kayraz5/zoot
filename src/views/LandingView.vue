<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user.js'
import { useUiStore } from '../stores/ui.js'

const router = useRouter()
const user = useUserStore()
const ui = useUiStore()

function start() {
  router.push('/plan')
}

const steps = [
  { icon: 'bi-clock-history', title: 'Plan to the clock', text: 'Tell us where you land and when you must be back. Buffers for immigration and a safety margin come off the top.' },
  { icon: 'bi-signpost-split', title: 'Get a quest, not a list', text: 'Stops are clustered so you never zig-zag. MRT legs are timed. If it cannot get you back, it refuses.' },
  { icon: 'bi-geo-alt', title: 'Play it on the street', text: 'A tilted 3D city, your traveller, a dotted path. Walk into a stop’s zone and slam a passport chop.' }
]
</script>

<template>
  <main class="landing">
    <header class="top d-flex align-items-center justify-content-between px-3 py-3">
      <div class="brand"><img src="/favicon.svg" alt="" width="34" height="34" /> LayQuest</div>
      <div class="d-flex gap-2">
        <button class="btn btn-soft btn-sm" @click="ui.toggleTheme()" :aria-label="`Switch to ${ui.theme === 'dark' ? 'light' : 'dark'} mode`">
          <i class="bi" :class="ui.theme === 'dark' ? 'bi-sun' : 'bi-moon-stars'"></i>
        </button>
        <RouterLink v-if="!user.isAuthed" to="/auth" class="btn btn-soft btn-sm">Sign in</RouterLink>
        <RouterLink v-else to="/map" class="btn btn-soft btn-sm">Open map</RouterLink>
      </div>
    </header>

    <section class="hero container">
      <div class="row align-items-center g-4">
        <div class="col-lg-6">
          <span class="lq-pill sun mb-3"><i class="bi bi-airplane"></i> Singapore Changi · first city</span>
          <h1 class="display-5 fw-bold mb-3">Your layover,<br /><span class="accent">already quested.</span></h1>
          <p class="lead text-muted mb-4">Turn 6–14 spare hours into a timed walking quest across Singapore. Planned to the minute, played on the street, and it always gets you back to the gate.</p>
          <div class="d-flex flex-wrap gap-3 align-items-center">
            <button class="btn btn-primary btn-lg px-4" @click="start"><i class="bi bi-play-fill"></i> Start a layover</button>
            <RouterLink to="/place/supertree-grove" class="btn btn-link fw-bold">Peek at a stop →</RouterLink>
          </div>
          <div class="d-flex gap-4 mt-4 stats">
            <div><b class="mono">89</b><span>SG stops</span></div>
            <div><b class="mono">90′</b><span>airport buffer</span></div>
            <div><b class="mono">4</b><span>travel styles</span></div>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="diorama" aria-hidden="true">
            <svg viewBox="0 0 400 300">
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9f2dc" /><stop offset="1" stop-color="#9fdcc0" /></linearGradient>
              </defs>
              <polygon points="200,40 380,140 200,240 20,140" fill="url(#g1)" />
              <polygon points="20,140 200,240 200,262 20,162" fill="#7cc7a6" />
              <polygon points="380,140 200,240 200,262 380,162" fill="#5fb38f" />
              <path d="M250,95 C300,120 320,140 330,150 L350,140 C330,120 300,100 270,86 Z" fill="#7fd3ef" />
              <g class="bldg"><polygon points="120,120 150,105 180,120 150,135" fill="#fff3e3" /><polygon points="120,120 150,135 150,75 120,60" fill="#ffe0c2" /><polygon points="180,120 150,135 150,75 180,60" fill="#ffd3ad" /><polygon points="120,60 150,45 180,60 150,75" fill="#fff8ef" /></g>
              <g class="bldg"><polygon points="215,160 235,150 255,160 235,170" fill="#efe4ff" /><polygon points="215,160 235,170 235,110 215,100" fill="#e0d0ff" /><polygon points="255,160 235,170 235,110 255,100" fill="#d2bcff" /><polygon points="215,100 235,90 255,100 235,110" fill="#f6efff" /></g>
              <g class="bldg"><polygon points="90,160 105,152 120,160 105,168" fill="#e3f1ff" /><polygon points="90,160 105,168 105,138 90,130" fill="#cfe5ff" /><polygon points="120,160 105,168 105,138 120,130" fill="#bcd9ff" /><polygon points="90,130 105,122 120,130 105,138" fill="#f1f8ff" /></g>
              <path class="path" d="M110,190 Q160,210 200,190 T290,160 T330,125" fill="none" stroke="#ff6b5b" stroke-width="5" stroke-linecap="round" stroke-dasharray="1 12" />
              <g class="totem next"><ellipse cx="290" cy="160" rx="16" ry="7" fill="rgba(255,107,91,.25)" /><rect x="287" y="120" width="6" height="40" rx="3" fill="#fff" /><circle cx="290" cy="116" r="11" fill="#ff6b5b" stroke="#fff" stroke-width="3" /></g>
              <g class="totem"><rect x="327" y="95" width="6" height="30" rx="3" fill="#fff" /><circle cx="330" cy="92" r="9" fill="#12b3a8" stroke="#fff" stroke-width="3" /></g>
              <g class="avatar"><ellipse cx="110" cy="192" rx="10" ry="4" fill="rgba(0,0,0,.18)" /><rect x="103" y="165" width="14" height="22" rx="7" fill="#12b3a8" /><circle cx="110" cy="160" r="8" fill="#ffd9b8" /><path d="M101,157 a9,6 0 0,1 18,0 l3,1 h-24 z" fill="#ff6b5b" /><rect x="114" y="168" width="7" height="12" rx="2" fill="#ffd166" /></g>
            </svg>
            <div class="hud-demo lq-glass">
              <div class="tiny text-muted fw-800">TIME TO GATE</div>
              <div class="mono fw-800">5:42:10</div>
            </div>
            <div class="card-demo lq-glass">
              <div class="tiny text-muted">Next stop · walk 8 min · stay 45</div>
              <div class="fw-800">Maxwell Food Centre</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="container py-5">
      <div class="row g-3">
        <div v-for="s in steps" :key="s.title" class="col-md-4">
          <div class="lq-card p-4 h-100">
            <div class="step-icon mb-3"><i class="bi" :class="s.icon"></i></div>
            <h2 class="h5">{{ s.title }}</h2>
            <p class="text-muted mb-0">{{ s.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="container pb-5">
      <div class="lq-card p-4 jackson">
        <div class="row g-4 align-items-center">
          <div class="col-md-5">
            <span class="lq-pill violet mb-2">Golden path</span>
            <h2 class="h4">Jackson has 8 hours at T3.</h2>
            <p class="text-muted mb-0">First time in Singapore, wants hawker food, one iconic view and zero risk. LayQuest takes 90 minutes of airport buffers off the top, plans the rest, and turns the Gardens leg indoor if the rain radar lights up.</p>
          </div>
          <div class="col-md-7">
            <ol class="mini-timeline list-unstyled mb-0">
              <li><b class="mono">10:00</b> Land at T3 · 30 min to clear immigration</li>
              <li><b class="mono">10:30</b> <span class="lq-pill violet">MRT</span> Into town, every leg timed</li>
              <li><b class="mono">13:00</b> Hawker lunch, then Gardens by the Bay (domes if it rains)</li>
              <li><b class="mono">16:30</b> Back at T3 · <span class="lq-pill coral">90 min buffer</span></li>
            </ol>
          </div>
        </div>
      </div>
    </section>

    <footer class="container pb-5 text-center tiny text-muted">
      SMU IS216 · G3 Group 4 · Built with Vue 3, Bootstrap 5, MapLibre GL, Three.js, Turf, Supabase and Groq. Map data © OpenStreetMap contributors, tiles by OpenFreeMap.
    </footer>
  </main>
</template>

<style scoped>
.landing { min-height: 100vh; background: radial-gradient(1200px 500px at 80% -10%, rgba(18, 179, 168, 0.18), transparent), radial-gradient(900px 400px at -10% 10%, rgba(255, 209, 102, 0.22), transparent); }
.brand { font-family: 'Fredoka', sans-serif; font-weight: 700; font-size: 1.35rem; display: flex; align-items: center; gap: 8px; }
.hero { padding-top: 24px; }
.accent { background: linear-gradient(90deg, var(--lq-teal), var(--lq-violet)); -webkit-background-clip: text; background-clip: text; color: transparent; }
.stats div { display: flex; flex-direction: column; }
.stats b { font-family: 'Fredoka', sans-serif; font-size: 1.6rem; }
.stats span { font-size: 0.8rem; color: var(--lq-muted); font-weight: 700; }
.diorama { position: relative; max-width: 520px; margin: 0 auto; }
.diorama svg { width: 100%; filter: drop-shadow(0 30px 40px rgba(11, 125, 118, 0.25)); }
.path { animation: dash 1.2s linear infinite; }
@keyframes dash { to { stroke-dashoffset: -26; } }
.totem.next circle { animation: lq-bob 1.4s ease-in-out infinite; transform-box: fill-box; }
.avatar { animation: walk 5s ease-in-out infinite alternate; }
@keyframes walk { from { transform: translate(0, 0); } to { transform: translate(40px, 8px); } }
.hud-demo { position: absolute; top: 8%; right: 2%; padding: 8px 14px; border-radius: 14px; }
.card-demo { position: absolute; bottom: 4%; left: 4%; padding: 10px 14px; border-radius: 14px; }
.step-icon { width: 48px; height: 48px; border-radius: 14px; display: grid; place-items: center; font-size: 1.4rem; background: rgba(18, 179, 168, 0.12); color: var(--lq-teal-deep); }
.mini-timeline li { padding: 10px 0 10px 18px; border-left: 3px dotted var(--lq-teal); position: relative; }
.mini-timeline li::before { content: ''; position: absolute; left: -8px; top: 14px; width: 13px; height: 13px; border-radius: 50%; background: var(--lq-teal); border: 3px solid var(--lq-card); }
.mini-timeline b { margin-right: 8px; }
</style>
