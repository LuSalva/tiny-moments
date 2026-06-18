import { useState, useRef } from 'react'

const TECHNIQUES = [
  { value: 'dibujo',     emoji: '✏️',  label: 'Drawing' },
  { value: 'pintura',    emoji: '🎨',  label: 'Painting' },
  { value: 'manualidad', emoji: '✂️',  label: 'Craft' },
  { value: 'otro',       emoji: '🌟',  label: 'Other' },
]

const LOCATIONS = [
  { value: 'home',         label: '🏠 Home' },
  { value: 'de-heiacker',  label: '🏫 School' },
  { value: 'veldhoven',    label: '📍 Veldhoven' },
  { value: 'other',        label: '✏️ Other' },
]

const KNOWN_LOCATIONS = ['home', 'de-heiacker', 'veldhoven']

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

export default function ArtworkForm({ onSave, onCancel, initialArtwork }) {
  const isEditing = Boolean(initialArtwork)

  const initLocation = initialArtwork?.location ?? 'home'
  const initIsOther  = initLocation && !KNOWN_LOCATIONS.includes(initLocation)

  const [title,         setTitle]         = useState(initialArtwork?.title     ?? '')
  const [technique,     setTechnique]     = useState(initialArtwork?.technique ?? 'dibujo')
  const [note,          setNote]          = useState(initialArtwork?.note      ?? '')
  const [date,          setDate]          = useState(initialArtwork?.date      ?? todayString())
  const [photo,         setPhoto]         = useState(initialArtwork?.photo     ?? null)
  const [photoPreview,  setPhotoPreview]  = useState(initialArtwork?.photo     ?? null)
  const [location,      setLocation]      = useState(initIsOther ? 'other' : initLocation)
  const [locationOther, setLocationOther] = useState(initIsOther ? initLocation : '')
  const [saving,        setSaving]        = useState(false)
  const [errors,        setErrors]        = useState({})
  const [saveError,     setSaveError]     = useState(null)

  const cameraRef  = useRef(null)
  const galleryRef = useRef(null)

  async function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''
    const compressed = await compressImage(file)
    setPhoto(compressed)
    setPhotoPreview(compressed)
  }

  function validate() {
    const errs = {}
    if (!title.trim()) errs.title = 'Title is required'
    if (!date)         errs.date  = 'Date is required'
    return errs
  }

  async function handleSave() {
    setSaveError(null)
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSaving(true)
    try {
      const locationValue = location === 'other' ? locationOther.trim() || 'Other' : location
      await onSave({ title: title.trim(), technique, note: note.trim(), date, photo, location: locationValue })
    } catch (err) {
      setSaveError(err.message || 'Could not save. Please try again.')
      setSaving(false)
    }
  }

  return (
    <form className="entry-form" onSubmit={e => e.preventDefault()}>
      <div className="form-header">
        <button type="button" className="back-button" onClick={onCancel}>← Back</button>
        <h2>{isEditing ? 'Edit artwork' : 'New artwork'}</h2>
      </div>

      {/* Title */}
      <div className="field">
        <label htmlFor="artwork-title">Title *</label>
        <input
          id="artwork-title"
          type="text"
          placeholder="What is this artwork called?"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className={errors.title ? 'input-error' : ''}
        />
        {errors.title && <span className="error-text">{errors.title}</span>}
      </div>

      {/* Technique */}
      <div className="field">
        <label>Technique</label>
        <div className="type-buttons">
          {TECHNIQUES.map(t => (
            <button
              key={t.value}
              type="button"
              className={`type-btn${technique === t.value ? ' type-btn--active' : ''}`}
              onClick={() => setTechnique(t.value)}
            >
              <span className="type-emoji">{t.emoji}</span>
              <span className="type-label">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="field">
        <label htmlFor="artwork-note">Note</label>
        <textarea
          id="artwork-note"
          placeholder="What did they make? What materials? How old were they?"
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={4}
        />
      </div>

      {/* Date */}
      <div className="field">
        <label htmlFor="artwork-date">Date *</label>
        <input
          id="artwork-date"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className={errors.date ? 'input-error' : ''}
        />
        {errors.date && <span className="error-text">{errors.date}</span>}
      </div>

      {/* Photo */}
      <div className="field">
        <label>Photo or scan</label>
        {photoPreview && (
          <div className="photo-preview-container" style={{ marginBottom: 10 }}>
            <img src={photoPreview} alt="Preview" className="photo-preview" />
          </div>
        )}
        <div className="photo-upload-btns">
          <button type="button" className="photo-upload-btn" onClick={() => cameraRef.current?.click()}>
            📷 Take photo
          </button>
          <button type="button" className="photo-upload-btn" onClick={() => galleryRef.current?.click()}>
            🖼️ Upload scan / gallery
          </button>
          {photoPreview && (
            <button type="button" className="photo-upload-btn photo-upload-btn--remove"
              onClick={() => { setPhoto(null); setPhotoPreview(null) }}>
              🗑️ Remove photo
            </button>
          )}
        </div>
        <input ref={cameraRef} type="file" accept="image/*" capture="environment"
          onChange={handlePhotoChange} style={{ display: 'none' }} />
        <input ref={galleryRef} type="file" accept="image/*"
          onChange={handlePhotoChange} style={{ display: 'none' }} />
      </div>

      {/* Location */}
      <div className="field">
        <label>Location</label>
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
            placeholder="Where was it?"
            value={locationOther}
            onChange={e => setLocationOther(e.target.value)}
            className="other-location-input"
          />
        )}
      </div>

      {saveError && (
        <div className="error-banner" role="alert">
          <span>⚠️ {saveError}</span>
          <button type="button" onClick={() => setSaveError(null)} aria-label="Close">✕</button>
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn-cancel" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn-save" disabled={saving} onClick={handleSave}>
          {saving ? 'Saving...' : isEditing ? '💾 Save changes' : '💾 Save artwork'}
        </button>
      </div>
    </form>
  )
}
