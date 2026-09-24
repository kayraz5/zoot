<script setup>
import { computed } from 'vue'

/**
 * Procedural postcard art for a place: area palette + category icon.
 * Replace with a real photo by setting `image_url` in the places table (Hulbert's content lane).
 */
const props = defineProps({ place: { type: Object, required: true }, height: { type: Number, default: 160 }, rounded: { type: Boolean, default: true } })

const PALETTES = {
  Changi: ['#9be7ff', '#d8c8ff'], 'Marina Bay': ['#ffb88c', '#8ec5ff'], 'Civic District': ['#c8b6ff', '#ffd6a5'],
  Chinatown: ['#ff9a8b', '#ffd166'], 'Tiong Bahru': ['#a8e6cf', '#dcedc1'], 'Kampong Glam': ['#ffd166', '#06d6a0'],
  'Little India': ['#ff8fab', '#ffc6ff'], Orchard: ['#b9fbc0', '#98f5e1'], Tanglin: ['#95d5b2', '#d8f3dc'],
  'East Coast': ['#90e0ef', '#caf0f8'], HarbourFront: ['#48cae4', '#ade8f4'], Sentosa: ['#ffe066', '#72efdd'],
  West: ['#e9c46a', '#f4a261'], North: ['#b7e4c7', '#74c69d']
}
const ICONS = {
  hawker: 'bi-egg-fried', food: 'bi-cup-hot', gardens: 'bi-flower1', views: 'bi-binoculars', museum: 'bi-easel', temple: 'bi-bank2',
  heritage: 'bi-hourglass-split', nightlife: 'bi-moon-stars', shopping: 'bi-bag-heart', beach: 'bi-water', nature: 'bi-tree',
  photo: 'bi-camera', architecture: 'bi-buildings', art: 'bi-palette', coffee: 'bi-cup-straw', culture: 'bi-globe-asia-australia',
  family: 'bi-emoji-smile', rides: 'bi-rocket-takeoff'
}
const colors = computed(() => PALETTES[props.place.area] || ['#a0e7e5', '#b4f8c8'])
const icon = computed(() => ICONS[props.place.tags?.[0]] || 'bi-geo-alt')
const seed = computed(() => [...props.place.id].reduce((s, ch) => s + ch.charCodeAt(0), 0))
const bars = computed(() => Array.from({ length: 9 }, (_, i) => 18 + ((seed.value * (i + 3)) % 46)))
</script>

<template>
  <div class="art" :class="{ rounded }" :style="{ height: height + 'px', '--a': colors[0], '--b': colors[1] }" role="img" :aria-label="place.name">
    <img v-if="place.image_url" :src="place.image_url" :alt="place.name" class="photo" loading="lazy" />
    <template v-else>
      <div class="sun"></div>
      <div class="skyline">
        <span v-for="(h, i) in bars" :key="i" :style="{ height: h + '%' }"></span>
      </div>
      <i class="bi glyph" :class="icon" aria-hidden="true"></i>
    </template>
    <span class="area-tag">{{ place.area }}</span>
  </div>
</template>

<style scoped>
.art { position: relative; overflow: hidden; background: linear-gradient(135deg, var(--a), var(--b)); }
.art.rounded { border-radius: 18px; }
.photo { width: 100%; height: 100%; object-fit: cover; }
.sun { position: absolute; width: 38%; aspect-ratio: 1; border-radius: 50%; right: 8%; top: 12%; background: rgba(255, 255, 255, 0.45); }
.skyline { position: absolute; left: 0; right: 0; bottom: 0; height: 55%; display: flex; align-items: flex-end; gap: 4%; padding: 0 6%; opacity: 0.35; }
.skyline span { flex: 1; background: #fff; border-radius: 6px 6px 0 0; }
.glyph { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); font-size: 3.2rem; color: #fff; text-shadow: 0 4px 14px rgba(0, 0, 0, 0.18); }
.area-tag { position: absolute; left: 10px; bottom: 10px; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #fff; background: rgba(0, 0, 0, 0.22); padding: 3px 9px; border-radius: 999px; }
</style>
