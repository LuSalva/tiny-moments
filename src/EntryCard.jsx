import { useState } from 'react'

const TYPE_EMOJIS = {
  frase:    '💬',
  creacion: '🎨',
  foto:     '📸',
  hito:     '🌟',
  cancion:  '🎵',
  recuerdo: '💛',
}

const TYPE_COLORS = {
  frase:    '#fdf3c0',
  creacion: '#c6f0e0',
  foto:     '#f9c6d0',
  hito:     '#ddd6f3',
  cancion:  '#fdf3c0',
  recuerdo: '#f9c6d0',
}

const LOCATION_LABELS = {
  home:      '🏠 Home',
  veldhoven: '📍 Veldhoven',
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

export default function EntryCard({
  entry,
  currentUserId,
  isAdmin,
  onToggle,
  onEdit,
  onDelete,
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [expanded, setExpanded]           = useState(false)

  const accentColor = TYPE_COLORS[entry.type] || '#f9c6d0'
  const locationLabel =
    LOCATION_LABELS[entry.location] ||
    (entry.location ? `📍 ${entry.location}` : null)

  // Owner or admin may edit, delete and toggle favourite
  const canEdit = isAdmin || entry.userId === currentUserId

  function handleDelete(e) {
    e.stopPropagation()
    if (confirmDelete) {
      onDelete(entry.id)
    } else {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
    }
  }

  return (
    <div
      className="entry-card"
      style={{ borderLeft: `4px solid ${accentColor}` }}
    >
      <div className="card-header" onClick={() => setExpanded(v => !v)}>
        <span className="card-type-emoji">
          {TYPE_EMOJIS[entry.type] || '💛'}
        </span>

        <div className="card-title-area">
          <h3 className="card-title">{entry.title}</h3>
          <div className="card-title-meta">
            <span className="card-date">{formatDate(entry.date)}</span>
            {entry.uploadedByName && (
              <span className="card-author">{entry.uploadedByName}</span>
            )}
          </div>
        </div>

        <div className="card-actions" onClick={e => e.stopPropagation()}>
          {canEdit && (
            <>
              <button
                className={`fav-btn${entry.favourite ? ' fav-btn--active' : ''}`}
                onClick={() => onToggle(entry.id)}
                title="Marcar como favorito"
                aria-label="Favorito"
              >
                {entry.favourite ? '❤️' : '🤍'}
              </button>
              <button
                className="edit-btn"
                onClick={() => onEdit(entry)}
                title="Editar"
                aria-label="Editar"
              >
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
          {entry.note && <p className="card-note">{entry.note}</p>}

          {entry.photo && (
            <img
              src={entry.photo}
              alt={entry.title}
              className="card-photo"
            />
          )}

          <div className="card-meta">
            {locationLabel && (
              <span className="meta-chip">{locationLabel}</span>
            )}
            {entry.people && entry.people.map(p => (
              <span key={p} className="meta-chip meta-chip--person">👤 {p}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
