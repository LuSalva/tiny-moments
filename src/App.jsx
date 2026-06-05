import { useState, useEffect } from 'react'
import {
  getItems, addItem, updateItem, toggleItem, deleteItem,
  getLocalItems, migrateLocalToSupabase,
} from './storage'
import { useAuth } from './AuthContext'
import LoginScreen from './LoginScreen'
import EntryForm from './EntryForm'
import EntryCard from './EntryCard'
import { useInactivityTimeout } from './useInactivityTimeout'

export default function App() {
  const { session, signOut } = useAuth()

  // Show a neutral loading state while Supabase restores the session
  if (session === undefined) {
    return <div className="loading">Cargando… 💛</div>
  }

  // Not logged in → show login screen
  if (!session) {
    return <LoginScreen />
  }

  return <AppShell signOut={signOut} />
}

function AppShell({ signOut }) {
  const { minsLeft, resetTimer } = useInactivityTimeout(signOut)
  const [entries, setEntries]           = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [showForm, setShowForm]         = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
  const [searchPerson, setSearchPerson] = useState('')
  const [localCount, setLocalCount]     = useState(0)
  const [migrating, setMigrating]       = useState(false)
  const [migrateError, setMigrateError] = useState(null)

  useEffect(() => {
    setLocalCount(getLocalItems().length)
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

  async function handleMigrate() {
    setMigrating(true)
    setMigrateError(null)
    try {
      const count = await migrateLocalToSupabase()
      setLocalCount(0)
      await loadEntries()
      alert(`✅ ¡${count} recuerdo${count !== 1 ? 's' : ''} importado${count !== 1 ? 's' : ''} correctamente!`)
    } catch (err) {
      setMigrateError(err.message)
    } finally {
      setMigrating(false)
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
    if (a.favourite && !b.favourite) return -1
    if (!a.favourite && b.favourite) return 1
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
        <button className="logout-btn" onClick={signOut} title="Cerrar sesión">
          Cerrar sesión
        </button>
        <h1>🌈 Abrazo Familiar</h1>
        <p className="subtitle">Un diario de momentos especiales 💕</p>
      </header>

      <main className="main">
        {/* Inactivity warning */}
        {minsLeft !== null && (
          <div className="inactivity-banner" role="alert">
            <span>
              ⏰ Tu sesión cerrará por inactividad en{' '}
              <strong>{minsLeft} minuto{minsLeft !== 1 ? 's' : ''}</strong>.
            </span>
            <button className="inactivity-stay-btn" onClick={resetTimer}>
              Seguir conectada
            </button>
          </div>
        )}

        {/* Migration banner */}
        {localCount > 0 && (
          <div className="migration-banner">
            <div className="migration-text">
              <strong>📦 Tienes {localCount} recuerdo{localCount !== 1 ? 's' : ''} guardado{localCount !== 1 ? 's' : ''} localmente.</strong>
              <span>Impórtalos a Supabase para no perderlos.</span>
            </div>
            <button
              className="migration-btn"
              onClick={handleMigrate}
              disabled={migrating}
            >
              {migrating ? 'Importando…' : '☁️ Importar datos locales'}
            </button>
            {migrateError && <p className="migrate-error">⚠️ {migrateError}</p>}
          </div>
        )}

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
