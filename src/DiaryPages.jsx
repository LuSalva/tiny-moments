export const PAGE_W = 794
export const PAGE_H = 1123

const FONT = "'DM Sans', 'Arial', sans-serif"

const RAINBOW_COLORS = ['#e53935','#ff7043','#fdd835','#43a047','#1e88e5','#8e24aa','#e91e63','#ff9800']

const BG_COLORS = ['#fffef5','#f5f0ff','#f0fff8','#fff0f8','#f0f8ff']

const TYPE_LABELS = {
  frase:    '💬 Frase',
  creacion: '🎨 Creación',
  foto:     '📸 Foto',
  hito:     '🌟 Hito',
  cancion:  '🎵 Canción',
  recuerdo: '💛 Recuerdo',
}

const CARD_PALETTES = [
  { bg: '#fff9c4', border: '#f9a825' },
  { bg: '#f3e5f5', border: '#ab47bc' },
  { bg: '#e8f5e9', border: '#66bb6a' },
  { bg: '#fce4ec', border: '#f06292' },
  { bg: '#e3f2fd', border: '#42a5f5' },
]

function fmt(d) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function locationLabel(loc) {
  if (!loc) return null
  if (loc === 'home')      return '🏠 Home'
  if (loc === 'veldhoven') return '📍 Veldhoven'
  return `📍 ${loc}`
}

// ── Cover ──────────────────────────────────────────────────────────────────

export function CoverPage({ entries }) {
  const dates  = entries.map(e => e.date).filter(Boolean).sort()
  const from   = dates[0]   ? fmt(dates[0])                   : ''
  const to     = dates.at(-1) ? fmt(dates.at(-1))             : ''
  const range  = from === to || !to ? from : `${from} – ${to}`
  const BLOCKS = 29  // approx blocks across 794px at 28px each

  return (
    <div style={{ width: PAGE_W, height: PAGE_H, position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(135deg, #fff8dc 0%, #ffe4f0 45%, #e8f4ff 100%)',
      fontFamily: FONT, boxSizing: 'border-box' }}>

      {/* Rainbow border — top */}
      {Array.from({ length: BLOCKS }).map((_, i) => (
        <div key={`t${i}`} style={{ position:'absolute', top:0, left:i*28, width:28, height:22,
          background: RAINBOW_COLORS[i % RAINBOW_COLORS.length] }} />
      ))}
      {/* Rainbow border — bottom */}
      {Array.from({ length: BLOCKS }).map((_, i) => (
        <div key={`b${i}`} style={{ position:'absolute', bottom:0, left:i*28, width:28, height:22,
          background: RAINBOW_COLORS[i % RAINBOW_COLORS.length] }} />
      ))}
      {/* Rainbow border — left */}
      {Array.from({ length: 14 }).map((_, i) => (
        <div key={`l${i}`} style={{ position:'absolute', top:22+i*60, left:0, width:22, height:60,
          background: RAINBOW_COLORS[i % RAINBOW_COLORS.length] }} />
      ))}
      {/* Rainbow border — right */}
      {Array.from({ length: 14 }).map((_, i) => (
        <div key={`r${i}`} style={{ position:'absolute', top:22+i*60, right:0, width:22, height:60,
          background: RAINBOW_COLORS[i % RAINBOW_COLORS.length] }} />
      ))}

      {/* Scattered emojis */}
      {[
        { t:60,  l:60,  s:70, e:'🌈' },
        { t:50,  l:660, s:60, e:'🦄' },
        { t:180, l:660, s:50, e:'⭐' },
        { t:820, l:50,  s:60, e:'🚀' },
        { t:840, l:660, s:52, e:'🐰' },
        { t:160, l:70,  s:38, e:'✨' },
        { t:760, l:680, s:42, e:'🌟' },
        { t:480, l:46,  s:34, e:'💫' },
        { t:500, l:690, s:34, e:'🎠' },
      ].map(({ t, l, s, e }, i) => (
        <div key={i} style={{ position:'absolute', top:t, left:l, fontSize:s, lineHeight:1 }}>{e}</div>
      ))}

      {/* Central title card */}
      <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0,
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        padding:'80px 70px' }}>
        <div style={{ background:'rgba(255,255,255,0.88)', borderRadius:28, padding:'44px 64px',
          textAlign:'center', boxShadow:'6px 6px 0 rgba(0,0,0,0.07)',
          border:'3px solid #f9c6d0', transform:'rotate(-1deg)', maxWidth:580 }}>
          <div style={{ fontSize:52, marginBottom:10 }}>💕</div>
          <h1 style={{ fontSize:70, fontWeight:900, color:'#3d3348', margin:'0 0 14px',
            lineHeight:1.05, letterSpacing:-2 }}>
            El diario<br/>de Ella
          </h1>
          {range && (
            <p style={{ fontSize:22, color:'#9b8ca8', margin:'0 0 6px', fontWeight:500 }}>
              {range}
            </p>
          )}
          <p style={{ fontSize:17, color:'#bbb', margin:0 }}>
            {entries.length} recuerdo{entries.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ fontSize:44, marginTop:42, letterSpacing:14 }}>💛🌈💕⭐🦄</div>
      </div>
    </div>
  )
}

// ── Photo page ────────────────────────────────────────────────────────────

// Trail positions + rotations for 1-4 photos
const PHOTO_CONFIGS = {
  1: [{ top:222, left:197, rot:0,    w:400, h:320 }],
  2: [{ top:80,  left:60,  rot:-2,   w:360, h:280 },
      { top:520, left:360, rot:2,    w:360, h:280 }],
  3: [{ top:50,  left:50,  rot:-3,   w:330, h:260 },
      { top:70,  left:420, rot:2,    w:330, h:260 },
      { top:590, left:220, rot:-1,   w:330, h:260 }],
  4: [{ top:40,  left:30,  rot:-3,   w:310, h:240 },
      { top:60,  left:440, rot:2,    w:310, h:240 },
      { top:580, left:50,  rot:3,    w:310, h:240 },
      { top:600, left:430, rot:-2,   w:310, h:240 }],
}

export function PhotoPage({ entries, pageNum = 0 }) {
  const bg  = BG_COLORS[pageNum % BG_COLORS.length]
  const cfg = PHOTO_CONFIGS[Math.min(entries.length, 4)] || PHOTO_CONFIGS[4]

  return (
    <div style={{ width:PAGE_W, height:PAGE_H, position:'relative', overflow:'hidden',
      background:bg, fontFamily:FONT, boxSizing:'border-box' }}>

      {/* Subtle background decorations */}
      {[
        { t:18, l:680, s:32, e:'⭐', o:0.25 },
        { t:60, l:20,  s:26, e:'💫', o:0.22 },
        { t:900,l:700, s:28, e:'🌸', o:0.22 },
        { t:960,l:30,  s:24, e:'✨', o:0.2  },
      ].map(({ t, l, s, e, o }, i) => (
        <div key={i} style={{ position:'absolute', top:t, left:l, fontSize:s, opacity:o }}>{e}</div>
      ))}

      {entries.slice(0, 4).map((entry, i) => {
        const { top, left, rot, w, h } = cfg[i]
        const note = entry.note
          ? (entry.note.length > 90 ? entry.note.slice(0, 90) + '…' : entry.note)
          : ''

        return (
          <div key={entry.id} style={{
            position:'absolute', top, left, width:w,
            transform:`rotate(${rot}deg)`,
            background:'white', borderRadius:4,
            padding:12, boxShadow:'4px 4px 10px rgba(0,0,0,0.18)',
          }}>
            <img src={entry.photo} style={{ width:'100%', height:h,
              objectFit:'cover', display:'block', borderRadius:2 }} />
            <div style={{ paddingTop:8 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#3d3348', marginBottom:3 }}>
                {entry.title}
              </div>
              {note && (
                <div style={{ fontSize:11, color:'#9b8ca8', lineHeight:1.45 }}>{note}</div>
              )}
              <div style={{ fontSize:10, color:'#c0b4cc', marginTop:4 }}>
                {fmt(entry.date)}
                {entry.uploadedByName ? ` · ${entry.uploadedByName}` : ''}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Text page ─────────────────────────────────────────────────────────────

const TEXT_CONFIGS = {
  1: [{ top:200, left:45, rot:-1.5 }],
  2: [{ top:80,  left:40, rot:-2   },
      { top:560, left:70, rot:1.5  }],
  3: [{ top:40,  left:40, rot:-1.5 },
      { top:400, left:65, rot:1    },
      { top:760, left:40, rot:-1   }],
}

export function TextPage({ entries, pageNum = 0 }) {
  const bg  = BG_COLORS[(pageNum + 2) % BG_COLORS.length]
  const cfg = TEXT_CONFIGS[Math.min(entries.length, 3)] || TEXT_CONFIGS[3]

  return (
    <div style={{ width:PAGE_W, height:PAGE_H, position:'relative', overflow:'hidden',
      background:bg, fontFamily:FONT, boxSizing:'border-box' }}>

      {[
        { t:14, l:680, s:30, e:'🌸', o:0.22 },
        { t:50, l:20,  s:22, e:'💫', o:0.20 },
        { t:930,l:700, s:26, e:'🌟', o:0.22 },
      ].map(({ t, l, s, e, o }, i) => (
        <div key={i} style={{ position:'absolute', top:t, left:l, fontSize:s, opacity:o }}>{e}</div>
      ))}

      {entries.slice(0, 3).map((entry, i) => {
        const { top, left, rot } = cfg[i]
        const pal  = CARD_PALETTES[i % CARD_PALETTES.length]
        const note = entry.note
          ? (entry.note.length > 160 ? entry.note.slice(0, 160) + '…' : entry.note)
          : ''
        const loc  = locationLabel(entry.location)

        return (
          <div key={entry.id} style={{
            position:'absolute', top, left, width:700,
            transform:`rotate(${rot}deg)`,
            background:pal.bg, borderRadius:16, padding:'20px 24px',
            boxShadow:'3px 3px 0 rgba(0,0,0,0.07)',
            border:`2px solid ${pal.border}`,
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <span style={{ fontSize:22 }}>{TYPE_LABELS[entry.type] || entry.type}</span>
              <span style={{ fontSize:17, fontWeight:700, color:'#3d3348', flex:1 }}>
                {entry.title}
              </span>
              <span style={{ fontSize:13, color:'#9b8ca8', whiteSpace:'nowrap' }}>
                {fmt(entry.date)}
              </span>
            </div>

            {note && (
              <p style={{ fontSize:14, color:'#5a4d66', margin:'0 0 12px', lineHeight:1.65 }}>
                {note}
              </p>
            )}

            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {entry.uploadedByName && (
                <span style={{ fontSize:12, background:'#ddd6f3', borderRadius:20,
                  padding:'2px 9px', color:'#5a4d66' }}>
                  {entry.uploadedByName}
                </span>
              )}
              {loc && (
                <span style={{ fontSize:12, background:'#fdf3c0', borderRadius:20,
                  padding:'2px 9px', color:'#5a4d66' }}>
                  {loc}
                </span>
              )}
              {entry.people?.map(p => (
                <span key={p} style={{ fontSize:12, background:'#c6f0e0', borderRadius:20,
                  padding:'2px 9px', color:'#1b5e20' }}>
                  👤 {p}
                </span>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
