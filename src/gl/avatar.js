import * as THREE from 'three'

/**
 * Low-poly Zoot traveller (Matthew's lane), modelled on the pitch-deck mascot:
 * black jacket, white shirt, pink scarf trailing behind, yellow backpack.
 * ~2 units tall, faces −Z (north) at rotation 0. update(t, moving) animates the walk cycle.
 */
const lam = (color) => new THREE.MeshLambertMaterial({ color, flatShading: true })

export const AVATAR = { jacket: 0x1c1c1c, shirt: 0xffffff, scarf: 0xf83878, pack: 0xffcc00, skin: 0xf6c9a4, hair: 0x111111, pants: 0x2a2a2a }

export function createTraveller(c = AVATAR) {
  const root = new THREE.Group()
  const body = new THREE.Group()
  root.add(body)

  const hip = (x) => {
    const g = new THREE.Group()
    g.position.set(x, 0.62, 0)
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.085, 0.58, 6), lam(c.pants))
    leg.position.y = -0.29
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.26), lam(0xffffff))
    shoe.position.set(0, -0.58, -0.04)
    g.add(leg, shoe)
    return g
  }
  const legL = hip(-0.12)
  const legR = hip(0.12)

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.31, 0.72, 7), lam(c.jacket))
  torso.position.y = 0.98
  const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.06), lam(c.shirt))
  shirt.position.set(0, 1.02, -0.27)

  const shoulder = (x) => {
    const g = new THREE.Group()
    g.position.set(x, 1.28, 0)
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.55, 6), lam(c.jacket))
    arm.position.y = -0.27
    const hand = new THREE.Mesh(new THREE.IcosahedronGeometry(0.08, 0), lam(c.skin))
    hand.position.y = -0.57
    g.add(arm, hand)
    g.rotation.z = x < 0 ? -0.12 : 0.12
    return g
  }
  const armL = shoulder(-0.34)
  const armR = shoulder(0.34)

  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.25, 1), lam(c.skin))
  head.position.y = 1.58
  // Swept-back black hair with a front tuft, like the mascot.
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.275, 8, 4, 0, Math.PI * 2, 0, Math.PI / 1.9), lam(c.hair))
  hair.position.set(0, 1.63, 0.03)
  const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 5), lam(c.hair))
  tuft.position.set(0.04, 1.84, -0.14)
  tuft.rotation.set(-0.9, 0, -0.3)
  const eyeMat = lam(0x111111)
  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.02), eyeMat)
  eyeL.position.set(-0.09, 1.56, -0.24)
  const eyeR = eyeL.clone()
  eyeR.position.x = 0.09

  // Pink scarf: a ring at the neck and two tails that flutter behind.
  const scarfRing = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.075, 6, 12), lam(c.scarf))
  scarfRing.rotation.x = Math.PI / 2
  scarfRing.position.y = 1.36
  const tail = (dx) => {
    const g = new THREE.Group()
    g.position.set(dx, 1.36, 0.2)
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.05, 0.62), lam(c.scarf))
    m.position.z = 0.31
    g.add(m)
    return g
  }
  const tailA = tail(-0.07)
  const tailB = tail(0.09)

  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.44, 0.2), lam(c.pack))
  backpack.position.set(0, 0.98, 0.3)

  body.add(legL, legR, torso, shirt, armL, armR, head, hair, tuft, eyeL, eyeR, scarfRing, tailA, tailB, backpack)

  // Stands on a yellow disc with an ink rim, echoing the otter badge. Keeps the figure readable on any map theme.
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.78, 28), new THREE.MeshBasicMaterial({ color: 0xffcc00 }))
  disc.rotation.x = -Math.PI / 2
  disc.position.y = 0.03
  const rim = new THREE.Mesh(new THREE.RingGeometry(0.78, 0.92, 28), new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.DoubleSide }))
  rim.rotation.x = -Math.PI / 2
  rim.position.y = 0.035
  root.add(disc, rim)

  root.userData.update = (t, moving) => {
    const swing = moving ? Math.sin(t * 9) * 0.6 : 0
    legL.rotation.x = swing
    legR.rotation.x = -swing
    armL.rotation.x = -swing * 0.8
    armR.rotation.x = swing * 0.8
    body.position.y = moving ? Math.abs(Math.sin(t * 9)) * 0.06 : Math.sin(t * 2) * 0.015
    const lift = moving ? 0.5 : 0.12
    tailA.rotation.x = -lift + Math.sin(t * (moving ? 11 : 2.5)) * 0.18
    tailB.rotation.x = -lift * 0.7 + Math.sin(t * (moving ? 9 : 2) + 1) * 0.2
    tailA.rotation.y = Math.sin(t * 3) * 0.15
    tailB.rotation.y = -Math.sin(t * 2.6) * 0.15
  }
  return root
}

/** Solid silhouette drawn without depth test so the traveller stays visible behind towers. */
export function createGhost(source, color = 0xf83878) {
  const ghost = source.clone(true)
  const mat = new THREE.MeshBasicMaterial({ color, depthTest: false, depthWrite: false })
  ghost.traverse((o) => {
    if (o.isMesh) {
      // Flat ground pieces (the badge disc) would smear over buildings, so the ghost skips them.
      o.material = o.geometry.type === 'CircleGeometry' || o.geometry.type === 'RingGeometry' ? new THREE.MeshBasicMaterial({ visible: false }) : mat
      o.renderOrder = 0
    }
  })
  return ghost
}
