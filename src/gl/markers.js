import * as THREE from 'three'

/** Stamp totems, chopped seals, sidequest tokens and the origin gate, in Zoot colours (Matthew's lane). */
const lam = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, flatShading: true, ...extra })

export const COLORS = { next: 0xf83878, pending: 0xffcc00, ink: 0x111111, paper: 0xffffff, token: 0xfff4c2, tokenOff: 0x8f8f8f, gate: 0xffcc00 }

function groundRing(color, inner = 0.9, outer = 1.12, opacity = 0.85) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(inner, outer, 40),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false })
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.05
  return ring
}

/** White pillar with a floating gem: pink for the next stop, yellow for later ones. */
export function createTotem(status = 'pending') {
  const color = COLORS[status] || COLORS.pending
  const g = new THREE.Group()
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.05, 0.2, 10), lam(COLORS.ink))
  base.position.y = 0.1
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.08, 10), lam(COLORS.paper))
  cap.position.y = 0.24
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 2.2, 6), lam(COLORS.paper))
  pillar.position.y = 1.3
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.58, 0), lam(color))
  gem.position.y = 2.8
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.07, 6, 24), lam(COLORS.ink))
  halo.position.y = 2.8
  const ring = groundRing(color)
  const pulse = groundRing(color, 1.0, 1.25, 0.7)
  g.add(base, cap, pillar, gem, halo, ring, pulse)
  g.userData = { gem, halo, pulse, status, kind: 'totem' }
  g.userData.update = (t) => {
    gem.rotation.y = t * 1.6
    gem.position.y = 2.8 + Math.sin(t * 2.4) * 0.12
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

/** A chop pressed into the street: ink disc, yellow rim and cross. */
export function createSeal() {
  const g = new THREE.Group()
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.15, 0.22, 28), lam(COLORS.ink))
  disc.position.y = 0.11
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.08, 6, 28), lam(COLORS.pending))
  rim.rotation.x = Math.PI / 2
  rim.position.y = 0.24
  const mark = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.2), lam(COLORS.pending))
  mark.position.y = 0.25
  const mark2 = mark.clone()
  mark2.rotation.y = Math.PI / 2
  const check = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), lam(COLORS.pending))
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

/** Floating sidequest gem: cream with a pink ring. Grey when "Not enough time". */
export function createToken(eligible = true) {
  const g = new THREE.Group()
  const color = eligible ? COLORS.token : COLORS.tokenOff
  const accent = eligible ? COLORS.next : COLORS.tokenOff
  const gem = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 0), lam(color, { emissive: eligible ? 0x554400 : 0x000000 }))
  gem.position.y = 1.6
  const spark = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.06, 4, 20), lam(accent))
  spark.position.y = 1.6
  const ring = groundRing(accent, 0.5, 0.68)
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 4), new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.6 }))
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

/** Home gate for the "Return to origin" leg: white posts, yellow beam. */
export function createGate() {
  const g = new THREE.Group()
  const post = new THREE.BoxGeometry(0.35, 2.6, 0.35)
  const l = new THREE.Mesh(post, lam(COLORS.paper))
  l.position.set(-1.1, 1.3, 0)
  const r = l.clone()
  r.position.x = 1.1
  const beam = new THREE.Mesh(new THREE.BoxGeometry(3, 0.45, 0.5), lam(COLORS.gate))
  beam.position.y = 2.75
  const wing = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.2, 4), lam(COLORS.ink))
  wing.rotation.z = -Math.PI / 2
  wing.position.y = 3.5
  g.add(l, r, beam, wing, groundRing(COLORS.gate, 1.4, 1.65))
  g.userData = { kind: 'gate' }
  g.userData.update = (t) => {
    wing.position.y = 3.5 + Math.sin(t * 2) * 0.15
    wing.rotation.x = t
  }
  return g
}
