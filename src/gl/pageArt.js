/**
 * Canvas painters for passport pages (Shrey's lane). Each returns nothing and
 * paints into a 512×716 canvas that becomes a Three.js texture.
 */
export const PAGE_W = 512
export const PAGE_H = 716

function rand(seed) {
  let s = [...String(seed)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
}

/** Paper + guilloche. `left` pages have the spine on their right edge. */
function paper(ctx, tint = '#fbf5e8', left = false) {
  ctx.fillStyle = tint
  ctx.fillRect(0, 0, PAGE_W, PAGE_H)
  // Guilloche security pattern.
  ctx.save()
  ctx.globalAlpha = 0.18
  ctx.strokeStyle = '#7fb8b0'
  ctx.lineWidth = 1
  for (let k = 0; k < 14; k++) {
    ctx.beginPath()
    for (let x = 0; x <= PAGE_W; x += 6) {
      const y = 90 + k * 46 + Math.sin(x / 38 + k) * 14 + Math.sin(x / 11 + k * 2) * 3
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  ctx.restore()
  // Spine shadow.
  const x0 = left ? PAGE_W : 0
  const g = ctx.createLinearGradient(x0, 0, left ? PAGE_W - 40 : 40, 0)
  g.addColorStop(0, 'rgba(0,0,0,0.14)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(left ? PAGE_W - 40 : 0, 0, 40, PAGE_H)
}

function pageNumber(ctx, n, left) {
  ctx.fillStyle = '#9a8f7a'
  ctx.font = '600 16px Nunito, sans-serif'
  ctx.textAlign = left ? 'left' : 'right'
  ctx.fillText(String(n), left ? 28 : PAGE_W - 28, PAGE_H - 24)
}

/** Ink texture: knock random specks out of what was just drawn. */
function speckle(ctx, cx, cy, r, seed) {
  const rnd = rand(seed)
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  for (let i = 0; i < 120; i++) {
    const a = rnd() * Math.PI * 2
    const d = Math.sqrt(rnd()) * r
    ctx.globalAlpha = 0.2 + rnd() * 0.5
    ctx.beginPath()
    ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 0.6 + rnd() * 2.2, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

export function drawChop(ctx, { x, y, r, ink, glyph, label, sub, seed, alpha = 0.9, square = false }) {
  const rnd = rand(seed)
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate((rnd() - 0.5) * 0.5)
  ctx.globalAlpha = alpha
  ctx.strokeStyle = ink
  ctx.fillStyle = ink
  ctx.lineWidth = r * 0.08
  ctx.beginPath()
  if (square) ctx.roundRect(-r, -r, r * 2, r * 2, r * 0.18)
  else ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = r * 0.03
  ctx.beginPath()
  if (square) ctx.roundRect(-r * 0.84, -r * 0.84, r * 1.68, r * 1.68, r * 0.12)
  else ctx.arc(0, 0, r * 0.84, 0, Math.PI * 2)
  ctx.stroke()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `700 ${Math.round(r * 0.72)}px Fredoka, serif`
  ctx.fillText(glyph, 0, -r * 0.12)
  if (label) {
    ctx.font = `800 ${Math.max(9, Math.round(r * 0.2))}px Nunito, sans-serif`
    ctx.fillText(label.toUpperCase().slice(0, 16), 0, r * 0.45)
  }
  if (sub) {
    ctx.font = `700 ${Math.max(8, Math.round(r * 0.16))}px Nunito, sans-serif`
    ctx.fillText(sub, 0, r * 0.66)
  }
  ctx.restore()
  speckle(ctx, x, y, r * 1.05, seed)
}

export function drawCover(ctx, { color = '#0e6f69', name = 'Field Traveller' }) {
  ctx.fillStyle = color
  ctx.fillRect(0, 0, PAGE_W, PAGE_H)
  // Leather grain.
  const rnd = rand(color)
  ctx.globalAlpha = 0.08
  for (let i = 0; i < 2500; i++) {
    ctx.fillStyle = rnd() > 0.5 ? '#000' : '#fff'
    ctx.fillRect(rnd() * PAGE_W, rnd() * PAGE_H, 2, 2)
  }
  ctx.globalAlpha = 1
  const gold = ctx.createLinearGradient(0, 200, 0, 480)
  gold.addColorStop(0, '#ffe6a3')
  gold.addColorStop(0.5, '#d9a93b')
  gold.addColorStop(1, '#f7d27a')
  ctx.fillStyle = gold
  ctx.strokeStyle = gold
  ctx.textAlign = 'center'
  ctx.font = '700 44px Fredoka, sans-serif'
  ctx.fillText('LAYQUEST', PAGE_W / 2, 150)
  ctx.font = '800 20px Nunito, sans-serif'
  ctx.fillText('TRAVELLER PASSPORT', PAGE_W / 2, 186)
  // Emblem: compass rose in a ring.
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.arc(PAGE_W / 2, 360, 92, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(PAGE_W / 2, 360, 76, 0, Math.PI * 2)
  ctx.stroke()
  ctx.save()
  ctx.translate(PAGE_W / 2, 360)
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2)
    ctx.beginPath()
    ctx.moveTo(0, -64)
    ctx.lineTo(14, 0)
    ctx.lineTo(-14, 0)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
  ctx.font = '800 18px Nunito, sans-serif'
  ctx.fillText(name.toUpperCase().slice(0, 24), PAGE_W / 2, 560)
  ctx.font = '700 14px Nunito, sans-serif'
  ctx.fillText('YOUR LAYOVER, ALREADY QUESTED', PAGE_W / 2, 600)
  // Chip symbol.
  ctx.lineWidth = 3
  ctx.strokeRect(PAGE_W / 2 - 22, 636, 44, 30)
  ctx.beginPath()
  ctx.arc(PAGE_W / 2, 651, 8, 0, Math.PI * 2)
  ctx.stroke()
}

export function drawIdentity(ctx, { name, style, level, title, xp, stamps, chops, color }) {
  paper(ctx, '#f6f0e1', true)
  ctx.fillStyle = '#6b5f48'
  ctx.textAlign = 'left'
  ctx.font = '800 15px Nunito, sans-serif'
  ctx.fillText('IDENTITY · TRAVELLER DATA', 44, 64)
  // Photo box.
  ctx.fillStyle = color || '#0e6f69'
  ctx.fillRect(44, 96, 150, 190)
  ctx.fillStyle = '#ffffffcc'
  ctx.beginPath()
  ctx.arc(119, 170, 38, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillRect(74, 216, 90, 70)
  const field = (label, value, y) => {
    ctx.fillStyle = '#9a8f7a'
    ctx.font = '700 12px Nunito, sans-serif'
    ctx.fillText(label, 216, y)
    ctx.fillStyle = '#2a2a2a'
    ctx.font = '700 22px Fredoka, sans-serif'
    ctx.fillText(String(value).slice(0, 18), 216, y + 26)
  }
  field('NAME', name, 110)
  field('TRAVEL STYLE', style, 170)
  field('RANK', `L${level} ${title}`, 230)
  field('EXPERIENCE', `${xp} XP`, 290)
  ctx.fillStyle = '#9a8f7a'
  ctx.font = '700 12px Nunito, sans-serif'
  ctx.fillText('ISSUED AT', 44, 330)
  ctx.fillText('STAMPS', 216, 330)
  ctx.fillText('CHOPS', 360, 330)
  ctx.fillStyle = '#2a2a2a'
  ctx.font = '700 22px Fredoka, sans-serif'
  ctx.fillText('SINGAPORE', 44, 356)
  ctx.fillText(String(stamps), 216, 356)
  ctx.fillText(String(chops), 360, 356)
  // Signature squiggle.
  ctx.strokeStyle = '#2f4f8f'
  ctx.lineWidth = 2
  ctx.beginPath()
  for (let x = 44; x < 260; x += 4) ctx.lineTo(x, 420 + Math.sin(x / 9) * 8 + Math.sin(x / 23) * 6)
  ctx.stroke()
  ctx.fillStyle = '#9a8f7a'
  ctx.font = '700 11px Nunito, sans-serif'
  ctx.fillText('HOLDER SIGNATURE', 44, 450)
  // Machine-readable zone.
  ctx.fillStyle = '#e9e1cd'
  ctx.fillRect(0, PAGE_H - 150, PAGE_W, 110)
  ctx.fillStyle = '#3a3a3a'
  ctx.font = '600 21px "Courier New", monospace'
  const mrzName = (name || 'TRAVELLER').toUpperCase().replace(/[^A-Z]/g, '<').slice(0, 20)
  ctx.fillText(`P<LQS${mrzName}`.padEnd(34, '<'), 30, PAGE_H - 110)
  ctx.fillText(`L${String(level).padStart(2, '0')}<<XP${String(xp).padStart(6, '0')}<<SIN<<CHANGI`.padEnd(34, '<'), 30, PAGE_H - 74)
  pageNumber(ctx, 1, true)
}

/**
 * Area page: header, big area chop (after it slams), and a slot per place.
 * opts.revealed=false hides the area chop so the 3D slam can reveal it.
 */
export function drawAreaPage(ctx, { area, places, stampsByPlace, pageNo, left, revealed = true, inkProgress = 1 }) {
  paper(ctx, '#fbf5e8', left)
  ctx.fillStyle = '#6b5f48'
  ctx.textAlign = 'left'
  ctx.font = '800 14px Nunito, sans-serif'
  ctx.fillText('VISAS · ENTRIES · CHOPS', 44, 58)
  ctx.fillStyle = area.ink
  ctx.font = '700 38px Fredoka, sans-serif'
  ctx.fillText(area.id.toUpperCase(), 44, 104)
  const count = places.filter((p) => stampsByPlace[p.id]).length
  ctx.fillStyle = '#9a8f7a'
  ctx.font = '700 15px Nunito, sans-serif'
  ctx.fillText(`${count} / ${places.length} stamped`, 44, 132)

  // Area chop (top-right). Drawn only once revealed by the slam.
  const hasAny = count > 0
  if (hasAny && revealed) {
    drawChop(ctx, { x: 392, y: 104, r: 64 * (0.85 + 0.15 * inkProgress), ink: area.ink, glyph: area.glyph, label: area.id, sub: 'SINGAPORE', seed: area.id, alpha: 0.88 * inkProgress })
  } else {
    ctx.save()
    ctx.setLineDash([6, 7])
    ctx.strokeStyle = '#c9bea6'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(392, 104, 60, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }

  // Place slots: 2 columns × 4 rows, stamped places first so new chops are always visible.
  const shown = [...places].sort((a, b) => Boolean(stampsByPlace[b.id]) - Boolean(stampsByPlace[a.id])).slice(0, 8)
  shown.forEach((p, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = 136 + col * 240
    const y = 250 + row * 112
    const st = stampsByPlace[p.id]
    if (st) {
      drawChop(ctx, { x, y, r: 44, ink: area.ink, glyph: area.glyph, label: p.name.split(/[ ,(&]/)[0], sub: st.date, seed: p.id, alpha: 0.85, square: i % 3 === 1 })
    } else {
      ctx.save()
      ctx.setLineDash([4, 6])
      ctx.strokeStyle = '#d3c8b0'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(x, y, 40, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
      ctx.fillStyle = '#b8ac92'
      ctx.textAlign = 'center'
      ctx.font = '700 12px Nunito, sans-serif'
      wrap(ctx, p.name, x, y - 6, 88, 14)
    }
  })
  if (places.length > 8) {
    ctx.fillStyle = '#9a8f7a'
    ctx.textAlign = 'right'
    ctx.font = '700 13px Nunito, sans-serif'
    ctx.fillText(`+${places.length - 8} more in the Codex`, PAGE_W - 40, PAGE_H - 56)
  }
  pageNumber(ctx, pageNo, left)
}

export function drawBackPage(ctx, { badges, left = true }) {
  paper(ctx, '#f3ecdb', left)
  ctx.fillStyle = '#6b5f48'
  ctx.textAlign = 'left'
  ctx.font = '800 14px Nunito, sans-serif'
  ctx.fillText('ENDORSEMENTS · BADGES', 44, 58)
  badges.forEach((b, i) => {
    const y = 120 + i * 92
    ctx.globalAlpha = b.earned ? 1 : 0.35
    ctx.fillStyle = b.earned ? '#ffd166' : '#d9d2c1'
    ctx.beginPath()
    ctx.arc(80, y, 30, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#3b2a00'
    ctx.textAlign = 'center'
    ctx.font = '700 26px Fredoka, sans-serif'
    ctx.fillText(b.glyph, 80, y + 9)
    ctx.textAlign = 'left'
    ctx.fillStyle = '#2a2a2a'
    ctx.font = '700 20px Fredoka, sans-serif'
    ctx.fillText(b.title, 128, y - 4)
    ctx.fillStyle = '#7d735f'
    ctx.font = '600 13px Nunito, sans-serif'
    ctx.fillText(b.text, 128, y + 18)
    ctx.globalAlpha = 1
  })
}

function wrap(ctx, text, x, y, maxW, lh) {
  const words = text.split(' ')
  let line = ''
  let yy = y
  for (const w of words) {
    const test = line ? line + ' ' + w : w
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy)
      line = w
      yy += lh
    } else line = test
  }
  ctx.fillText(line, x, yy)
}
