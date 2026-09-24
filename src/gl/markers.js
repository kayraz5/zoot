import * as THREE from 'three'

/** Stamp totems, chopped seals, sidequest tokens and the origin gate (Shrey's lane). Units ≈ metres × scale. */
const lam = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, flatShading: true, ...extra })

export const COLORS = { next: 0xff6b5b, pending: 0x12b3a8, stamped: 0xc0392b, token: 0xffc233, tokenOff: 0x9aa7ad, gate: 0x2f7de1 }

function groundRing(color, inner = 0.9, outer = 1.1) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(inner, outer, 40),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false })
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.05
  return ring
}

/** Pillar + floating gem. status: 'next' | 'pending'. */
export function createTotem(status = 'pending', label = 1) {
  const color = COLORS[status] || COLORS.pending
  const g = new THREE.Group()
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.05, 0.18, 10), lam(0xffffff))
  base.position.y = 0.09
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 2.2, 6), lam(0xffffff))
  pillar.position.y = 1.2
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), lam(color))
  gem.position.y = 2.75
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.07, 6, 24), lam(0xffffff))
  halo.position.y = 2.75
  const ring = groundRing(color)
  const pulse = groundRing(color, 1.0, 1.25)
  g.add(base, pillar, gem, halo, ring, pulse)
  g.userData = { gem, halo, pulse, status, label, kind: 'totem' }
  g.userData.update = (t) => {
    gem.rotation.y = t * 1.6
    gem.position.y = 2.75 + Math.sin(t * 2.4) * 0.12
    halo.rotation.x = Math.PI / 2 + Math.sin(t) * 0.25
    halo.position.y = gem.position.y
    if (status === 'next') {
      const p = (t * 0.8) % 1
      pulse.scale.setScalar(1 + p * 3.2)
      pulse.material.opacity = 0.7 * (1 - p)
      gem.scale.setScalar(1 + Math.sin(t * 6) * 0.08)
    } else {
      pulse.visible = false
    }
  }
  return g
}

/** A chop pressed into the street: completed stamp. */
export function createSeal(ink = COLORS.stamped) {
  const g = new THREE.Group()
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.15, 0.22, 28), lam(ink))
  disc.position.y = 0.11
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.07, 6, 28), lam(0xfff1e0))
  rim.rotation.x = Math.PI / 2
  rim.position.y = 0.24
  const mark = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.18), lam(0xfff1e0))
  mark.position.y = 0.25
  const mark2 = mark.clone()
  mark2.rotation.y = Math.PI / 2
  const check = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), lam(0xfff1e0))
  check.position.y = 0.95
  g.add(disc, rim, mark, mark2, check)
  g.rotation.y = -0.25
  g.userData = { kind: 'seal', check }
  g.userData.update = (t) => {
    check.position.y = 0.95 + Math.sin(t * 1.5) * 0.08
    check.rotation.y = t
  }
  return g
}

/** Floating sidequest gem. Greyed when "Not enough time". */
export function createToken(eligible = true) {
  const g = new THREE.Group()
  const color = eligible ? COLORS.token : COLORS.tokenOff
  const gem = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 0), lam(color, { emissive: eligible ? 0x553300 : 0x000000 }))
  gem.position.y = 1.6
  const spark = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.05, 4, 20), lam(0xffffff))
  spark.position.y = 1.6
  const ring = groundRing(color, 0.5, 0.65)
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 4), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5 }))
  stem.position.y = 0.6
  g.add(gem, spark, ring, stem)
  g.userData = { kind: 'token', eligible }
  g.userData.update = (t, phase = 0) => {
    gem.position.y = 1.6 + Math.sin(t * 3 + phase) * 0.25
    gem.rotation.y = t * 2 + phase
    gem.rotation.x = t * 0.7
    spark.position.y = gem.position.y
    spark.rotation.x = Math.PI / 2 + Math.sin(t + phase) * 0.5
    spark.rotation.y = t
  }
  return g
}

/** Home gate for the "Return to origin" leg. */
export function createGate() {
  const g = new THREE.Group()
  const m = lam(COLORS.gate)
  const post = new THREE.BoxGeometry(0.35, 2.6, 0.35)
  const l = new THREE.Mesh(post, m)
  l.position.set(-1.1, 1.3, 0)
  const r = l.clone()
  r.position.x = 1.1
  const beam = new THREE.Mesh(new THREE.BoxGeometry(3, 0.4, 0.5), lam(0xffffff))
  beam.position.y = 2.7
  const wing = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.2, 4), lam(COLORS.gate))
  wing.rotation.z = -Math.PI / 2
  wing.position.y = 3.4
  g.add(l, r, beam, wing, groundRing(COLORS.gate, 1.4, 1.6))
  g.userData = { kind: 'gate' }
  g.userData.update = (t) => {
    wing.position.y = 3.4 + Math.sin(t * 2) * 0.15
    wing.rotation.x = t
  }
  return g
}
