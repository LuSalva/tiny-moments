// ─── Constants ───────────────────────────────────────────────────────────────
export const PAGE_W = 794
export const PAGE_H = 1123

const TITLE_FONT = "'Fredoka One', 'Fredoka', cursive"
const BODY_FONT  = "'Patrick Hand', cursive"

// ─── Shared color tokens ─────────────────────────────────────────────────────
const WASHI = [
  'rgba(173,216,210,0.78)',   // 0 mint
  'rgba(255,182,193,0.78)',   // 1 pink
  'rgba(255,215,80,0.78)',    // 2 yellow
  'rgba(200,180,240,0.78)',   // 3 lavender
  'rgba(255,160,122,0.78)',   // 4 coral
  'rgba(144,238,180,0.78)',   // 5 sage
]

// Vertical zigzag torn-paper bottom edge (two distinct patterns)
const TORN = [
  `polygon(0% 0%, 100% 0%, 100% 93%,
    98% 96%, 96% 94%, 93% 97%, 91% 95%, 88% 97%,
    86% 94%, 83% 97%, 81% 95%, 78% 98%, 76% 95%,
    73% 97%, 71% 94%, 68% 97%, 66% 95%, 63% 97%,
    61% 94%, 58% 97%, 56% 95%, 53% 98%, 51% 95%,
    48% 97%, 46% 94%, 43% 97%, 41% 95%, 38% 97%,
    36% 94%, 33% 97%, 31% 95%, 28% 98%, 26% 95%,
    23% 97%, 21% 94%, 18% 97%, 16% 95%, 13% 97%,
    11% 94%, 8% 97%, 6% 95%, 3% 97%, 0% 95%)`,

  `polygon(0% 0%, 100% 0%, 100% 95%,
    97% 97%, 95% 95%, 92% 98%, 90% 95%, 87% 97%,
    85% 95%, 82% 98%, 80% 96%, 77% 94%, 75% 97%,
    72% 95%, 70% 97%, 67% 95%, 64% 98%, 62% 96%,
    59% 94%, 57% 97%, 54% 95%, 52% 97%, 49% 95%,
    46% 98%, 44% 96%, 41% 94%, 39% 97%, 36% 95%,
    34% 97%, 31% 95%, 28% 98%, 26% 96%, 23% 94%,
    21% 97%, 18% 95%, 16% 97%, 13% 95%, 10% 98%,
    8% 96%, 5% 94%, 2% 97%, 0% 95%)`,
]

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
function fmt(d) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function locLabel(loc) {
  if (!loc) return null
  if (loc === 'home')      return '🏠 Home'
  if (loc === 'veldhoven') return '📍 Veldhoven'
  return `📍 ${loc}`
}

const TYPE_LABELS = {
  frase:    '💬 Frase',
  creacion: '🎨 Creación',
  foto:     '📸 Foto',
  hito:     '🌟 Hito',
  cancion:  '🎵 Canción',
  recuerdo: '💛 Recuerdo',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Corrugated-cardboard texture circle */
function CardboardDot({ size, top, left }) {
  return (
    <div style={{
      position: 'absolute', top, left,
      width: size, height: size, borderRadius: '50%',
      background: 'repeating-linear-gradient(0deg,#c4a06e 0px,#c4a06e 3px,#d4b280 3px,#d4b280 6px)',
      opacity: 0.65,
    }} />
  )
}

/** Washi tape strip — semi-transparent with vertical stripe repeat */
function WashiStrip({ top, left, right, width = 90, height = 22, colorIdx = 0, rotation = 0 }) {
  return (
    <div style={{
      position: 'absolute', top,
      ...(left !== undefined ? { left } : {}),
      ...(right !== undefined ? { right } : {}),
      width, height, zIndex: 10,
      background: WASHI[colorIdx % WASHI.length],
      backgroundImage: 'repeating-linear-gradient(90deg,transparent 0,transparent 9px,rgba(255,255,255,0.22) 9px,rgba(255,255,255,0.22) 11px)',
      transform: `rotate(${rotation}deg)`,
    }} />
  )
}

/** Hand-drawn rainbow using quadratic bezier arcs */
function Rainbow() {
  const CX = 397, BY = 490   // center-x and base-y within the SVG viewport

  // Each arc: outer → inner.  wobble offsets make each arc slightly imperfect.
  const ARCS = [
    { c: '#E53935', r: 318, sw: 34, wx:  14, wy: -18 },  // red
    { c: '#FF7043', r: 280, sw: 32, wx: -10, wy:  12 },  // orange
    { c: '#FDD835', r: 242, sw: 32, wx:  12, wy:  -8 },  // yellow
    { c: '#43A047', r: 204, sw: 32, wx: -14, wy:  14 },  // green
    { c: '#1E88E5', r: 166, sw: 32, wx:  10, wy: -10 },  // blue
    { c: '#7B1FA2', r: 128, sw: 30, wx: -12, wy:   8 },  // purple
  ]

  return (
    <svg width={PAGE_W} height={520}
      viewBox={`0 0 ${PAGE_W} 520`}
      style={{ position: 'absolute', bottom: 0, left: 0 }}>
      {ARCS.map(({ c, r, sw, wx, wy }) => (
        <path key={c}
          d={`M ${CX - r} ${BY} Q ${CX + wx} ${BY - r + wy} ${CX + r} ${BY}`}
          fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" />
      ))}
    </svg>
  )
}

// ─── Cover page ───────────────────────────────────────────────────────────────
export function CoverPage({ entries }) {
  const dates = entries.map(e => e.date).filter(Boolean).sort()
  const from  = dates[0]     ? fmt(dates[0])     : ''
  const to    = dates.at(-1) ? fmt(dates.at(-1)) : ''
  const range = !from ? '' : from === to ? from : `${from} – ${to}`

  return (
    <div style={{
      width: PAGE_W, height: PAGE_H,
      background: '#fdfaf5',
      position: 'relative', overflow: 'hidden',
      fontFamily: BODY_FONT, boxSizing: 'border-box',
    }}>
      {/* Cardboard texture dots */}
      <CardboardDot size={96}  top={44}  left={28} />
      <CardboardDot size={68}  top={200} left={680} />
      <CardboardDot size={84}  top={900} left={655} />
      <CardboardDot size={52}  top={820} left={40} />

      {/* Washi tape — top-left corner, diagonal */}
      <WashiStrip top={22}  left={-24} width={220} height={26} colorIdx={0} rotation={-13} />
      {/* Washi tape — top-right corner */}
      <WashiStrip top={38}  right={-28} width={220} height={26} colorIdx={1} rotation={12} />

      {/* Title block — upper centre */}
      <div style={{
        position: 'absolute', top: 110, left: 0, right: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '0 90px', textAlign: 'center',
      }}>
        <h1 style={{
          fontFamily: TITLE_FONT, fontSize: 86, fontWeight: 400,
          color: '#2c2520', margin: 0, lineHeight: 1.1, letterSpacing: 1,
        }}>
          El diario<br />de Ella
        </h1>
        {range && (
          <p style={{
            fontFamily: BODY_FONT, fontSize: 26, color: '#8a7a6a',
            marginTop: 22, letterSpacing: 0.5,
          }}>
            {range}
          </p>
        )}
        <p style={{
          fontFamily: BODY_FONT, fontSize: 19, color: '#b8a898', marginTop: 10,
        }}>
          {entries.length} recuerdo{entries.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Rainbow — fills lower portion of page */}
      <Rainbow />
    </div>
  )
}

// ─── Photo page ───────────────────────────────────────────────────────────────

// Layout configs: position + rotation + photo dimensions per slot
const PHOTO_CFG = {
  1: [{ t: 290, l: 182, rot: -1, pw: 390, ph: 305 }],
  2: [
    { t:  60, l: 40,  rot: -2, pw: 340, ph: 270 },
    { t: 560, l: 395, rot:  2, pw: 340, ph: 270 },
  ],
  3: [
    { t:  40, l: 28,  rot: -3, pw: 310, ph: 245 },
    { t:  50, l: 440, rot:  2, pw: 310, ph: 245 },
    { t: 590, l: 228, rot: -1, pw: 310, ph: 245 },
  ],
  4: [
    { t:  48, l: 22,  rot: -2, pw: 278, ph: 218 },
    { t:  34, l: 448, rot:  3, pw: 278, ph: 218 },
    { t: 580, l: 38,  rot:  2, pw: 278, ph: 218 },
    { t: 562, l: 440, rot: -3, pw: 278, ph: 218 },
  ],
}

function Polaroid({ entry, t, l, rot, pw, ph, colorIdx }) {
  const note  = entry.note
    ? (entry.note.length > 75 ? entry.note.slice(0, 75) + '…' : entry.note)
    : ''
  const cardW = pw + 32   // 16px padding each side
  // Washi tape sticks out -11px above card top → parent needs overflow:visible
  return (
    <div style={{
      position: 'absolute', top: t, left: l, width: cardW,
      background: 'white', padding: `16px 16px 46px`,
      boxShadow: '4px 5px 16px rgba(0,0,0,0.22)',
      transform: `rotate(${rot}deg)`,
      boxSizing: 'content-box',
    }}>
      {/* Washi tape across top */}
      <div style={{
        position: 'absolute', top: -11,
        left: Math.round(cardW * 0.22),
        width: Math.round(cardW * 0.56), height: 22,
        background: WASHI[colorIdx % WASHI.length],
        backgroundImage: 'repeating-linear-gradient(90deg,transparent 0,transparent 9px,rgba(255,255,255,0.22) 9px,rgba(255,255,255,0.22) 11px)',
        transform: 'rotate(-4deg)',
      }} />

      {/* Photo */}
      <img src={entry.photo}
        style={{ width: pw, height: ph, objectFit: 'cover', display: 'block' }} />

      {/* Caption */}
      <div style={{ paddingTop: 9, textAlign: 'center' }}>
        <div style={{
          fontFamily: BODY_FONT, fontSize: 15, color: '#2c2520',
          lineHeight: 1.3, marginBottom: 4,
        }}>
          {entry.title}
        </div>
        {note && (
          <div style={{
            fontFamily: BODY_FONT, fontSize: 11, color: '#9a8a7a',
            lineHeight: 1.4,
          }}>
            {note}
          </div>
        )}
        {/* Torn-paper author label */}
        {(entry.uploadedByName || entry.date) && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 7 }}>
            {entry.uploadedByName && (
              <span style={{
                fontFamily: BODY_FONT, fontSize: 10, color: '#7a5a30',
                background: '#fdf0d0',
                border: '1px solid rgba(180,140,60,0.35)',
                padding: '1px 7px',
                borderRadius: '3px 7px 5px 4px',
                transform: 'rotate(-1deg)', display: 'inline-block',
              }}>
                {entry.uploadedByName}
              </span>
            )}
            <span style={{
              fontFamily: BODY_FONT, fontSize: 10, color: '#aaa',
            }}>
              {fmt(entry.date)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export function PhotoPage({ entries, pageNum = 0 }) {
  const n   = Math.min(entries.length, 4)
  const cfg = PHOTO_CFG[n] || PHOTO_CFG[4]

  return (
    <div style={{
      width: PAGE_W, height: PAGE_H,
      background: '#fff',
      position: 'relative', overflow: 'visible',
      fontFamily: BODY_FONT, boxSizing: 'border-box',
    }}>
      {entries.slice(0, 4).map((entry, i) => (
        <Polaroid key={entry.id}
          entry={entry} colorIdx={(pageNum + i) % WASHI.length}
          {...cfg[i]} />
      ))}
    </div>
  )
}

// ─── Text page ────────────────────────────────────────────────────────────────

const TEXT_CFG = {
  1: [{ t: 240, l: 52, rot: -1   }],
  2: [
    { t:  40, l: 52, rot: -1.5 },
    { t: 530, l: 62, rot:  1   },
  ],
}

function LinedPaper({ entry, t, l, rot, colorIdx }) {
  const note = entry.note
    ? (entry.note.length > 220 ? entry.note.slice(0, 220) + '…' : entry.note)
    : ''
  const loc  = locLabel(entry.location)
  const hasTags = loc || (entry.people && entry.people.length > 0)

  const PAPER_W = 686
  const PAPER_H = 400

  return (
    <div style={{
      position: 'absolute', top: t, left: l,
      width: PAPER_W, height: PAPER_H,
      transform: `rotate(${rot}deg)`,
      transformOrigin: 'center center',
    }}>
      {/* Washi tape across top */}
      <div style={{
        position: 'absolute', top: -11,
        left: Math.round(PAPER_W * 0.33),
        width: Math.round(PAPER_W * 0.34), height: 22, zIndex: 2,
        background: WASHI[colorIdx % WASHI.length],
        backgroundImage: 'repeating-linear-gradient(90deg,transparent 0,transparent 9px,rgba(255,255,255,0.22) 9px,rgba(255,255,255,0.22) 11px)',
        transform: 'rotate(-3deg)',
      }} />

      {/* Lined paper body */}
      <div style={{
        width: PAPER_W, height: PAPER_H,
        background: 'white',
        // Left: pink margin line; Right: repeating blue horizontal lines
        backgroundImage: [
          'linear-gradient(90deg,transparent 66px,rgba(240,100,100,0.35) 66px,rgba(240,100,100,0.35) 68px,transparent 68px)',
          'repeating-linear-gradient(transparent 0px,transparent 29px,rgba(160,210,240,0.9) 29px,rgba(160,210,240,0.9) 31px)',
        ].join(', '),
        backgroundRepeat: 'no-repeat, repeat',
        backgroundPosition: '0 0, 0 46px',
        backgroundSize: '100% 100%, auto',
        clipPath: TORN[colorIdx % TORN.length],
        boxShadow: '2px 4px 10px rgba(0,0,0,0.12)',
        padding: '46px 26px 26px 80px',
        boxSizing: 'border-box',
      }}>
        {/* Type + title — sits on first ruled line */}
        <div style={{
          fontFamily: BODY_FONT, fontSize: 19, color: '#2c2520',
          lineHeight: '30px', marginBottom: 0, fontWeight: 400,
        }}>
          {TYPE_LABELS[entry.type] || entry.type}{'  '}{entry.title}
        </div>

        {/* Date + author — second line */}
        <div style={{
          fontFamily: BODY_FONT, fontSize: 13, color: '#aaa',
          lineHeight: '30px',
        }}>
          {fmt(entry.date)}{entry.uploadedByName ? `  ·  ${entry.uploadedByName}` : ''}
        </div>

        {/* Note — body text aligned to ruled lines */}
        {note && (
          <div style={{
            fontFamily: BODY_FONT, fontSize: 15, color: '#4a3a2a',
            lineHeight: '30px', marginTop: 0,
          }}>
            {note}
          </div>
        )}

        {/* Tags */}
        {hasTags && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {loc && (
              <span style={{
                fontFamily: BODY_FONT, fontSize: 12,
                background: '#fef9e0', border: '1px solid rgba(200,170,60,0.4)',
                borderRadius: 4, padding: '1px 8px', color: '#7a6030',
              }}>
                {loc}
              </span>
            )}
            {entry.people?.map(p => (
              <span key={p} style={{
                fontFamily: BODY_FONT, fontSize: 12,
                background: '#e8f8f0', border: '1px solid rgba(60,180,120,0.4)',
                borderRadius: 4, padding: '1px 8px', color: '#2a6a40',
              }}>
                {p}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function TextPage({ entries, pageNum = 0 }) {
  const n   = Math.min(entries.length, 2)
  const cfg = TEXT_CFG[n] || TEXT_CFG[2]

  return (
    <div style={{
      width: PAGE_W, height: PAGE_H,
      background: '#fdfaf5',
      position: 'relative', overflow: 'visible',
      fontFamily: BODY_FONT, boxSizing: 'border-box',
    }}>
      {entries.slice(0, 2).map((entry, i) => (
        <LinedPaper key={entry.id}
          entry={entry} colorIdx={(pageNum + i) % WASHI.length}
          {...cfg[i]} />
      ))}
    </div>
  )
}
