<script setup>
import { computed } from 'vue'
import { useUiStore } from '../stores/ui.js'
import { describeCode } from '../lib/weather.js'
import { tick } from '../lib/clock.js'

const ui = useUiStore()
const hour = computed(() => ui.weather?.hours?.find((h) => tick.value >= h.ms && tick.value < h.ms + 3600000))
const info = computed(() => {
  if (ui.forceRain) return { icon: 'bi-cloud-rain-heavy', label: 'Heavy rain (dev)', prob: 90, temp: null }
  if (!ui.weather) return null
  const d = describeCode(ui.weather.current.code)
  return { ...d, prob: hour.value?.prob ?? 0, temp: Math.round(ui.weather.current.temp) }
})
const wet = computed(() => info.value && info.value.prob > 60)
</script>

<template>
  <div v-if="info" class="wx" :class="{ wet }" :title="`${info.label}, ${info.prob}% rain chance this hour`">
    <i class="bi" :class="info.icon"></i>
    <span v-if="info.temp != null" class="mono">{{ info.temp }}°</span>
    <span class="prob mono"><i class="bi bi-droplet-fill"></i>{{ info.prob }}%</span>
  </div>
</template>

<style scoped>
.wx { display: inline-flex; align-items: center; gap: 6px; padding: 6px 11px; border-radius: 999px; background: var(--lq-glass); backdrop-filter: blur(10px); font-weight: 800; font-size: 0.85rem; box-shadow: var(--lq-shadow); color: var(--lq-ink); }
.wx .bi:first-child { font-size: 1.05rem; color: #f4a300; }
.wx.wet { background: #2f7de1; color: #fff; }
.wx.wet .bi:first-child { color: #fff; }
.prob { opacity: 0.8; font-size: 0.78rem; }
</style>
