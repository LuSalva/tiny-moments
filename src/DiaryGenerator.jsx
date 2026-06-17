import { useState } from 'react'
/* Cambio hecho con Chat GPT: se eliminan las páginas específicas 
(CoverPage, PhotoPage, TextPage) y se reemplazan por una única 
CompactPage que maneja todos los tipos de entrada. 
También se ajusta la función composePages para generar solo páginas 
compactas, simplificando el proceso de generación del PDF.
import { CoverPage, PhotoPage, TextPage, PAGE_W, PAGE_H } from './DiaryPages'
import { buildPdf } from './pdfUtils'*/
import { CompactPage, PAGE_W, PAGE_H } from './DiaryPages'
import { buildPdf, compactPages } from './pdfUtils'


const PREVIEW_SCALE = 0.22
const PREV_W = Math.round(PAGE_W * PREVIEW_SCALE)  // 175px
const PREV_H = Math.round(PAGE_H * PREVIEW_SCALE)  // 247px

const ALL_TYPES = ['frase', 'creacion', 'foto', 'hito', 'cancion', 'recuerdo']
const TYPE_LABELS = {
  frase:    '💬 Frase',
  creacion: '🎨 Creación',
  foto:     '📸 Foto',
  hito:     '🌟 Hito',
  cancion:  '🎵 Canción',
  recuerdo: '💛 Recuerdo',
}

const HISTORY_KEY = 'abrazo-familiar-pdf-history'

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



export default function DiaryGenerator({ entries }) {
  const [dateFrom,       setDateFrom]       = useState('')
  const [dateTo,         setDateTo]         = useState('')
  const [selectedTypes,  setSelectedTypes]  = useState(new Set(ALL_TYPES))
  const [pages,          setPages]          = useState([])
  const [generating,     setGenerating]     = useState(false)
  const [progress,       setProgress]       = useState(0)
  const [history,        setHistory]        = useState(loadHistory)

  // ── Filtered entries (sorted by date ascending) ───────────────────────────
  const filtered = entries
    .filter(e => {
      if (dateFrom && e.date < dateFrom) return false
      if (dateTo   && e.date > dateTo)   return false
      return selectedTypes.has(e.type)
    })
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))

  // ── Filters helpers ───────────────────────────────────────────────────────
  function toggleType(t) {
    setSelectedTypes(prev => {
      const n = new Set(prev)
      n.has(t) ? n.delete(t) : n.add(t)
      return n
    })
    setPages([])
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  /*Cambio hecho con Chat GPT
  function handlePreview() {
    setPages(composePages(filtered))
  }*/
  function handlePreview() {
  setPages(compactPages(filtered))
  }

  async function handleDownload() {
    setGenerating(true)
    setProgress(0)
    try {
      const pdf = await buildPdf(filtered, setProgress)
      const filename = `diario-ella-${new Date().toISOString().slice(0, 10)}.pdf`
      pdf.save(filename)
    } catch (err) {
      console.error('PDF generation failed:', err)
      alert('Error al generar el PDF. Por favor, inténtalo de nuevo.')
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
    alert('✅ Guardado en el historial.')
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

  const estimatedPages = filtered.length ? compactPages(filtered).length : 0

  return (
    <div className="diary-gen">

      {/* ── Filters ──────────────────────────────────────────────────── */}
      <section className="diary-gen-section">
        <h2 className="diary-gen-title">📄 Generar diario</h2>

        <div className="diary-gen-filters">
          {/* Date range */}
          <div className="diary-gen-dates">
            <div className="field">
              <label htmlFor="pdf-from">Desde</label>
              <input id="pdf-from" type="date" value={dateFrom}
                onChange={e => { setDateFrom(e.target.value); setPages([]) }} />
            </div>
            <div className="field">
              <label htmlFor="pdf-to">Hasta</label>
              <input id="pdf-to" type="date" value={dateTo}
                onChange={e => { setDateTo(e.target.value); setPages([]) }} />
            </div>
          </div>

          {/* Type filter */}
          <div>
            <div className="diary-gen-type-header">
              <span>Tipos de recuerdo</span>
              <button className="diary-gen-tiny-btn"
                onClick={() => { setSelectedTypes(new Set(ALL_TYPES)); setPages([]) }}>
                Seleccionar todo
              </button>
              <button className="diary-gen-tiny-btn"
                onClick={() => { setSelectedTypes(new Set()); setPages([]) }}>
                Deseleccionar todo
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
        </div>

        <p className="diary-gen-summary">
          {filtered.length} recuerdo{filtered.length !== 1 ? 's' : ''} seleccionado{filtered.length !== 1 ? 's' : ''}
          {estimatedPages > 0 && ` · ${estimatedPages} páginas aprox.`}
        </p>

        {!dateFrom && !dateTo && (
          <p className="diary-gen-date-hint">Seleccioná al menos una fecha para generar la vista previa.</p>
        )}

        <button className="diary-gen-preview-btn" onClick={handlePreview}
          disabled={filtered.length === 0 || (!dateFrom && !dateTo)}>
          👁️ Generar vista previa
        </button>
      </section>

      {/* ── Preview ──────────────────────────────────────────────────── */}
      {pages.length > 0 && (
        <section className="diary-gen-section">
          <h3 className="diary-gen-subtitle">Vista previa — {pages.length} páginas</h3>

          <div className="pdf-preview-grid">
            {pages.map((page, i) => (
              <div key={i} className="pdf-preview-thumb-wrap">
                <div style={{ width: PREV_W, height: PREV_H, overflow: 'hidden', borderRadius: 4,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                  <div style={{ width: PAGE_W, height: PAGE_H,
                    transform: `scale(${PREVIEW_SCALE})`, transformOrigin: 'top left',
                    pointerEvents: 'none' }}>
                    <CompactPage blocks={page} allEntries={filtered} />
                  </div>
                </div>
                <div className="pdf-preview-thumb-num">p. {i + 1}</div>
              </div>
            ))}
          </div>

          <div className="diary-gen-actions">
            <button className="diary-gen-download-btn" onClick={handleDownload}
              disabled={generating}>
              {generating ? `Generando… ${progress}%` : '⬇️ Descargar PDF'}
            </button>
            <button className="diary-gen-save-btn" onClick={handleSaveHistory}
              disabled={generating}>
              💾 Guardar en historial
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
          <h3 className="diary-gen-subtitle">Historial</h3>
          <div className="diary-gen-history">
            {history.map(h => (
              <div key={h.id} className="diary-gen-history-item">
                <div className="diary-gen-history-info">
                  <strong>
                    {new Date(h.generatedAt).toLocaleDateString('es-ES',
                      { day: '2-digit', month: 'short', year: 'numeric' })}
                  </strong>
                  <span>
                    {h.dateFrom
                      ? `${fmtDate(h.dateFrom)} – ${h.dateTo ? fmtDate(h.dateTo) : 'hoy'}`
                      : 'Todos los recuerdos'}
                    {' · '}{h.entryCount} recuerdos · {h.pageCount} pág.
                  </span>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <button className="diary-gen-tiny-btn"
                    onClick={() => handleDownloadFromHistory(h)}>
                    ⬇️ Descargar de nuevo
                  </button>
                  <button className="diary-gen-tiny-btn diary-gen-tiny-btn--delete"
                    onClick={() => handleDeleteFromHistory(h.id)}>
                    🗑️ Borrar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* pdf is generated via jsPDF drawing API — no hidden DOM needed */}
    </div>
  )
}
