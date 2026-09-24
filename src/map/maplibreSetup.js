import { setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'

/**
 * MapLibre v6 loads its tile worker from a URL next to its own module. Vite's
 * dep pre-bundling (dev) and chunking (build) move that file, so we bundle the
 * worker ourselves and hand MapLibre its URL. Import once before creating a map.
 */
setWorkerUrl(workerUrl)
