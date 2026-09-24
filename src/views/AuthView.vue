<script setup>
import { ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user.js'

const user = useUserStore()
const route = useRoute()
const router = useRouter()
const email = ref('')
const name = ref('')
const sent = ref(false)
const busy = ref(false)
const error = ref('')

const next = () => (typeof route.query.next === 'string' ? route.query.next : '/plan')

// After the magic link lands back here, Supabase sets the session → move on.
watchEffect(() => {
  if (user.isAuthed) router.replace(user.needsOnboarding ? { name: 'onboard', query: { next: next() } } : next())
})

async function sendLink() {
  error.value = ''
  busy.value = true
  try {
    await user.sendMagicLink(email.value.trim())
    sent.value = true
  } catch (err) {
    error.value = err.message
  } finally {
    busy.value = false
  }
}

async function guest() {
  busy.value = true
  await user.continueAsGuest(name.value.trim() || 'Field Traveller')
  busy.value = false
}
</script>

<template>
  <main class="lq-page" style="max-width: 460px">
    <RouterLink to="/" class="btn btn-link px-0 mb-2"><i class="bi bi-arrow-left"></i> Back</RouterLink>
    <div class="lq-card p-4">
      <h1 class="h3 mb-1">Board the quest</h1>
      <p class="text-muted">Your stamps, XP and passport follow your account.</p>

      <form v-if="user.canUseEmail && !sent" @submit.prevent="sendLink" class="mb-3">
        <label class="form-label" for="email">Email magic link</label>
        <input id="email" v-model="email" type="email" required class="form-control mb-2" placeholder="you@smu.edu.sg" autocomplete="email" />
        <button class="btn btn-primary w-100" :disabled="busy || !email">Send me a link</button>
      </form>
      <div v-else-if="sent" class="alert alert-success">
        <i class="bi bi-envelope-check"></i> Check <b>{{ email }}</b> and tap the link on this device.
      </div>
      <div v-else class="alert alert-info tiny mb-3">
        <i class="bi bi-info-circle"></i> Email sign-in turns on when <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> are set. Guest mode saves on this device.
      </div>
      <p v-if="error" class="text-danger small">{{ error }}</p>

      <div class="divider my-3"><span>or</span></div>

      <label class="form-label" for="name">Play as guest</label>
      <input id="name" v-model="name" class="form-control mb-2" placeholder="Traveller name (optional)" maxlength="32" />
      <button class="btn btn-coral w-100" :disabled="busy" @click="guest"><i class="bi bi-person-walking"></i> Continue as guest</button>
      <p class="tiny text-muted mt-2 mb-0">Guest data stays in this browser. Nothing is sent anywhere.</p>
    </div>
  </main>
</template>

<style scoped>
.divider { display: flex; align-items: center; gap: 10px; color: var(--lq-muted); font-weight: 800; font-size: 0.8rem; }
.divider::before, .divider::after { content: ''; flex: 1; height: 2px; background: var(--lq-line); }
</style>
