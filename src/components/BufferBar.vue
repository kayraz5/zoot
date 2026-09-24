<script setup>
import { computed } from 'vue'
import { fmtDuration } from '../lib/hours.js'

/** The buffers Jackson has to trust, as one proportional bar. */
const props = defineProps({
  windowMin: Number, exitMin: Number, outMin: Number, reentryMin: Number, safetyMin: Number
})
const segs = computed(() => {
  const spare = Math.max(0, props.windowMin - props.exitMin - props.outMin - props.reentryMin - props.safetyMin)
  return [
    { key: 'exit', label: 'Exit immigration', min: props.exitMin, cls: 'exit' },
    { key: 'out', label: 'Out exploring', min: props.outMin, cls: 'out' },
    { key: 'spare', label: 'Spare', min: spare, cls: 'spare' },
    { key: 'reentry', label: 'Check-in + security', min: props.reentryMin, cls: 'reentry' },
    { key: 'safety', label: 'Safety buffer', min: props.safetyMin, cls: 'safety' }
  ].filter((s) => s.min > 0)
})
</script>

<template>
  <div>
    <div class="bar" role="img" :aria-label="segs.map((s) => `${s.label} ${fmtDuration(s.min)}`).join(', ')">
      <div v-for="s in segs" :key="s.key" class="seg" :class="s.cls" :style="{ flexGrow: s.min }" :title="`${s.label}: ${fmtDuration(s.min)}`"></div>
    </div>
    <div class="legend">
      <span v-for="s in segs" :key="s.key"><i :class="s.cls"></i>{{ s.label }} <b class="mono">{{ fmtDuration(s.min) }}</b></span>
    </div>
  </div>
</template>

<style scoped>
.bar { display: flex; height: 16px; border-radius: 999px; overflow: hidden; gap: 2px; background: var(--lq-line); }
.seg { min-width: 6px; }
.exit, .legend i.exit { background: #9aa9b0; }
.out, .legend i.out { background: var(--lq-teal); }
.spare, .legend i.spare { background: repeating-linear-gradient(45deg, #c8efe9, #c8efe9 5px, #e6f8f5 5px, #e6f8f5 10px); }
.reentry, .legend i.reentry { background: var(--lq-sky); }
.safety, .legend i.safety { background: var(--lq-coral); }
.legend { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-top: 8px; font-size: 0.8rem; color: var(--lq-muted); }
.legend i { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 5px; vertical-align: -1px; }
.legend b { color: var(--lq-ink); }
</style>
