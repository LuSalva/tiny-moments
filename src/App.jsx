import { useState, useEffect } from 'react'
import { getItems, addItem, updateItem, toggleItem, deleteItem } from './storage'
import EntryForm from './EntryForm'
import EntryCard from './EntryCard'

export default function App() {
  const [entries, setEntries]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [showForm, setShowForm]         = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
  const [searchPerson, setSearchPerson] = useState('')

  useEffect(() => {
    loadEntries()
  }, [])

  async function loadEntries() {
    setLoading(true)
    setError(null)
    try {
      const data = await getItems()
      setEntries(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(item) {
    await addItem(item)
    await loadEntries()
    setShowForm(false)
  }

  function handleEdit(entry) {
    setEditingEntry(entry)
    setShowForm(true)
  }

  async function handleUpdate(item) {
    await updateItem(editingEntry.id, item)
    await loadEntries()
    setEditingEntry(null)
    setShowForm(false)
  }

  function handleCloseForm() {
    setEditingEntry(null)
    setShowForm(false)
  }

  async function handleToggle(id) {
    try {
      await toggleItem(id)
      await loadEntries()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteItem(id)
      await loadEntries()
    } catch (err) {
      setError(err.message)
    }
  }

  const filtered = (searchPerson.trim()
    ? entries.filter(e =>
        e.people && e.people.some(p =>
          p.toLowerCase().includes(searchPerson.toLowerCase())
        )
      )
    : entries
  ).slice().sort((a, b) => {
    // Favourites always come first
    if (a.favourite && !b.favourite) return -1
    if (!a.favourite && b.favourite) return 1
    // Within each group, newest date first
    return new Date(b.date) - new Date(a.date)
  })

  if (showForm) {
    return (
      <div className="app">
        <EntryForm
          onSave={editingEntry ? handleUpdate : handleAdd}
          onCancel={handleCloseForm}
          initialEntry={editingEntry}
        />
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🌈 Abrazo Familiar</h1>
        <p className="subtitle">Un diario de momentos especiales 💕</p>
      </header>

      <main className="main">
        {error && (
          <div className="error-banner" role="alert">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} aria-label="Cerrar">✕</button>
          </div>
        )}

        <div className="search-bar">
          <input
            type="text"
            placeholder="🔍 Buscar por persona..."
            value={searchPerson}
            onChange={e => setSearchPerson(e.target.value)}
            aria-label="Buscar por persona"
          />
          {searchPerson && (
            <button
              className="clear-search"
              onClick={() => setSearchPerson('')}
              aria-label="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>

        <button className="add-button" onClick={() => setShowForm(true)}>
          + Nuevo recuerdo
        </button>

        {loading ? (
          <div className="loading">Cargando recuerdos… 💛</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-emoji">🌈</div>
            {searchPerson ? (
              <>
                <h2>Sin resultados</h2>
                <p>No hay recuerdos con <strong>{searchPerson}</strong>.</p>
              </>
            ) : (
              <>
                <h2>¡Aún no hay recuerdos!</h2>
                <p>Empieza a capturar los momentos especiales de tu hija 💕</p>
              </>
            )}
          </div>
        ) : (
          <div className="entries-list">
            {filtered.map(entry => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
