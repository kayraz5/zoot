import * as THREE from 'three'
import { MercatorCoordinate } from 'maplibre-gl'
import { createTraveller, createGhost } from './avatar.js'
import { createTotem, createSeal, createToken, createGate } from './markers.js'

/**
 * MapLibre custom layer that renders the Three.js world (Shrey's lane):
 * avatar, stamp totems, chopped seals, sidequest tokens and the home gate.
 *
 * Scene axes: x = east (m), y = up (m), z = south (m), relative to `origin`.
 * Objects are scaled with zoom so they keep a readable, game-like screen size.
 */
export class WorldLayer {
  constructor(origin) {
    this.id = 'lq-world'
    this.type = 'custom'
    this.renderingMode = '3d'
    this.origin = origin
    this.stops = new Map()
    this.tokens = new Map()
    this.avatarPos = null
    this.heading = 0
    this.moving = false
    this.t0 = performance.now()
  }

  onAdd(map, gl) {
    this.map = map
    this.camera = new THREE.Camera()
    this.scene = new THREE.Scene()

    const hemi = new THREE.HemisphereLight(0xffffff, 0x9cc7a4, 2.2)
    const sun = new THREE.DirectionalLight(0xffffff, 1.9)
    sun.position.set(-40, 100, 60)
    this.scene.add(hemi, sun)

    const mc = MercatorCoordinate.fromLngLat([this.origin.lng, this.origin.lat], 0)
    this.originMc = mc
    this.unit = mc.meterInMercatorCoordinateUnits()
    this.base = new THREE.Matrix4()
      .makeTranslation(mc.x, mc.y, mc.z)
      .scale(new THREE.Vector3(this.unit, -this.unit, this.unit))
      .multiply(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2))

    this.avatar = createTraveller()
    this.ghost = createGhost(this.avatar)
    this.avatar.traverse((o) => { if (o.isMesh) o.renderOrder = 2 })
    this.avatarRig = new THREE.Group()
    this.avatarRig.add(this.ghost, this.avatar)
    this.avatarRig.visible = false
    this.scene.add(this.avatarRig)

    this.renderer = new THREE.WebGLRenderer({ canvas: map.getCanvas(), context: gl, antialias: true })
    this.renderer.autoClear = false
  }

  toLocal(lng, lat) {
    const m = MercatorCoordinate.fromLngLat([lng, lat], 0)
    return new THREE.Vector3((m.x - this.originMc.x) / this.unit, 0, (m.y - this.originMc.y) / this.unit)
  }

  setAvatar({ lng, lat, heading = this.heading, moving = false, visible = true }) {
    if (lng == null || lat == null) {
      if (this.avatarRig) this.avatarRig.visible = false
      return
    }
    this.avatarPos = { lng, lat }
    this.heading = heading
    this.moving = moving
    if (!this.avatarRig) return
    this.avatarRig.visible = visible
    this.avatarRig.position.copy(this.toLocal(lng, lat))
    // Shortest-arc turn toward the heading so the traveller never spins the long way.
    const target = -THREE.MathUtils.degToRad(heading)
    const cur = this.avatarRig.rotation.y
    const delta = Math.atan2(Math.sin(target - cur), Math.cos(target - cur))
    this.avatarRig.rotation.y = cur + delta * 0.25
  }

  /** stops: [{ key, lng, lat, status: 'next'|'pending'|'stamped'|'return' }] */
  setStops(stops) {
    if (!this.scene) return
    const keep = new Set()
    for (const s of stops) {
      const key = `${s.key}:${s.status}`
      keep.add(key)
      if (this.stops.has(key)) continue
      const obj = s.status === 'stamped' ? createSeal() : s.status === 'return' ? createGate() : createTotem(s.status)
      obj.position.copy(this.toLocal(s.lng, s.lat))
      obj.traverse((o) => { if (o.isMesh) o.frustumCulled = false })
      this.scene.add(obj)
      this.stops.set(key, obj)
    }
    for (const [key, obj] of this.stops) {
      if (!keep.has(key)) {
        this.scene.remove(obj)
        dispose(obj)
        this.stops.delete(key)
      }
    }
  }

  /** tokens: [{ key, lng, lat, eligible }] */
  setTokens(tokens) {
    if (!this.scene) return
    const keep = new Set()
    tokens.forEach((t, i) => {
      const key = `${t.key}:${t.eligible}`
      keep.add(key)
      if (this.tokens.has(key)) return
      const obj = createToken(t.eligible)
      obj.position.copy(this.toLocal(t.lng, t.lat))
      obj.userData.phase = i * 1.3
      obj.traverse((o) => { if (o.isMesh) o.frustumCulled = false })
      this.scene.add(obj)
      this.tokens.set(key, obj)
    })
    for (const [key, obj] of this.tokens) {
      if (!keep.has(key)) {
        this.scene.remove(obj)
        dispose(obj)
        this.tokens.delete(key)
      }
    }
  }

  render(gl, args) {
    const t = (performance.now() - this.t0) / 1000
    // Keep objects a constant-ish size on screen: big and toy-like when zoomed in, not tiny when zoomed out.
    const k = Math.min(8, Math.max(0.6, Math.pow(2, 16.5 - this.map.getZoom())))
    this.avatarRig.scale.setScalar(24 * k)
    this.avatar.userData.update(t, this.moving)
    this.ghost.userData.update?.(t, this.moving)
    syncPose(this.avatar, this.ghost)
    for (const obj of this.stops.values()) {
      obj.scale.setScalar(22 * k)
      obj.userData.update?.(t)
    }
    for (const obj of this.tokens.values()) {
      obj.scale.setScalar(15 * k)
      obj.userData.update?.(t, obj.userData.phase)
    }

    const m = new THREE.Matrix4().fromArray(args.defaultProjectionData.mainMatrix)
    this.camera.projectionMatrix = m.multiply(this.base)
    this.renderer.resetState()
    this.renderer.render(this.scene, this.camera)
    this.map.triggerRepaint()
  }

  onRemove() {
    for (const obj of [...this.stops.values(), ...this.tokens.values(), this.avatarRig]) dispose(obj)
    this.stops.clear()
    this.tokens.clear()
    this.renderer?.dispose()
  }
}

/** Ghost mirrors the avatar's animated limbs (same hierarchy, cloned). */
function syncPose(src, dst) {
  const a = []
  const b = []
  src.traverse((o) => a.push(o))
  dst.traverse((o) => b.push(o))
  for (let i = 0; i < a.length && i < b.length; i++) {
    b[i].position.copy(a[i].position)
    b[i].rotation.copy(a[i].rotation)
  }
}

function dispose(obj) {
  obj.traverse((o) => {
    if (o.isMesh) {
      o.geometry?.dispose()
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      mats.forEach((m) => m?.dispose())
    }
  })
}
