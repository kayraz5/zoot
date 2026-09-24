<script setup>
import { computed } from 'vue'
import { tick } from '../lib/clock.js'
import { fmtTime } from '../lib/hours.js'

/** Always-visible countdown. Amber under 90 min, red under 45 (IA §7.1). */
const props = defineProps({
  mustReturnMs: { type: Number, required: true },
  leaveByMs: { type: Number, default: null },
  label: { type: String, default: 'Time to gate' }
})
const remaining = computed(() => props.mustReturnMs - tick.value)
const minutes = computed(() => remaining.value / 60000)
const level = computed(() => (minutes.value < 45 ? 'red' : minutes.value < 90 ? 'amber' : 'ok'))
const text = computed(() => {
  const s = Math.max(0, Math.floor(remaining.value / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
})
const leaveSoon = computed(() => props.leaveByMs && props.leaveByMs - tick.value < 15 * 60000)
</script>

<template>
  <div class="ttg" :class="level" role="timer" :aria-label="`${label} ${text}`">
    <div class="lbl"><i class="bi bi-airplane"></i> {{ label }}</div>
    <div class="val mono">{{ text }}</div>
    <div v-if="leaveByMs" class="leave" :class="{ soon: leaveSoon }">Head back by {{ fmtTime(leaveByMs) }}</div>
  </div>
</template>

<style scoped>
.ttg { border-radius: 16px; padding: 6px 12px; color: #fff; background: linear-gradient(135deg, #12b3a8, #0b7d76); box-shadow: 0 6px 16px rgba(11, 125, 118, 0.35); min-width: 128px; }
.ttg.amber { background: linear-gradient(135deg, #ffb703, #fb8500); box-shadow: 0 6px 16px rgba(251, 133, 0, 0.35); }
.ttg.red { background: linear-gradient(135deg, #ff5d5d, #d62828); box-shadow: 0 6px 16px rgba(214, 40, 40, 0.4); animation: lq-pulse 1.2s infinite; }
.lbl { font-size: 0.66rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.92; }
.val { font-family: 'Fredoka', sans-serif; font-size: 1.45rem; font-weight: 700; line-height: 1.1; }
.leave { font-size: 0.72rem; font-weight: 700; opacity: 0.95; }
.leave.soon { background: rgba(0, 0, 0, 0.2); border-radius: 6px; padding: 0 4px; }
</style>
