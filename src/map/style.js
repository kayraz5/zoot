/**
 * Pastel "toy diorama" MapLibre style on OpenFreeMap vector tiles (OpenMapTiles schema).
 * Free, no key. Shrey's lane: tweak colours here, not in components.
 */
const PALETTES = {
  day: {
    ground: '#e4f3dc', residential: '#e9f1dc', commercial: '#f2ecdf', industrial: '#e6e8e2',
    grass: '#bfe6a6', wood: '#a3d98c', sand: '#fbe6ae', park: '#b6e39c',
    water: '#77cfee', waterLine: '#a7e6fa', aeroway: '#d9e3ea', runway: '#c9d4dc',
    roadMajor: '#fffdf4', roadMinor: '#ffffff', roadCasing: '#c7dcc0', path: '#f3c98d', rail: '#b9b2c9',
    b0: '#fff6ea', b1: '#ffe8d2', b2: '#f5dbff', b3: '#dbe5ff', bOpacity: 0.82,
    label: '#3e5963', labelHalo: '#ffffff',
    sky: { 'sky-color': '#8fd6ff', 'horizon-color': '#e8f7ff', 'fog-color': '#e8f7ff', 'sky-horizon-blend': 0.6, 'horizon-fog-blend': 0.6, 'fog-ground-blend': 0.25, 'atmosphere-blend': 0.2 }
  },
  night: {
    ground: '#172a35', residential: '#1b2f3a', commercial: '#20313d', industrial: '#1c2a33',
    grass: '#1f4034', wood: '#1a3a2d', sand: '#3a3a2c', park: '#21453a',
    water: '#1d5d86', waterLine: '#2c7fb0', aeroway: '#223543', runway: '#2b4152',
    roadMajor: '#7a92b8', roadMinor: '#4a6082', roadCasing: '#10202a', path: '#8d6f4c', rail: '#5a5470',
    b0: '#2c4063', b1: '#3a4d80', b2: '#4f4a8f', b3: '#5f58a8', bOpacity: 0.8,
    label: '#cfe3ff', labelHalo: '#0e1a20',
    sky: { 'sky-color': '#0b1630', 'horizon-color': '#27406b', 'fog-color': '#1a2c48', 'sky-horizon-blend': 0.6, 'horizon-fog-blend': 0.6, 'fog-ground-blend': 0.3, 'atmosphere-blend': 0.15 }
  }
}

const name = ['coalesce', ['get', 'name:en'], ['get', 'name_en'], ['get', 'name']]

export function questStyle({ dark = false } = {}) {
  const c = dark ? PALETTES.night : PALETTES.day
  return {
    version: 8,
    name: 'LayQuest Toy City',
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: {
      omt: { type: 'vector', url: 'https://tiles.openfreemap.org/planet', attribution: '© OpenStreetMap contributors · OpenFreeMap' }
    },
    sky: c.sky,
    light: { anchor: 'map', color: '#ffffff', intensity: dark ? 0.25 : 0.38, position: [1.3, 215, 35] },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': c.ground } },
      {
        id: 'landuse', type: 'fill', source: 'omt', 'source-layer': 'landuse',
        paint: {
          'fill-color': ['match', ['get', 'class'], ['residential', 'suburb', 'neighbourhood'], c.residential, ['commercial', 'retail'], c.commercial, ['industrial', 'railway'], c.industrial, c.residential],
          'fill-opacity': 0.8
        }
      },
      {
        id: 'landcover', type: 'fill', source: 'omt', 'source-layer': 'landcover',
        paint: { 'fill-color': ['match', ['get', 'class'], 'wood', c.wood, 'sand', c.sand, c.grass], 'fill-opacity': 0.9 }
      },
      { id: 'park', type: 'fill', source: 'omt', 'source-layer': 'park', paint: { 'fill-color': c.park, 'fill-opacity': 0.85 } },
      { id: 'aeroway-area', type: 'fill', source: 'omt', 'source-layer': 'aeroway', filter: ['==', ['geometry-type'], 'Polygon'], paint: { 'fill-color': c.aeroway } },
      {
        id: 'aeroway-runway', type: 'line', source: 'omt', 'source-layer': 'aeroway', filter: ['all', ['==', ['geometry-type'], 'LineString'], ['in', ['get', 'class'], ['literal', ['runway', 'taxiway']]]],
        paint: { 'line-color': c.runway, 'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 11, 2, 16, 40] }
      },
      { id: 'water-glow', type: 'line', source: 'omt', 'source-layer': 'water', paint: { 'line-color': c.waterLine, 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1, 17, 6], 'line-blur': 2 } },
      { id: 'water', type: 'fill', source: 'omt', 'source-layer': 'water', paint: { 'fill-color': c.water } },
      { id: 'waterway', type: 'line', source: 'omt', 'source-layer': 'waterway', paint: { 'line-color': c.water, 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1, 17, 5] } },
      {
        id: 'road-casing', type: 'line', source: 'omt', 'source-layer': 'transportation',
        filter: ['all', ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary', 'secondary', 'tertiary']]], ['!=', ['get', 'brunnel'], 'tunnel']],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': c.roadCasing, 'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 12, 2, 17, 22] }
      },
      {
        id: 'road-minor', type: 'line', source: 'omt', 'source-layer': 'transportation',
        filter: ['all', ['in', ['get', 'class'], ['literal', ['minor', 'service']]], ['!=', ['get', 'brunnel'], 'tunnel']], minzoom: 13,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': c.roadMinor, 'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 13, 0.8, 17, 9], 'line-opacity': 0.95 }
      },
      {
        id: 'road-path', type: 'line', source: 'omt', 'source-layer': 'transportation',
        filter: ['in', ['get', 'class'], ['literal', ['path', 'track']]], minzoom: 15,
        paint: { 'line-color': c.path, 'line-width': ['interpolate', ['linear'], ['zoom'], 15, 1, 18, 3], 'line-dasharray': [2, 1.5] }
      },
      {
        id: 'road-major', type: 'line', source: 'omt', 'source-layer': 'transportation',
        filter: ['all', ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary', 'secondary', 'tertiary']]], ['!=', ['get', 'brunnel'], 'tunnel']],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': c.roadMajor, 'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 12, 1, 17, 16] }
      },
      {
        id: 'rail', type: 'line', source: 'omt', 'source-layer': 'transportation',
        filter: ['all', ['in', ['get', 'class'], ['literal', ['rail', 'transit']]], ['!=', ['get', 'brunnel'], 'tunnel']],
        paint: { 'line-color': c.rail, 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1, 17, 4], 'line-dasharray': [3, 2] }
      },
      {
        id: 'buildings-3d', type: 'fill-extrusion', source: 'omt', 'source-layer': 'building', minzoom: 14.5,
        paint: {
          'fill-extrusion-color': ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 8], 0, c.b0, 30, c.b1, 90, c.b2, 200, c.b3],
          // Toy-city heights: √h × 4 turns a 250 m tower into ~63 m so the traveller is never swallowed.
          'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14.5, 0, 15.2, ['*', ['sqrt', ['coalesce', ['get', 'render_height'], 8]], 4]],
          'fill-extrusion-base': ['*', ['sqrt', ['coalesce', ['get', 'render_min_height'], 0]], 4],
          'fill-extrusion-opacity': c.bOpacity,
          'fill-extrusion-vertical-gradient': true
        }
      },
      {
        id: 'place-labels', type: 'symbol', source: 'omt', 'source-layer': 'place',
        filter: ['in', ['get', 'class'], ['literal', ['suburb', 'quarter', 'neighbourhood', 'city', 'island']]],
        layout: {
          'text-field': name, 'text-font': ['Noto Sans Bold'], 'text-size': ['interpolate', ['linear'], ['zoom'], 11, 11, 16, 15],
          'text-transform': 'uppercase', 'text-letter-spacing': 0.12, 'text-max-width': 8
        },
        paint: { 'text-color': c.label, 'text-halo-color': c.labelHalo, 'text-halo-width': 2, 'text-opacity': 0.85 }
      },
      {
        id: 'road-labels', type: 'symbol', source: 'omt', 'source-layer': 'transportation_name', minzoom: 16,
        filter: ['in', ['get', 'class'], ['literal', ['primary', 'secondary', 'tertiary']]],
        layout: { 'symbol-placement': 'line', 'text-field': name, 'text-font': ['Noto Sans Regular'], 'text-size': 11 },
        paint: { 'text-color': c.label, 'text-halo-color': c.labelHalo, 'text-halo-width': 1.5, 'text-opacity': 0.7 }
      }
    ]
  }
}
