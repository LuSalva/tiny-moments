/**
 * DiaryPages.jsx — React preview components for the PDF diary.
 *
 * Layout mirrors pdfUtils.js exactly:
 *   Cover block = PAGE_H / 4  (1/4 page)
 *   Photo block = PAGE_H / 4  (1/4 page)
 *   Text block  = PAGE_H / 6  (1/6 page)
 *
 * All blocks are absolutely positioned within a PAGE_W × PAGE_H container,
 * matching the coordinates used by the jsPDF drawing functions.
 */

export const PAGE_W = 794
export const PAGE_H = 1123

// Block heights in px — must equal pdfUtils BH_LARGE / BH_SMALL scaled to px
const BH_LARGE = PAGE_H / 4    // 280.75 px  — cover + photo entries
const BH_SMALL = PAGE_H / 6    // 187.17 px  — text-only entries

// Scaling factor: px per mm  (794 px / 210 mm = 3.781)
const PX = PAGE_W / 210

// Shared layout constants — mirror pdfUtils values, converted px
const ACCENT_W = Math.round(4 * PX)    // 15 px  accent bar
const H_PAD    = Math.round(8 * PX)    // 30 px  horizontal margin
const V_PAD    = Math.round(7 * PX)    // 26 px  vertical padding inside photo block

// Typography — same fonts as the rest of the app (loaded in index.css)
const TITLE_FONT = "'Fredoka One', cursive"
const BODY_FONT  = "'Patrick Hand', cursive"

// Accent colours per entry type — RGB values matching pdfUtils TYPE_ACCENT
const TYPE_ACCENT = {
  frase:    'rgb(255,243,150)',
  creacion: 'rgb(183,232,222)',
  foto:     'rgb(255,211,217)',
  hito:     'rgb(221,211,247)',
  cancion:  'rgb(255,240,160)',
  recuerdo: 'rgb(255,211,217)',
}

const RAINBOW_COLORS = [
  '#e53935','#ff7043','#fdd835','#43a047','#1e88e5','#7b1fa2',
]

const TYPE_LABEL = {
  frase:'Quote', creacion:'Creation', foto:'Photo',
  hito:'Milestone', cancion:'Song', recuerdo:'Memory',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(d) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function locTxt(l) {
  if (!l) return null
  if (l === 'home')      return 'Home'
  if (l === 'veldhoven') return 'Veldhoven'
  return l
}

// ─── Shared micro-components ──────────────────────────────────────────────────

/** Rainbow left bar for the cover block */
function RainbowBar({ height }) {
  const segH = height / RAINBOW_COLORS.length
  return (
    <div style={{ position:'absolute', top:0, left:0, width:ACCENT_W, height }}>
      {RAINBOW_COLORS.map((c, i) => (
        <div key={c} style={{ height: segH, background: c }} />
      ))}
    </div>
  )
}

/** Solid-colour accent bar for entry blocks */
function AccentBar({ height, typeKey }) {
  return (
    <div style={{
      position:'absolute', top:0, left:0,
      width:ACCENT_W, height,
      background: TYPE_ACCENT[typeKey] || 'rgb(240,236,250)',
    }} />
  )
}

/** Thin separator line drawn at the bottom of each block */
function Sep({ blockH }) {
  return (
    <div style={{
      position:'absolute', bottom:0,
      left:H_PAD, right:H_PAD,
      height:1, background:'rgb(218,212,204)',
    }} />
  )
}

// ─── Cover block ──────────────────────────────────────────────────────────────
function CoverBlock({ yPx, allEntries }) {
  const bh = BH_LARGE
  const tx = ACCENT_W + 23    // text x-start
  const tw = PAGE_W - tx - H_PAD

  const dates = (allEntries || []).map(e => e.date).filter(Boolean).sort()
  const from  = dates[0]     ? fmt(dates[0])      : ''
  const to    = dates.at?.(-1) ? fmt(dates.at(-1)) : ''
  const range = !from ? '' : from === to ? from : `${from} – ${to}`

  return (
    <div style={{
      position:'absolute', top:yPx, left:0, width:PAGE_W, height:bh,
      background:'rgb(249,244,234)',
    }}>
      <RainbowBar height={bh} />

      {/* Washi tape strips — top-right corner, three colours */}
      {['rgb(197,225,222)','rgb(255,200,208)','rgb(255,229,118)'].map((c, i) => (
        <div key={i} style={{
          position:'absolute', right:0, top: i * Math.round(bh * 0.107),
          width: Math.round(PAGE_W * 0.17), height: Math.round(bh * 0.107),
          background: c,
          backgroundImage:'repeating-linear-gradient(90deg,transparent 0,transparent 38px,rgba(255,255,255,0.2) 38px,rgba(255,255,255,0.2) 42px)',
        }} />
      ))}

      {/* Title */}
      <div style={{
        position:'absolute', left:tx, top: Math.round(bh * 0.12),
        width: tw,
        fontFamily: TITLE_FONT, fontWeight:400,
        fontSize: Math.round(bh * 0.145),
        color:'#2c2520', lineHeight:1.15,
        whiteSpace:'nowrap', overflow:'hidden',
      }}>
        Mia's Diary
      </div>

      {/* Date range */}
      {range && (
        <div style={{
          position:'absolute', left:tx, top: Math.round(bh * 0.50),
          fontFamily:BODY_FONT, fontStyle:'italic',
          fontSize: Math.round(bh * 0.072),
          color:'#8a7a6a',
        }}>
          {range}
        </div>
      )}

      {/* Entry count */}
      <div style={{
        position:'absolute', left:tx, top: Math.round(bh * 0.64),
        fontFamily:BODY_FONT,
        fontSize: Math.round(bh * 0.058),
        color:'#b8a898',
      }}>
        {(allEntries || []).length} memories
      </div>

      <Sep blockH={bh} />
    </div>
  )
}

// ─── Photo block ──────────────────────────────────────────────────────────────
function PhotoBlock({ yPx, entry }) {
  const bh    = BH_LARGE
  const imgSz = bh - V_PAD * 2          // square photo area height = width
  const imgX  = ACCENT_W + 11           // left edge of photo box
  const tx    = imgX + imgSz + 19       // text column x-start
  const tw    = PAGE_W - tx - H_PAD     // text column width

  const note = entry.note
    ? (entry.note.length > 220 ? entry.note.slice(0,220) + '…' : entry.note)
    : ''

  const meta = [entry.uploadedByName, fmt(entry.date), locTxt(entry.location)]
    .filter(Boolean).join('  ·  ')

  return (
    <div style={{
      position:'absolute', top:yPx, left:0, width:PAGE_W, height:bh,
      background:'#ffffff',
    }}>
      <AccentBar height={bh} typeKey={entry.type} />

      {/* Photo box — grey fill is the letterbox area */}
      <div style={{
        position:'absolute', top:V_PAD, left:imgX,
        width:imgSz, height:imgSz,
        background:'rgb(238,238,238)',
        display:'flex', alignItems:'center', justifyContent:'center',
        overflow:'hidden',
      }}>
        {entry.photo && (
          <img src={entry.photo} alt={entry.title}
            style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain', display:'block' }} />
        )}
      </div>

      {/* Text column */}
      <div style={{
        position:'absolute',
        top: V_PAD + Math.round(bh * 0.04),
        left:tx, width:tw,
        bottom: V_PAD + Math.round(bh * 0.1),
        overflow:'hidden',
        display:'flex', flexDirection:'column', gap: Math.round(bh * 0.025),
      }}>
        {/* Title */}
        <div style={{
          fontFamily:BODY_FONT, fontWeight:700,
          fontSize: Math.round(bh * 0.065),
          color:'#2c2520', lineHeight:1.2,
          display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical',
          overflow:'hidden',
        }}>
          {entry.title}
        </div>

        {/* Note */}
        {note && (
          <div style={{
            fontFamily:BODY_FONT,
            fontSize: Math.round(bh * 0.044),
            color:'#5a4a3a', lineHeight:1.4,
            display:'-webkit-box', WebkitLineClamp:4, WebkitBoxOrient:'vertical',
            overflow:'hidden',
          }}>
            {note}
          </div>
        )}

        {/* People */}
        {entry.people?.length > 0 && (
          <div style={{
            fontFamily:BODY_FONT,
            fontSize: Math.round(bh * 0.038),
            color:'#888888', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
          }}>
            {entry.people.join(', ')}
          </div>
        )}
      </div>

      {/* Meta line — pinned to bottom of text column */}
      {meta && (
        <div style={{
          position:'absolute',
          bottom: V_PAD + 4,
          left:tx, width:tw,
          fontFamily:BODY_FONT,
          fontSize: Math.round(bh * 0.038),
          color:'#aaaaaa', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
        }}>
          {meta}
        </div>
      )}

      <Sep blockH={bh} />
    </div>
  )
}

// ─── Text block ───────────────────────────────────────────────────────────────
function TextBlock({ yPx, entry }) {
  const bh = BH_SMALL
  const tx = ACCENT_W + 23
  const tw = PAGE_W - tx - H_PAD

  const label = TYPE_LABEL[entry.type] || ''
  const note  = entry.note
    ? (entry.note.length > 140 ? entry.note.slice(0,140) + '…' : entry.note)
    : ''

  const meta = [entry.uploadedByName, fmt(entry.date), locTxt(entry.location)]
    .filter(Boolean).join('  ·  ')

  return (
    <div style={{
      position:'absolute', top:yPx, left:0, width:PAGE_W, height:bh,
      background:'rgb(253,250,245)',
    }}>
      <AccentBar height={bh} typeKey={entry.type} />

      {/* Type + title */}
      <div style={{
        position:'absolute',
        left:tx, top: Math.round(bh * 0.20), width:tw,
        fontFamily:BODY_FONT, fontWeight:700,
        fontSize: Math.round(bh * 0.115),
        color:'#2c2520',
        whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
      }}>
        {label}{'  '}{entry.title}
      </div>

      {/* Note */}
      {note && (
        <div style={{
          position:'absolute',
          left:tx, top: Math.round(bh * 0.44), width:tw,
          bottom: Math.round(bh * 0.24),
          fontFamily:BODY_FONT,
          fontSize: Math.round(bh * 0.088),
          color:'#5a4a3a', lineHeight:1.35,
          display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical',
          overflow:'hidden',
        }}>
          {note}
        </div>
      )}

      {/* People */}
      {entry.people?.length > 0 && (
        <div style={{
          position:'absolute',
          left:tx, width:tw,
          bottom: Math.round(bh * 0.22),
          fontFamily:BODY_FONT,
          fontSize: Math.round(bh * 0.074),
          color:'#888888', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
        }}>
          {entry.people.join(', ')}
        </div>
      )}

      {/* Meta */}
      {meta && (
        <div style={{
          position:'absolute',
          left:tx, width:tw,
          bottom: Math.round(bh * 0.07),
          fontFamily:BODY_FONT,
          fontSize: Math.round(bh * 0.074),
          color:'#aaaaaa', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
        }}>
          {meta}
        </div>
      )}

      <Sep blockH={bh} />
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Renders one full A4 preview page from an array of packed blocks.
 *
 * blocks: [{ kind:'cover'|'photo'|'text', entry, yPx, height }]
 * allEntries: full filtered entries array (used by cover block for date range + count)
 */
export function CompactPage({ blocks, allEntries }) {
  return (
    <div style={{
      width:PAGE_W, height:PAGE_H,
      background:'rgb(253,250,245)',
      position:'relative', overflow:'hidden',
      boxSizing:'border-box',
    }}>
      {blocks.map((block, i) => {
        if (block.kind === 'cover') {
          return <CoverBlock key={i} yPx={block.yPx} allEntries={allEntries} />
        }
        if (block.kind === 'photo') {
          return <PhotoBlock key={block.entry.id} yPx={block.yPx} entry={block.entry} />
        }
        return <TextBlock key={block.entry.id} yPx={block.yPx} entry={block.entry} />
      })}
    </div>
  )
}
