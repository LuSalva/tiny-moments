import { useState } from 'react'
import { CompactPage, PAGE_W, PAGE_H } from './DiaryPages'
import { buildPdf, compactPages, buildArtworkPdf, compactArtworkPages } from './pdfUtils'


const PREVIEW_SCALE = 0.22
const PREV_W = Math.round(PAGE_W * PREVIEW_SCALE)
const PREV_H = Math.round(PAGE_H * PREVIEW_SCALE)

const ALL_TYPES = ['frase', 'creacion', 'foto', 'hito', 'cancion', 'recuerdo']
const TYPE_LABELS = {
  frase:    '💬 Quote',
  creacion: '🎨 Creation',
  foto:     '📸 Photo',
  hito:     '🌟 Milestone',
  cancion:  '🎵 Song',
  recuerdo: '💛 Memory',
}

const HISTORY_KEY = 'tiny-moments-pdf-history'

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') }
  catch { return [] }
}

function saveToHistory(entry) {
  const h = loadHistory()
  h.unshift(entry)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 20)))
}

function fmtDate(d) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

const TECHNIQUE_LABELS = {
  dibujo:     '✏️ Drawing',
  pintura:    '🎨 Painting',
  manualidad: '✂️ Craft',
  otro:       '🌟 Other',
}
const ALL_TECHNIQUES = ['dibujo', 'pintura', 'manualidad', 'otro']

export default function DiaryGenerator({ entries, artworks = [] }) {
  const [mode,           setMode]           = useState('recuerdos')
  const [dateFrom,       setDateFrom]       = useState('')
  const [dateTo,         setDateTo]         = useState('')
  const [selectedTypes,  setSelectedTypes]  = useState(new Set(ALL_TYPES))
  const [selectedTechs,  setSelectedTechs]  = useState(new Set(ALL_TECHNIQUES))
  const [pages,          setPages]          = useState([])
  const [generating,     setGenerating]     = useState(false)
  const [progress,       setProgress]       = useState(0)
  const [history,        setHistory]        = useState(loadHistory)

  const filtered = entries
    .filter(e => {
      if (dateFrom && e.date < dateFrom) return false
      if (dateTo   && e.date > dateTo)   return false
      return selectedTypes.has(e.type)
    })
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))

  const filteredArt = artworks
    .filter(a => {
      if (dateFrom && a.date < dateFrom) return false
      if (dateTo   && a.date > dateTo)   return false
      return selectedTechs.has(a.technique)
    })
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))

  const activeFiltered = mode === 'arte' ? filteredArt : filtered

  function toggleType(t) {
    setSelectedTypes(prev => {
      const n = new Set(prev)
      n.has(t) ? n.delete(t) : n.add(t)
      return n
    })
    setPages([])
  }

  function toggleTech(t) {
    setSelectedTechs(prev => {
      const n = new Set(prev)
      n.has(t) ? n.delete(t) : n.add(t)
      return n
    })
    setPages([])
  }

  function handleModeChange(newMode) {
    setMode(newMode)
    setPages([])
    setDateFrom('')
    setDateTo('')
  }

  function handlePreview() {
    if (mode === 'arte') setPages(compactArtworkPages(filteredArt))
    else                 setPages(compactPages(filtered))
  }

  async function handleDownload() {
    setGenerating(true)
    setProgress(0)
    try {
      const date = new Date().toISOString().slice(0, 10)
      const pdf = mode === 'arte'
        ? await buildArtworkPdf(filteredArt, setProgress)
        : await buildPdf(filtered, setProgress)
      const filename = mode === 'arte'
        ? `art-gallery-lena-${date}.pdf`
        : `diary-lena-${date}.pdf`
      pdf.save(filename)
    } catch (err) {
      console.error('PDF generation failed:', err)
      alert('Error generating the PDF. Please try again.')
    } finally {
      setGenerating(false)
      setProgress(0)
    }
  }

  function handleSaveHistory() {
    const entry = {
      id:          crypto.randomUUID(),
      generatedAt: new Date().toISOString(),
      dateFrom,
      dateTo,
      types:       [...selectedTypes],
      entryCount:  filtered.length,
      pageCount:   pages.length,
    }
    saveToHistory(entry)
    setHistory(loadHistory())
    alert('✅ Saved to history.')
  }

  function handleDeleteFromHistory(id) {
    const updated = loadHistory().filter(h => h.id !== id)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
    setHistory(updated)
  }

  function handleDownloadFromHistory(h) {
    setDateFrom(h.dateFrom || '')
    setDateTo(h.dateTo   || '')
    setSelectedTypes(new Set(h.types))
    const reFiltered = entries.filter(e => {
      if (h.dateFrom && e.date < h.dateFrom) return false
      if (h.dateTo   && e.date > h.dateTo)   return false
      return h.types.includes(e.type)
    })
    setPages(compactPages(reFiltered))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const estimatedPages = mode === 'arte'
    ? (filteredArt.length ? compactArtworkPages(filteredArt).length : 0)
    : (filtered.length    ? compactPages(filtered).length           : 0)

  return (
    <div className="diary-gen">

      {/* ── Filters ──────────────────────────────────────────────────── */}
      <section className="diary-gen-section">
        <h2 className="diary-gen-title">📄 Generate PDF</h2>

        {/* Mode toggle */}
        <div className="diary-gen-mode-toggle">
          <button
            className={`diary-gen-mode-btn${mode === 'recuerdos' ? ' diary-gen-mode-btn--active' : ''}`}
            onClick={() => handleModeChange('recuerdos')}
          >
            📔 Memories
          </button>
          <button
            className={`diary-gen-mode-btn${mode === 'arte' ? ' diary-gen-mode-btn--active' : ''}`}
            onClick={() => handleModeChange('arte')}
          >
            🎨 Art Gallery
          </button>
        </div>

        <div className="diary-gen-filters">
          {/* Date range */}
          <div className="diary-gen-dates">
            <div className="field">
              <label htmlFor="pdf-from">From</label>
              <input id="pdf-from" type="date" value={dateFrom}
                onChange={e => { setDateFrom(e.target.value); setPages([]) }} />
            </div>
            <div className="field">
              <label htmlFor="pdf-to">To</label>
              <input id="pdf-to" type="date" value={dateTo}
                onChange={e => { setDateTo(e.target.value); setPages([]) }} />
            </div>
          </div>

          {/* Type filter — memories */}
          {mode === 'recuerdos' && (
            <div>
              <div className="diary-gen-type-header">
                <span>Memory types</span>
                <button className="diary-gen-tiny-btn"
                  onClick={() => { setSelectedTypes(new Set(ALL_TYPES)); setPages([]) }}>
                  Select all
                </button>
                <button className="diary-gen-tiny-btn"
                  onClick={() => { setSelectedTypes(new Set()); setPages([]) }}>
                  Deselect all
                </button>
              </div>
              <div className="diary-gen-type-checks">
                {ALL_TYPES.map(t => (
                  <label key={t} className="diary-gen-check">
                    <input type="checkbox" checked={selectedTypes.has(t)}
                      onChange={() => toggleType(t)} />
                    {TYPE_LABELS[t]}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Technique filter — art */}
          {mode === 'arte' && (
            <div>
              <div className="diary-gen-type-header">
                <span>Techniques</span>
                <button className="diary-gen-tiny-btn"
                  onClick={() => { setSelectedTechs(new Set(ALL_TECHNIQUES)); setPages([]) }}>
                  Select all
                </button>
                <button className="diary-gen-tiny-btn"
                  onClick={() => { setSelectedTechs(new Set()); setPages([]) }}>
                  Deselect all
                </button>
              </div>
              <div className="diary-gen-type-checks">
                {ALL_TECHNIQUES.map(t => (
                  <label key={t} className="diary-gen-check">
                    <input type="checkbox" checked={selectedTechs.has(t)}
                      onChange={() => toggleTech(t)} />
                    {TECHNIQUE_LABELS[t]}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="diary-gen-summary">
          {mode === 'arte'
            ? `${filteredArt.length} artwork${filteredArt.length !== 1 ? 's' : ''} selected`
            : `${filtered.length} memor${filtered.length !== 1 ? 'ies' : 'y'} selected`
          }
          {estimatedPages > 0 && ` · ~${estimatedPages} pages`}
        </p>

        {!dateFrom && !dateTo && (
          <p className="diary-gen-date-hint">Select at least one date to generate a preview.</p>
        )}

        <button className="diary-gen-preview-btn" onClick={handlePreview}
          disabled={activeFiltered.length === 0 || (!dateFrom && !dateTo)}>
          👁️ Generate preview
        </button>
      </section>

      {/* ── Preview ──────────────────────────────────────────────────── */}
      {pages.length > 0 && (
        <section className="diary-gen-section">
          <h3 className="diary-gen-subtitle">Preview — {pages.length} pages</h3>

          <div className="pdf-preview-grid">
            {pages.map((page, i) => (
              <div key={i} className="pdf-preview-thumb-wrap">
                <div style={{ width: PREV_W, height: PREV_H, overflow: 'hidden', borderRadius: 4,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                  <div style={{ width: PAGE_W, height: PAGE_H,
                    transform: `scale(${PREVIEW_SCALE})`, transformOrigin: 'top left',
                    pointerEvents: 'none' }}>
                    <CompactPage blocks={page} allEntries={mode === 'arte' ? filteredArt : filtered} mode={mode} />
                  </div>
                </div>
                <div className="pdf-preview-thumb-num">p. {i + 1}</div>
              </div>
            ))}
          </div>

          <div className="diary-gen-actions">
            <button className="diary-gen-download-btn" onClick={handleDownload}
              disabled={generating}>
              {generating ? `Generating… ${progress}%` : '⬇️ Download PDF'}
            </button>
            <button className="diary-gen-save-btn" onClick={handleSaveHistory}
              disabled={generating}>
              💾 Save to history
            </button>
          </div>

          {generating && (
            <div className="diary-gen-progress">
              <div className="diary-gen-progress-bar" style={{ width: `${progress}%` }} />
            </div>
          )}
        </section>
      )}

      {/* ── History ──────────────────────────────────────────────────── */}
      {history.length > 0 && (
        <section className="diary-gen-section">
          <h3 className="diary-gen-subtitle">History</h3>
          <div className="diary-gen-history">
            {history.map(h => (
              <div key={h.id} className="diary-gen-history-item">
                <div className="diary-gen-history-info">
                  <strong>
                    {new Date(h.generatedAt).toLocaleDateString('en-GB',
                      { day: '2-digit', month: 'short', year: 'numeric' })}
                  </strong>
                  <span>
                    {h.dateFrom
                      ? `${fmtDate(h.dateFrom)} – ${h.dateTo ? fmtDate(h.dateTo) : 'today'}`
                      : 'All memories'}
                    {' · '}{h.entryCount} memor{h.entryCount !== 1 ? 'ies' : 'y'} · {h.pageCount} p.
                  </span>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <button className="diary-gen-tiny-btn"
                    onClick={() => handleDownloadFromHistory(h)}>
                    ⬇️ Download again
                  </button>
                  <button className="diary-gen-tiny-btn diary-gen-tiny-btn--delete"
                    onClick={() => handleDeleteFromHistory(h.id)}>
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
