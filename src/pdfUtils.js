/**
 * PDF generation using jsPDF's drawing API directly.
 *
 * Layout: single-column, entries stacked vertically.
 *   Cover block  = 1/4 page  (74.25 mm)
 *   Photo block  = 1/4 page  (74.25 mm)
 *   Text block   = 1/6 page  (49.50 mm)
 *
 * Blocks are packed greedily — no wasted whitespace.
 */
import jsPDF from 'jspdf'

// ─── Page constants ───────────────────────────────────────────────────────────
const W  = 210          // A4 width  (mm)
const H  = 297          // A4 height (mm)
const BH_LARGE = H / 4  // 74.25 mm  — cover + photo entries
const BH_SMALL = H / 6  // 49.50 mm  — text-only entries
const PAD = 8           // horizontal page margin (mm)

// ─── Color palettes ───────────────────────────────────────────────────────────
const RAINBOW = [
  [229,57,53], [255,112,67], [253,216,53],
  [67,160,71], [30,136,229], [123,31,162],
]

// Pastel accent per entry type (pre-blended on white at ~0.8 opacity)
const TYPE_ACCENT = {
  frase:    [255, 243, 150],
  creacion: [183, 232, 222],
  foto:     [255, 211, 217],
  hito:     [221, 211, 247],
  cancion:  [255, 240, 160],
  recuerdo: [255, 211, 217],
}
const DEFAULT_ACCENT = [240, 236, 250]

const TYPE_LABEL = {
  frase:'Quote', creacion:'Creation', foto:'Photo',
  hito:'Milestone', cancion:'Song', recuerdo:'Memory',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hex(h) {
  return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)]
}

function fmtDate(d) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function locText(l) {
  if (!l) return null
  if (l === 'home')      return 'Home'
  if (l === 'veldhoven') return 'Veldhoven'
  return l
}

/** Write text with full options. */
function txt(pdf, text, xMm, yMm, {
  font   = 'helvetica',
  style  = 'normal',
  size   = 9,
  color  = '#444444',
  align  = 'left',
  maxW,
} = {}) {
  if (!text) return
  pdf.setFont(font, style)
  pdf.setFontSize(size)
  pdf.setTextColor(...hex(color))
  const o = {}
  if (align !== 'left') o.align = align
  if (maxW) o.maxWidth = maxW
  pdf.text(String(text), xMm, yMm, o)
}

/** Return first N lines of text wrapped to maxW mm. */
function wrapLines(pdf, text, maxW, maxLines = 99) {
  pdf.setFontSize(9)
  return pdf.splitTextToSize(String(text), maxW).slice(0, maxLines)
}

/** Decode image dimensions without loading DOM. */
function loadImage(dataUrl) {
  return new Promise(resolve => {
    const img = new Image()
    img.onload  = () => resolve({ w: img.naturalWidth, h: img.naturalHeight, data: dataUrl })
    img.onerror = () => resolve(null)
    img.src = dataUrl
  })
}

/** Compute contain-fit dimensions (like object-fit: contain). */
function fitContain(imgW, imgH, boxW, boxH) {
  const s = Math.min(boxW / imgW, boxH / imgH)
  return { w: imgW * s, h: imgH * s }
}

// ─── Block drawing ────────────────────────────────────────────────────────────

/**
 * Left accent bar — rainbow for cover, solid colour for entries.
 */
function drawAccentBar(pdf, yMm, height, rainbow = false, typeKey) {
  const BAR_W = 4  // mm
  if (rainbow) {
    const segH = height / RAINBOW.length
    RAINBOW.forEach(([r,g,b], i) => {
      pdf.setFillColor(r, g, b)
      pdf.rect(0, yMm + i * segH, BAR_W, segH, 'F')
    })
  } else {
    const [r,g,b] = TYPE_ACCENT[typeKey] || DEFAULT_ACCENT
    pdf.setFillColor(r, g, b)
    pdf.rect(0, yMm, BAR_W, height, 'F')
    // Subtle darker stripe at bar edge
    pdf.setFillColor(r - 20, g - 20, b - 20)
    pdf.rect(BAR_W - 0.5, yMm, 0.5, height, 'F')
  }
}

/** Thin separator line at the bottom of a block. */
function drawSep(pdf, yMm) {
  pdf.setDrawColor(218, 212, 204)
  pdf.setLineWidth(0.18)
  pdf.line(PAD, yMm, W - PAD, yMm)
}

/** Cover block — 1/4 page. */
function drawCoverBlock(pdf, yMm, entries, title = "Lena's Diary") {
  const bh = BH_LARGE

  // Background — slightly warmer cream
  pdf.setFillColor(249, 244, 234)
  pdf.rect(0, yMm, W, bh, 'F')

  drawAccentBar(pdf, yMm, bh, /* rainbow */ true)

  // Date range
  const dates = entries.map(e => e.date).filter(Boolean).sort()
  const from  = dates[0]     ? fmtDate(dates[0])     : ''
  const to    = dates.at(-1) ? fmtDate(dates.at(-1)) : ''
  const range = !from ? '' : from === to ? from : `${from} – ${to}`

  const tx = 10   // text start x (right of bar + gap)

  // Title — two lines for visual weight
  txt(pdf, title, tx, yMm + 20,
    { style:'bold', size:24, color:'#2c2520' })

  if (range) {
    txt(pdf, range, tx, yMm + 33,
      { style:'italic', size:11, color:'#8a7a6a' })
  }
  txt(pdf, `${entries.length} recuerdos`, tx, yMm + 43,
    { size:8.5, color:'#b8a898' })

  // Mini washi decoration — top-right corner
  pdf.setFillColor(197, 225, 222)  // mint
  pdf.rect(W - 36, yMm + 4, 36, 8, 'F')
  pdf.setFillColor(255, 200, 208)  // pink
  pdf.rect(W - 36, yMm + 12, 36, 8, 'F')
  pdf.setFillColor(255, 229, 118)  // yellow
  pdf.rect(W - 36, yMm + 20, 36, 8, 'F')

  // Subtitle below washi
  txt(pdf, 'un diario de momentos\nespeciales 💕', W - PAD, yMm + 42,
    { style:'italic', size:7, color:'#c8b8a8', align:'right' })

  drawSep(pdf, yMm + bh)
}

/** Photo entry block — 1/4 page. */
async function drawPhotoBlock(pdf, entry, yMm) {
  const bh = BH_LARGE  // 74.25 mm

  // White background
  pdf.setFillColor(255, 255, 255)
  pdf.rect(0, yMm, W, bh, 'F')

  drawAccentBar(pdf, yMm, bh, false, entry.type)

  // ── Photo area (left side) ────────────────────────────────────────────────
  const PAD_V  = 7           // vertical padding within block
  const IMG_SZ = bh - PAD_V * 2   // ~60 mm — square photo area
  const IMG_X  = 7           // mm from left (after accent bar + gap)
  const IMG_Y  = yMm + PAD_V

  // Grey background for photo area (letterbox fill)
  pdf.setFillColor(238, 238, 238)
  pdf.rect(IMG_X, IMG_Y, IMG_SZ, IMG_SZ, 'F')

  if (entry.photo) {
    const img = await loadImage(entry.photo)
    if (img) {
      const { w: dw, h: dh } = fitContain(img.w, img.h, IMG_SZ, IMG_SZ)
      const ox = (IMG_SZ - dw) / 2
      const oy = (IMG_SZ - dh) / 2
      pdf.addImage(img.data, 'JPEG', IMG_X + ox, IMG_Y + oy, dw, dh)
    }
  }

  // ── Text area (right side) ────────────────────────────────────────────────
  const TX = IMG_X + IMG_SZ + 5   // text column x-start
  const TW = W - TX - PAD          // text column width
  let   curY = yMm + PAD_V + 5

  // Title
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.setTextColor(...hex('#2c2520'))
  const titleLines = pdf.splitTextToSize(entry.title, TW)
  pdf.text(titleLines.slice(0, 2), TX, curY)
  curY += titleLines.slice(0, 2).length * 6 + 2

  // Note (up to 4 lines)
  if (entry.note) {
    const note = entry.note.length > 220 ? entry.note.slice(0, 220) + '…' : entry.note
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(...hex('#5a4a3a'))
    const noteLines = pdf.splitTextToSize(note, TW)
    pdf.text(noteLines.slice(0, 4), TX, curY)
    curY += noteLines.slice(0, 4).length * 4.8 + 2
  }

  // People tags
  if (entry.people && entry.people.length > 0) {
    txt(pdf, entry.people.join(', '), TX, curY, { size:7, color:'#888888' })
    curY += 5
  }

  // Author · date · location — anchored near bottom of block
  const meta = [entry.uploadedByName, fmtDate(entry.date), locText(entry.location)]
    .filter(Boolean).join('  ·  ')
  if (meta) {
    txt(pdf, meta, TX, yMm + bh - PAD_V, { size:7, color:'#aaaaaa' })
  }

  drawSep(pdf, yMm + bh)
}

/** Text entry block (no photo) — 1/6 page. */
function drawTextBlock(pdf, entry, yMm) {
  const bh = BH_SMALL  // 49.5 mm

  // Cream background
  pdf.setFillColor(253, 250, 245)
  pdf.rect(0, yMm, W, bh, 'F')

  drawAccentBar(pdf, yMm, bh, false, entry.type)

  const TX = 10, TW = W - TX - PAD
  let curY = yMm + 11

  // Type label + title
  const label = TYPE_LABEL[entry.type] || ''
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10.5)
  pdf.setTextColor(...hex('#2c2520'))
  const titleFull  = `${label}  ${entry.title}`
  const titleLines = pdf.splitTextToSize(titleFull, TW)
  pdf.text(titleLines[0] + (titleLines.length > 1 ? '…' : ''), TX, curY)
  curY += 7

  // Note (up to 2 lines)
  if (entry.note) {
    const note = entry.note.length > 140 ? entry.note.slice(0, 140) + '…' : entry.note
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8.5)
    pdf.setTextColor(...hex('#5a4a3a'))
    const noteLines = pdf.splitTextToSize(note, TW)
    pdf.text(noteLines.slice(0, 2), TX, curY)
    curY += noteLines.slice(0, 2).length * 5 + 1
  }

  // People tags
  if (entry.people && entry.people.length > 0) {
    txt(pdf, entry.people.join(', '), TX, curY, { size:7, color:'#888888' })
  }

  // Meta — author · date · location
  const meta = [entry.uploadedByName, fmtDate(entry.date), locText(entry.location)]
    .filter(Boolean).join('  ·  ')
  if (meta) {
    txt(pdf, meta, TX, yMm + bh - 5, { size:7, color:'#aaaaaa' })
  }

  drawSep(pdf, yMm + bh)
}

// ─── Page packing ─────────────────────────────────────────────────────────────

function packIntoPages(entries) {
  /**
   * Build a flat list of "block" descriptors, then bin them greedily
   * into A4 pages of height H mm each.
   */
  const blocks = [
    { kind: 'cover', height: BH_LARGE },
    ...entries.map(e => ({
      kind:   e.photo ? 'photo' : 'text',
      entry:  e,
      height: e.photo ? BH_LARGE : BH_SMALL,
    })),
  ]

  const pages = []
  let page = [], remaining = H

  for (const block of blocks) {
    if (block.height > remaining + 0.01) {
      pages.push(page)
      page = []
      remaining = H
    }
    page.push({ ...block, yMm: H - remaining })
    remaining -= block.height
  }
  if (page.length > 0) pages.push(page)
  return pages
}

// ─── Artwork block drawing ────────────────────────────────────────────────────

const TECHNIQUE_ACCENT = {
  dibujo:     [253, 243, 150],
  pintura:    [183, 232, 222],
  manualidad: [255, 211, 217],
  otro:       [221, 211, 247],
}

const TECHNIQUE_LABEL = {
  dibujo: 'Drawing', pintura: 'Painting', manualidad: 'Craft', otro: 'Other',
}

const ARTWORK_LOCATION_LABELS = {
  'home':        'Home',
  'de-heiacker': 'De Heiacker',
  'veldhoven':   'Veldhoven',
}

function artLocText(l) {
  if (!l) return null
  return ARTWORK_LOCATION_LABELS[l] || l
}

async function drawArtworkPhotoBlock(pdf, artwork, yMm) {
  const bh = BH_LARGE * 1.5  // 3/8 page — more room for the image

  const [r, g, b] = TECHNIQUE_ACCENT[artwork.technique] || TECHNIQUE_ACCENT.otro
  pdf.setFillColor(255, 255, 255)
  pdf.rect(0, yMm, W, bh, 'F')
  pdf.setFillColor(r, g, b)
  pdf.rect(0, yMm, 4, bh, 'F')

  const PAD_V = 7
  const IMG_SZ = bh - PAD_V * 2
  const IMG_X = 7
  const IMG_Y = yMm + PAD_V

  pdf.setFillColor(238, 238, 238)
  pdf.rect(IMG_X, IMG_Y, IMG_SZ, IMG_SZ, 'F')

  if (artwork.photo) {
    const img = await loadImage(artwork.photo)
    if (img) {
      const { w: dw, h: dh } = fitContain(img.w, img.h, IMG_SZ, IMG_SZ)
      const ox = (IMG_SZ - dw) / 2
      const oy = (IMG_SZ - dh) / 2
      pdf.addImage(img.data, 'JPEG', IMG_X + ox, IMG_Y + oy, dw, dh)
    }
  }

  const TX = IMG_X + IMG_SZ + 5
  const TW = W - TX - PAD
  let curY = yMm + PAD_V + 5

  const techLabel = TECHNIQUE_LABEL[artwork.technique] || ''
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.setTextColor(...hex('#2c2520'))
  pdf.text(artwork.title, TX, curY)
  curY += 7

  txt(pdf, techLabel, TX, curY, { size: 8, color: '#9b8ca8', style: 'italic' })
  curY += 6

  if (artwork.note) {
    const note = artwork.note.length > 200 ? artwork.note.slice(0, 200) + '…' : artwork.note
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(...hex('#5a4a3a'))
    const lines = pdf.splitTextToSize(note, TW)
    pdf.text(lines.slice(0, 4), TX, curY)
  }

  const meta = [artwork.uploadedByName, fmtDate(artwork.date), artLocText(artwork.location)]
    .filter(Boolean).join('  ·  ')
  if (meta) txt(pdf, meta, TX, yMm + bh - PAD_V, { size: 7, color: '#aaaaaa' })

  drawSep(pdf, yMm + bh)
  return bh
}

function drawArtworkTextBlock(pdf, artwork, yMm) {
  const bh = BH_SMALL
  const [r, g, b] = TECHNIQUE_ACCENT[artwork.technique] || TECHNIQUE_ACCENT.otro
  pdf.setFillColor(253, 250, 245)
  pdf.rect(0, yMm, W, bh, 'F')
  pdf.setFillColor(r, g, b)
  pdf.rect(0, yMm, 4, bh, 'F')

  const TX = 10, TW = W - TX - PAD
  const techLabel = TECHNIQUE_LABEL[artwork.technique] || ''

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10.5)
  pdf.setTextColor(...hex('#2c2520'))
  pdf.text(`${techLabel}  ${artwork.title}`, TX, yMm + 11)

  if (artwork.note) {
    const note = artwork.note.length > 140 ? artwork.note.slice(0, 140) + '…' : artwork.note
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8.5)
    pdf.setTextColor(...hex('#5a4a3a'))
    const lines = pdf.splitTextToSize(note, TW)
    pdf.text(lines.slice(0, 2), TX, yMm + 19)
  }

  const meta = [artwork.uploadedByName, fmtDate(artwork.date), artLocText(artwork.location)]
    .filter(Boolean).join('  ·  ')
  if (meta) txt(pdf, meta, TX, yMm + bh - 5, { size: 7, color: '#aaaaaa' })

  drawSep(pdf, yMm + bh)
  return bh
}

function packArtworksIntoPages(artworks) {
  const BH_ART_LARGE = BH_LARGE * 1.5
  const blocks = [
    { kind: 'cover', height: BH_LARGE },
    ...artworks.map(a => ({
      kind:   a.photo ? 'art-photo' : 'art-text',
      entry:  a,
      height: a.photo ? BH_ART_LARGE : BH_SMALL,
    })),
  ]
  const pages = []
  let page = [], remaining = H
  for (const block of blocks) {
    if (block.height > remaining + 0.01) { pages.push(page); page = []; remaining = H }
    page.push({ ...block, yMm: H - remaining })
    remaining -= block.height
  }
  if (page.length > 0) pages.push(page)
  return pages
}

// ─── Public API ───────────────────────────────────────────────────────────────
export function compactPages(entries) {
  const pages = packIntoPages(entries)

  const PX_PER_MM = 794 / 210

  return pages.map(page =>
    page.map(block => ({
      ...block,
      yPx: block.yMm * PX_PER_MM,
    }))
  )
}
/**
 * Build a PDF from the filtered entries array.
 * onProgress(0–100) is called after each page is drawn.
 */
export async function buildPdf(entries, onProgress) {
  const pdf   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pages = packIntoPages(entries)

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) pdf.addPage()

    // Page background
    pdf.setFillColor(253, 250, 245)
    pdf.rect(0, 0, W, H, 'F')

    for (const block of pages[i]) {
      if      (block.kind === 'cover') drawCoverBlock(pdf, block.yMm, entries)
      else if (block.kind === 'photo') await drawPhotoBlock(pdf, block.entry, block.yMm)
      else                             drawTextBlock(pdf, block.entry, block.yMm)
    }

    onProgress?.(Math.round(((i + 1) / pages.length) * 100))
  }

  return pdf
}

export function compactArtworkPages(artworks) {
  const BH_ART_LARGE = BH_LARGE * 1.5
  const PX_PER_MM = 794 / 210
  const pages = packArtworksIntoPages(artworks)
  return pages.map(page =>
    page.map(block => ({ ...block, yPx: block.yMm * PX_PER_MM }))
  )
}

export async function buildArtworkPdf(artworks, onProgress) {
  const pdf   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pages = packArtworksIntoPages(artworks)

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) pdf.addPage()
    pdf.setFillColor(253, 250, 245)
    pdf.rect(0, 0, W, H, 'F')

    for (const block of pages[i]) {
      if      (block.kind === 'cover')     drawCoverBlock(pdf, block.yMm, artworks, "Lena's Art")
      else if (block.kind === 'art-photo') await drawArtworkPhotoBlock(pdf, block.entry, block.yMm)
      else                                 drawArtworkTextBlock(pdf, block.entry, block.yMm)
    }
    onProgress?.(Math.round(((i + 1) / pages.length) * 100))
  }
  return pdf
}
