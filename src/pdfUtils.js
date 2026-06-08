/**
 * PDF generation using jsPDF's drawing API directly.
 * No html2canvas — every element is drawn programmatically so the output
 * is pixel-perfect and independent of CSS/browser rendering.
 */
import jsPDF from 'jspdf'

// ─── Unit conversion ──────────────────────────────────────────────────────────
// Our design coordinate space: 794 × 1123 px (A4 at 96 dpi)
// jsPDF coordinate space:      210 × 297 mm  (A4)
const MM_PER_PX = 210 / 794
const W = 210   // page width  mm
const H = 297   // page height mm
function px(v) { return v * MM_PER_PX }  // px → mm

// ─── Color helpers ────────────────────────────────────────────────────────────
function hexRGB(hex) {
  return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)]
}
// Washi colours pre-blended onto white (rgba at 0.78 opacity)
const WASHI = [
  [197,225,222],  // mint
  [255,200,208],  // pink
  [255,229,118],  // yellow
  [220,213,244],  // lavender
  [255,200,171],  // coral
  [167,240,189],  // sage
]

// ─── Drawing primitives ───────────────────────────────────────────────────────
function fillPage(pdf, hexColor) {
  pdf.setFillColor(...hexRGB(hexColor))
  pdf.rect(0, 0, W, H, 'F')
}

function fillRect(pdf, xPx, yPx, wPx, hPx, color) {
  if (Array.isArray(color)) pdf.setFillColor(...color)
  else pdf.setFillColor(...hexRGB(color))
  pdf.rect(px(xPx), px(yPx), px(wPx), px(hPx), 'F')
}

function strokeRect(pdf, xPx, yPx, wPx, hPx, color, lw = 0.3) {
  if (Array.isArray(color)) pdf.setDrawColor(...color)
  else pdf.setDrawColor(...hexRGB(color))
  pdf.setLineWidth(lw)
  pdf.rect(px(xPx), px(yPx), px(wPx), px(hPx), 'D')
}

function putText(pdf, text, xMm, yMm, {
  font = 'helvetica', style = 'normal', size = 10,
  color = '#333333', align = 'left', maxWidth,
} = {}) {
  if (!text) return
  pdf.setFont(font, style)
  pdf.setFontSize(size)
  pdf.setTextColor(...hexRGB(color))
  const opts = {}
  if (align !== 'left') opts.align = align
  if (maxWidth) opts.maxWidth = maxWidth
  pdf.text(String(text), xMm, yMm, opts)
}

// Horizontal ruled line
function hLine(pdf, xStartPx, xEndPx, yPx, color, lw = 0.2) {
  if (Array.isArray(color)) pdf.setDrawColor(...color)
  else pdf.setDrawColor(...hexRGB(color))
  pdf.setLineWidth(lw)
  pdf.line(px(xStartPx), px(yPx), px(xEndPx), px(yPx))
}

// Vertical line
function vLine(pdf, xPx, yStartPx, yEndPx, color, lw = 0.2) {
  if (Array.isArray(color)) pdf.setDrawColor(...color)
  else pdf.setDrawColor(...hexRGB(color))
  pdf.setLineWidth(lw)
  pdf.line(px(xPx), px(yStartPx), px(xPx), px(yEndPx))
}

// Washi tape strip with subtle vertical stripe texture
function drawWashi(pdf, xPx, yPx, wPx, hPx, colorIdx) {
  const [r, g, b] = WASHI[colorIdx % WASHI.length]
  const xMm = px(xPx), yMm = px(yPx), wMm = px(wPx), hMm = px(hPx)
  pdf.setFillColor(r, g, b)
  pdf.rect(xMm, yMm, wMm, hMm, 'F')
  // Vertical stripe texture
  pdf.setDrawColor(255, 255, 255)
  pdf.setLineWidth(0.12)
  for (let dx = px(10); dx < wMm; dx += px(11)) {
    pdf.line(xMm + dx, yMm, xMm + dx, yMm + hMm)
  }
}

// Corrugated cardboard circle
function drawCardboardDot(pdf, xPx, yPx, sizePx) {
  const r  = px(sizePx / 2)
  const cx = px(xPx) + r
  const cy = px(yPx) + r
  pdf.setFillColor(196, 168, 110)
  pdf.circle(cx, cy, r, 'F')
  // Horizontal texture lines
  pdf.setDrawColor(162, 130, 72)
  pdf.setLineWidth(0.22)
  const gap = px(6)
  for (let dy = -r + gap / 2; dy < r; dy += gap) {
    const chord = Math.sqrt(Math.max(0, r * r - dy * dy))
    if (chord > 0.05) pdf.line(cx - chord, cy + dy, cx + chord, cy + dy)
  }
}

// ─── Rainbow (quadratic bezier approximated with line segments) ───────────────
function drawRainbow(pdf) {
  const CX = W / 2    // 105 mm, horizontal centre
  const BY = H - 12   // 285 mm, base of arcs near bottom

  const ARCS = [
    { c: [229, 57,  53],  r: px(318), sw: px(32), wx: px( 14), wy: px(-18) },
    { c: [255,112,  67],  r: px(280), sw: px(30), wx: px(-10), wy: px( 12) },
    { c: [253,216,  53],  r: px(242), sw: px(30), wx: px( 12), wy: px( -8) },
    { c: [ 67,160,  71],  r: px(204), sw: px(30), wx: px(-14), wy: px( 14) },
    { c: [ 30,136, 229],  r: px(166), sw: px(30), wx: px( 10), wy: px(-10) },
    { c: [123, 31, 162],  r: px(128), sw: px(28), wx: px(-12), wy: px(  8) },
  ]

  ARCS.forEach(({ c, r, sw, wx, wy }) => {
    const x1 = CX - r, x2 = CX + r
    const cx = CX + wx, cy = BY - r + wy
    pdf.setDrawColor(...c)
    pdf.setLineWidth(sw)
    // 80-segment polyline approximation of the quadratic bezier
    let px0 = x1, py0 = BY
    const N = 80
    for (let i = 1; i <= N; i++) {
      const t = i / N, mt = 1 - t
      const qx = mt * mt * x1 + 2 * mt * t * cx + t * t * x2
      const qy = mt * mt * BY + 2 * mt * t * cy + t * t * BY
      pdf.line(px0, py0, qx, qy)
      px0 = qx; py0 = qy
    }
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function locText(loc) {
  if (!loc) return null
  if (loc === 'home')      return 'Home'
  if (loc === 'veldhoven') return 'Veldhoven'
  return loc
}

const TYPE_SHORT = {
  frase:'Frase', creacion:'Creacion', foto:'Foto',
  hito:'Hito',   cancion:'Cancion',  recuerdo:'Recuerdo',
}

// Load an image and return { w, h, data } — resolves aspect ratio for contain logic
function loadImage(dataUrl) {
  return new Promise(resolve => {
    const img = new Image()
    img.onload  = () => resolve({ w: img.naturalWidth, h: img.naturalHeight, data: dataUrl })
    img.onerror = () => resolve(null)
    img.src = dataUrl
  })
}

// Fit dimensions preserving aspect ratio (object-fit: contain)
function containFit(imgW, imgH, boxW, boxH) {
  const scale = Math.min(boxW / imgW, boxH / imgH)
  return { w: imgW * scale, h: imgH * scale }
}

// Clip a string to approximately fit maxWidth mm at given font size
function clipText(pdf, text, maxWidthMm) {
  const lines = pdf.splitTextToSize(text, maxWidthMm)
  return lines[0] + (lines.length > 1 ? '…' : '')
}

// ─── Page drawers ─────────────────────────────────────────────────────────────

function drawCover(pdf, entries) {
  // Background
  fillPage(pdf, '#fdfaf5')

  // Cardboard dots
  drawCardboardDot(pdf, 28, 44, 96)
  drawCardboardDot(pdf, 680, 200, 68)
  drawCardboardDot(pdf, 655, 900, 84)
  drawCardboardDot(pdf, 40, 820, 52)

  // Washi tape — top-left and top-right
  drawWashi(pdf, 0,   18, 180, 22, 0)   // mint
  drawWashi(pdf, 614, 18, 180, 22, 1)   // pink (794 - 180 = 614)

  // Title
  putText(pdf, 'El diario', W / 2, 62,  { style:'bold', size:52, color:'#2c2520', align:'center' })
  putText(pdf, 'de Ella',   W / 2, 83,  { style:'bold', size:52, color:'#2c2520', align:'center' })

  // Date range + count
  const dates = entries.map(e => e.date).filter(Boolean).sort()
  const from  = dates[0]     ? fmtDate(dates[0])     : ''
  const to    = dates.at(-1) ? fmtDate(dates.at(-1)) : ''
  const range = !from ? '' : from === to ? from : `${from} – ${to}`
  if (range) putText(pdf, range, W / 2, 99, { style:'italic', size:13, color:'#8a7a6a', align:'center' })
  putText(pdf, `${entries.length} recuerdos`, W / 2, 110, { size:10, color:'#b8a898', align:'center' })

  // Rainbow
  drawRainbow(pdf)
}

// Photo page layout configs  [top, left, photoW, photoH] in px
const PHOTO_CFG = {
  1: [{ t:290, l:182, pw:390, ph:305 }],
  2: [{ t: 60, l: 40, pw:340, ph:270 }, { t:560, l:395, pw:340, ph:270 }],
  3: [{ t: 40, l: 28, pw:310, ph:245 }, { t: 50, l:440, pw:310, ph:245 }, { t:590, l:228, pw:310, ph:245 }],
  4: [{ t: 48, l: 22, pw:278, ph:218 }, { t: 34, l:448, pw:278, ph:218 },
      { t:580, l: 38, pw:278, ph:218 }, { t:562, l:440, pw:278, ph:218 }],
}

async function drawPhotoPage(pdf, entries, pageNum) {
  fillPage(pdf, '#ffffff')

  const n    = Math.min(entries.length, 4)
  const cfgs = PHOTO_CFG[n] || PHOTO_CFG[4]

  for (let i = 0; i < n; i++) {
    const e   = entries[i]
    const cfg = cfgs[i]
    await drawPolaroid(pdf, e, cfg, (pageNum + i) % WASHI.length)
  }
}

async function drawPolaroid(pdf, entry, { t: tPx, l: lPx, pw: pwPx, ph: phPx }, colorIdx) {
  const PAD_S = 16, PAD_T = 16, PAD_B = 46
  const cardWPx = pwPx + PAD_S * 2
  const cardHPx = phPx + PAD_T + PAD_B

  const xMm = px(lPx), yMm = px(tPx)
  const cWMm = px(cardWPx), cHMm = px(cardHPx)
  const pWMm = px(pwPx),    pHMm = px(phPx)

  // Shadow
  pdf.setFillColor(215, 207, 197)
  pdf.rect(xMm + 1.2, yMm + 1.8, cWMm, cHMm, 'F')

  // White card
  pdf.setFillColor(255, 255, 255)
  pdf.rect(xMm, yMm, cWMm, cHMm, 'F')

  // Washi tape centred across top of card
  const wWPx = Math.round(cardWPx * 0.56)
  const wLPx = lPx + Math.round(cardWPx * 0.22)
  drawWashi(pdf, wLPx, tPx - 11, wWPx, 22, colorIdx)

  // Photo area — light grey fill for letterbox bands
  const photoXMm = xMm + px(PAD_S)
  const photoYMm = yMm + px(PAD_T)
  pdf.setFillColor(248, 248, 248)
  pdf.rect(photoXMm, photoYMm, pWMm, pHMm, 'F')

  // Photo (object-fit: contain)
  if (entry.photo) {
    const img = await loadImage(entry.photo)
    if (img) {
      const { w: dw, h: dh } = containFit(img.w, img.h, pWMm, pHMm)
      const ox = (pWMm - dw) / 2
      const oy = (pHMm - dh) / 2
      pdf.addImage(img.data, 'JPEG', photoXMm + ox, photoYMm + oy, dw, dh)
    }
  }

  // Caption
  const capX  = xMm + cWMm / 2
  const capY0 = yMm + px(PAD_T + phPx + 12)

  putText(pdf, clipText(pdf, entry.title, pWMm), capX, capY0, {
    style:'bold', size:9, color:'#2c2520', align:'center',
  })

  if (entry.note) {
    const note = entry.note.length > 65 ? entry.note.slice(0, 65) + '…' : entry.note
    putText(pdf, note, capX, capY0 + 5, {
      size:7, color:'#9a8a7a', align:'center', maxWidth: pWMm,
    })
  }

  const meta = [entry.uploadedByName, fmtDate(entry.date)].filter(Boolean).join('  ·  ')
  if (meta) {
    putText(pdf, meta, capX, capY0 + (entry.note ? 13 : 6), {
      size:6.5, color:'#aaaaaa', align:'center',
    })
  }
}

const TEXT_CFG = {
  1: [{ tPx:240, lPx:52 }],
  2: [{ tPx: 40, lPx:52 }, { tPx:530, lPx:62 }],
}

function drawTextPage(pdf, entries, pageNum) {
  fillPage(pdf, '#fdfaf5')

  const n    = Math.min(entries.length, 2)
  const cfgs = TEXT_CFG[n] || TEXT_CFG[2]

  entries.slice(0, 2).forEach((entry, i) => {
    drawLinedPaper(pdf, entry, cfgs[i], (pageNum + i) % WASHI.length)
  })
}

function drawLinedPaper(pdf, entry, { tPx, lPx }, colorIdx) {
  const PW = 686, PH = 400  // paper dimensions in px
  const xMm = px(lPx), yMm = px(tPx)
  const wMm = px(PW),  hMm = px(PH)

  // Drop shadow
  pdf.setFillColor(200, 195, 188)
  pdf.rect(xMm + 0.6, yMm + 1.4, wMm, hMm, 'F')

  // White paper
  pdf.setFillColor(255, 255, 255)
  pdf.rect(xMm, yMm, wMm, hMm, 'F')

  // Red left margin line
  const marginXPx = 68
  vLine(pdf, lPx + marginXPx, tPx + 2, tPx + PH - 2, [240, 100, 100], 0.35)

  // Blue horizontal ruled lines
  const firstLinePx = 46     // first line offset from paper top
  const lineGapPx   = 30     // line spacing
  pdf.setDrawColor(174, 214, 241)
  pdf.setLineWidth(0.22)
  for (let y = tPx + firstLinePx; y < tPx + PH - 10; y += lineGapPx) {
    pdf.line(xMm, px(y), xMm + wMm, px(y))
  }

  // Washi tape at top
  const washiWPx = Math.round(PW * 0.34)
  const washiLPx = lPx + Math.round(PW * 0.33)
  drawWashi(pdf, washiLPx, tPx - 11, washiWPx, 22, colorIdx)

  // Paper border
  strokeRect(pdf, lPx, tPx, PW, PH, '#d8d0c6', 0.3)

  // ── Text content ─────────────────────────────────────────────────────────
  const contentXMm = px(lPx + marginXPx + 8)
  const contentWMm = wMm - px(marginXPx + 34)
  const lineHMm    = px(lineGapPx)
  let   curY       = px(tPx + firstLinePx) - 1   // baseline sits on first ruled line

  // Type + title
  const title = `${TYPE_SHORT[entry.type] || entry.type}  ${entry.title}`
  putText(pdf, clipText(pdf, title, contentWMm), contentXMm, curY, {
    style:'bold', size:11, color:'#2c2520',
  })
  curY += lineHMm

  // Date + author
  const meta = [fmtDate(entry.date), entry.uploadedByName].filter(Boolean).join('  ·  ')
  if (meta) {
    putText(pdf, meta, contentXMm, curY, { style:'italic', size:8, color:'#aaaaaa' })
    curY += lineHMm
  }

  // Note — line-wrapped to match ruled lines
  if (entry.note) {
    const note = entry.note.length > 260 ? entry.note.slice(0, 260) + '…' : entry.note
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(...hexRGB('#4a3a2a'))
    const lines    = pdf.splitTextToSize(note, contentWMm)
    const maxLines = Math.floor((px(tPx + PH - 30) - curY) / lineHMm) + 1
    lines.slice(0, maxLines).forEach(line => {
      if (curY < px(tPx + PH - px(18))) {
        pdf.text(line, contentXMm, curY)
        curY += lineHMm
      }
    })
  }

  // Tags (location + people)
  if (curY < px(tPx + PH - 22)) {
    const loc  = locText(entry.location)
    const tags = [loc, ...(entry.people || [])].filter(Boolean)
    if (tags.length) {
      putText(pdf, tags.join('  |  '), contentXMm, curY, {
        size:7.5, color:'#666666',
      })
    }
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a jsPDF document from the pages array.
 * pages: array of { type:'cover'|'photos'|'text', entries, pageNum }
 * onProgress(0-100) called after each page.
 */
export async function buildPdf(pages, onProgress) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) pdf.addPage()
    const page = pages[i]

    if (page.type === 'cover')  drawCover(pdf, page.entries)
    else if (page.type === 'photos') await drawPhotoPage(pdf, page.entries, page.pageNum || 0)
    else if (page.type === 'text')   drawTextPage(pdf,    page.entries, page.pageNum || 0)

    onProgress?.(Math.round(((i + 1) / pages.length) * 100))
  }

  return pdf
}
