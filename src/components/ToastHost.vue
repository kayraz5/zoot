<script setup>
import { useUiStore } from '../stores/ui.js'
const ui = useUiStore()
const cls = { success: 'text-bg-success', warning: 'text-bg-warning', danger: 'text-bg-danger', dark: 'text-bg-dark', info: 'text-bg-info' }
</script>

<template>
  <div class="lq-toasts" role="status" aria-live="polite">
    <div v-for="t in ui.toasts" :key="t.id" class="lq-toast" :class="cls[t.variant] || cls.dark">{{ t.message }}</div>
  </div>
</template>
