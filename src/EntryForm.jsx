import { useState, useRef } from 'react'

const TYPES = [
  { value: 'frase',    emoji: '💬', label: 'Frase' },
  { value: 'creacion', emoji: '🎨', label: 'Creación' },
  { value: 'foto',     emoji: '📸', label: 'Foto' },
  { value: 'hito',     emoji: '🌟', label: 'Hito' },
  { value: 'cancion',  emoji: '🎵', label: 'Canción' },
  { value: 'recuerdo', emoji: '💛', label: 'Recuerdo' },
]

const LOCATIONS = [
  { value: 'home',        label: '🏠 Home' },
  { value: 'de-heiacker', label: '🏫 De Heiacker' },
  { value: 'veldhoven',   label: '📍 Veldhoven' },
  { value: 'other',       label: '✏️ Otro' },
]

const MAX_WIDTH = 800
const JPEG_QUALITY = 0.7

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1
        const canvas = document.createElement('canvas')
        canvas.width  = Math.round(img.width  * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

function todayString() {
  return new Date().toISOString().split('T')[0]
}

const KNOWN_LOCATIONS = ['home', 'de-heiacker', 'veldhoven']

export default function EntryForm({ onSave, onCancel, initialEntry }) {
  const isEditing = Boolean(initialEntry)

  // Derive initial location field state from stored value
  const initLocation = initialEntry?.location ?? 'home'
  const initIsOther  = initLocation && !KNOWN_LOCATIONS.includes(initLocation)

  const [title, setTitle]               = useState(initialEntry?.title    ?? '')
  const [type, setType]                 = useState(initialEntry?.type     ?? 'recuerdo')
  const [note, setNote]                 = useState(initialEntry?.note     ?? '')
  const [date, setDate]                 = useState(initialEntry?.date     ?? todayString())
  const [photo, setPhoto]               = useState(initialEntry?.photo    ?? null)
  const [photoPreview, setPhotoPreview] = useState(initialEntry?.photo    ?? null)
  const [location, setLocation]         = useState(initIsOther ? 'other' : initLocation)
  const [locationOther, setLocationOther] = useState(initIsOther ? initLocation : '')
  const [people, setPeople]             = useState([])
  const [personInput, setPersonInput]   = useState('')
  const [saving, setSaving]             = useState(false)
  const [errors, setErrors]             = useState({})
  const [saveError, setSaveError]       = useState(null)

  const cameraRef  = useRef(null)
  const galleryRef = useRef(null)

  // Photo upload is only relevant for these types
  const showPhotoUpload = type === 'foto' || type === 'creacion'

  function handleTypeChange(newType) {
    setType(newType)
    // Clear photo when switching to a type that doesn't support it
    if (newType !== 'foto' && newType !== 'creacion') {
      setPhoto(null)
      setPhotoPreview(null)
    }
  }

  async function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    // Reset input so the same file can be re-selected after clearing
    e.target.value = ''
    const compressed = await compressImage(file)
    setPhoto(compressed)
    setPhotoPreview(compressed)
  }

  function addPerson() {
    const name = personInput.trim()
    if (name && !people.includes(name)) {
      setPeople(prev => [...prev, name])
    }
    setPersonInput('')
  }

  function handlePersonKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addPerson()
    }
  }

  function removePerson(name) {
    setPeople(prev => prev.filter(p => p !== name))
  }

  function validate() {
    const errs = {}
    if (!title.trim()) errs.title = 'El título es obligatorio'
    if (!date) errs.date = 'La fecha es obligatoria'
    return errs
  }

  async function handleSave() {
    setSaveError(null)
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setSaving(true)
    try {
      const locationValue = location === 'other' ? locationOther.trim() || 'Otro' : location
      await onSave({
        title: title.trim(),
        type,
        note: note.trim(),
        date,
        photo,
        location: locationValue,
        people,
      })
    } catch (err) {
      setSaveError(err.message || 'No se pudo guardar. Por favor, inténtalo de nuevo.')
      setSaving(false)
    }
  }

  return (
    <form className="entry-form" onSubmit={e => e.preventDefault()}>
      <div className="form-header">
        <button type="button" className="back-button" onClick={onCancel}>← Volver</button>
        <h2>{isEditing ? 'Editar recuerdo' : 'Nuevo recuerdo'}</h2>
      </div>

      {/* Title */}
      <div className="field">
        <label htmlFor="title">Título *</label>
        <input
          id="title"
          type="text"
          placeholder="¿Qué pasó?"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className={errors.title ? 'input-error' : ''}
        />
        {errors.title && <span className="error-text">{errors.title}</span>}
      </div>

      {/* Type */}
      <div className="field">
        <label>Tipo</label>
        <div className="type-buttons">
          {TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              className={`type-btn${type === t.value ? ' type-btn--active' : ''}`}
              onClick={() => handleTypeChange(t.value)}
            >
              <span className="type-emoji">{t.emoji}</span>
              <span className="type-label">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="field">
        <label htmlFor="note">Nota</label>
        <textarea
          id="note"
          placeholder="Escribe los detalles del momento..."
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={4}
        />
      </div>

      {/* Date */}
      <div className="field">
        <label htmlFor="date">Fecha *</label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className={errors.date ? 'input-error' : ''}
        />
        {errors.date && <span className="error-text">{errors.date}</span>}
      </div>

      {/* Photo — only shown for 📸 Foto and 🎨 Creación */}
      {showPhotoUpload && (
        <div className="field">
          <label>Foto o imagen</label>

          {/* Preview */}
          {photoPreview && (
            <div className="photo-preview-container" style={{ marginBottom: 10 }}>
              <img src={photoPreview} alt="Vista previa" className="photo-preview" />
            </div>
          )}

          {/* Two upload buttons */}
          <div className="photo-upload-btns">
            <button
              type="button"
              className="photo-upload-btn"
              onClick={() => cameraRef.current?.click()}
            >
              📷 Sacar foto
            </button>
            <button
              type="button"
              className="photo-upload-btn"
              onClick={() => galleryRef.current?.click()}
            >
              🖼️ Elegir de galería
            </button>
            {photoPreview && (
              <button
                type="button"
                className="photo-upload-btn photo-upload-btn--remove"
                onClick={() => { setPhoto(null); setPhotoPreview(null) }}
              >
                🗑️ Quitar foto
              </button>
            )}
          </div>

          {/* Hidden inputs — camera and gallery */}
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoChange}
            style={{ display: 'none' }}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {/* Location */}
      <div className="field">
        <label>Ubicación</label>
        <div className="location-buttons">
          {LOCATIONS.map(loc => (
            <button
              key={loc.value}
              type="button"
              className={`location-btn${location === loc.value ? ' location-btn--active' : ''}`}
              onClick={() => setLocation(loc.value)}
            >
              {loc.label}
            </button>
          ))}
        </div>
        {location === 'other' && (
          <input
            type="text"
            placeholder="¿Dónde fue?"
            value={locationOther}
            onChange={e => setLocationOther(e.target.value)}
            className="other-location-input"
          />
        )}
      </div>

      {/* People */}
      <div className="field">
        <label>Personas</label>
        <div className="people-input">
          <input
            type="text"
            placeholder="Añadir nombre y pulsar Enter"
            value={personInput}
            onChange={e => setPersonInput(e.target.value)}
            onKeyDown={handlePersonKeyDown}
          />
          <button type="button" className="add-person-btn" onClick={addPerson}>+</button>
        </div>
        {people.length > 0 && (
          <div className="people-tags">
            {people.map(p => (
              <span key={p} className="person-tag">
                {p}
                <button type="button" onClick={() => removePerson(p)} aria-label={`Quitar ${p}`}>✕</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Save error */}
      {saveError && (
        <div className="error-banner" role="alert">
          <span>⚠️ {saveError}</span>
          <button type="button" onClick={() => setSaveError(null)} aria-label="Cerrar">✕</button>
        </div>
      )}

      {/* Actions */}
      <div className="form-actions">
        <button type="button" className="btn-cancel" onClick={onCancel}>Cancelar</button>
        <button type="button" className="btn-save" disabled={saving} onClick={handleSave}>
          {saving ? 'Guardando...' : isEditing ? '💾 Guardar cambios' : '💾 Guardar recuerdo'}
        </button>
      </div>
    </form>
  )
}
