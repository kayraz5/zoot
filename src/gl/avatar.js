import * as THREE from 'three'

/**
 * Low-poly Field Traveller (Shrey's lane). ~2 units tall, faces −Z (north) at rotation 0.
 * update(t, moving) animates the walk cycle.
 */
const lam = (color) => new THREE.MeshLambertMaterial({ color, flatShading: true })

export function createTraveller({ jacket = 0x12b3a8, cap = 0xff6b5b, pack = 0xffd166, skin = 0xf6c9a4, pants = 0x2b3a55 } = {}) {
  const root = new THREE.Group()
  const body = new THREE.Group()
  root.add(body)

  const hip = (x) => {
    const g = new THREE.Group()
    g.position.set(x, 0.62, 0)
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.085, 0.58, 6), lam(pants))
    leg.position.y = -0.29
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.26), lam(0xffffff))
    shoe.position.set(0, -0.58, -0.04)
    g.add(leg, shoe)
    return g
  }
  const legL = hip(-0.12)
  const legR = hip(0.12)

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.31, 0.72, 7), lam(jacket))
  torso.position.y = 0.98

  const shoulder = (x) => {
    const g = new THREE.Group()
    g.position.set(x, 1.28, 0)
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.55, 6), lam(jacket))
    arm.position.y = -0.27
    const hand = new THREE.Mesh(new THREE.IcosahedronGeometry(0.08, 0), lam(skin))
    hand.position.y = -0.57
    g.add(arm, hand)
    g.rotation.z = x < 0 ? -0.12 : 0.12
    return g
  }
  const armL = shoulder(-0.34)
  const armR = shoulder(0.34)

  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.25, 1), lam(skin))
  head.position.y = 1.58
  const capTop = new THREE.Mesh(new THREE.SphereGeometry(0.27, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), lam(cap))
  capTop.position.y = 1.63
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 10, 1, false, Math.PI / 2, Math.PI), lam(cap))
  brim.position.set(0, 1.64, -0.16)
  brim.scale.set(1.1, 1, 1.3)
  const eyeMat = lam(0x1b2430)
  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.02), eyeMat)
  eyeL.position.set(-0.09, 1.56, -0.24)
  const eyeR = eyeL.clone()
  eyeR.position.x = 0.09

  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.46, 0.2), lam(pack))
  backpack.position.set(0, 1.02, 0.3)
  const flap = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.22), lam(0xf4a300))
  flap.position.set(0, 1.22, 0.3)

  body.add(legL, legR, torso, armL, armR, head, capTop, brim, eyeL, eyeR, backpack, flap)

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.5, 20),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false })
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = 0.02
  root.add(shadow)

  root.userData.update = (t, moving) => {
    const swing = moving ? Math.sin(t * 9) * 0.6 : 0
    legL.rotation.x = swing
    legR.rotation.x = -swing
    armL.rotation.x = -swing * 0.8
    armR.rotation.x = swing * 0.8
    body.position.y = moving ? Math.abs(Math.sin(t * 9)) * 0.06 : Math.sin(t * 2) * 0.015
  }
  return root
}

/** Solid silhouette drawn without depth test so the avatar stays visible behind towers. */
export function createGhost(source, color = 0x0b7d76) {
  const ghost = source.clone(true)
  const mat = new THREE.MeshBasicMaterial({ color, depthTest: false, depthWrite: false })
  ghost.traverse((o) => {
    if (o.isMesh) {
      o.material = o.material.transparent ? new THREE.MeshBasicMaterial({ visible: false }) : mat
      o.renderOrder = 0
    }
  })
  return ghost
}
