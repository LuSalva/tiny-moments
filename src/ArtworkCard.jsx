import { useState } from 'react'

const TECHNIQUE_EMOJIS = {
  dibujo:     '✏️',
  pintura:    '🎨',
  manualidad: '✂️',
  otro:       '🌟',
}

const TECHNIQUE_COLORS = {
  dibujo:     '#fdf3c0',
  pintura:    '#c6f0e0',
  manualidad: '#f9c6d0',
  otro:       '#ddd6f3',
}

const LOCATION_LABELS = {
  'home':        '🏠 Home',
  'de-heiacker': '🏫 De Heiacker',
  'veldhoven':   '📍 Veldhoven',
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

export default function ArtworkCard({ artwork, currentUserId, isAdmin, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [expanded,      setExpanded]      = useState(false)

  const accentColor   = TECHNIQUE_COLORS[artwork.technique] || '#ddd6f3'
  const locationLabel = LOCATION_LABELS[artwork.location] || (artwork.location ? `📍 ${artwork.location}` : null)
  const canEdit       = isAdmin || artwork.userId === currentUserId

  function handleDelete(e) {
    e.stopPropagation()
    if (confirmDelete) {
      onDelete(artwork.id)
    } else {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
    }
  }

  return (
    <div className="entry-card" style={{ borderLeft: `4px solid ${accentColor}` }}>
      <div className="card-header" onClick={() => setExpanded(v => !v)}>
        <span className="card-type-emoji">
          {TECHNIQUE_EMOJIS[artwork.technique] || '🎨'}
        </span>

        <div className="card-title-area">
          <h3 className="card-title">{artwork.title}</h3>
          <div className="card-title-meta">
            <span className="card-date">{formatDate(artwork.date)}</span>
            {artwork.uploadedByName && (
              <span className="card-author">{artwork.uploadedByName}</span>
            )}
          </div>
        </div>

        <div className="card-actions" onClick={e => e.stopPropagation()}>
          {canEdit && (
            <>
              <button className="edit-btn" onClick={() => onEdit(artwork)} title="Editar" aria-label="Editar">
                ✏️
              </button>
              <button
                className={`delete-btn${confirmDelete ? ' delete-btn--confirm' : ''}`}
                onClick={handleDelete}
                title={confirmDelete ? 'Pulsa de nuevo para confirmar' : 'Eliminar'}
                aria-label="Eliminar"
              >
                {confirmDelete ? '¿Borrar?' : '🗑️'}
              </button>
            </>
          )}
        </div>

        <span className="card-chevron">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="card-body">
          {artwork.note && <p className="card-note">{artwork.note}</p>}
          {artwork.photo && (
            <img src={artwork.photo} alt={artwork.title} className="card-photo" />
          )}
          <div className="card-meta">
            {locationLabel && <span className="meta-chip">{locationLabel}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
