import { useState, useEffect, lazy, Suspense } from 'react'
import {
  getItems, addItem, updateItem, toggleItem, deleteItem,
  getLocalItems, migrateLocalToSupabase,
} from './storage'
import { getArtworks, addArtwork, updateArtwork, deleteArtwork } from './artworkStorage'
import { useAuth } from './AuthContext'
import LoginScreen from './LoginScreen'
import EntryForm from './EntryForm'
import EntryCard from './EntryCard'
import ArtworkForm from './ArtworkForm'
import ArtworkCard from './ArtworkCard'
import { useInactivityTimeout } from './useInactivityTimeout'
const DiaryGenerator = lazy(() => import('./DiaryGenerator'))

export default function App() {
  const { session, signOut } = useAuth()

  if (session === undefined) {
    return <div className="loading">Cargando… 💛</div>
  }

  if (!session) {
    return <LoginScreen />
  }

  return <AppShell signOut={signOut} />
}

function AppShell({ signOut }) {
  const { session, userProfile } = useAuth()
  const { minsLeft, resetTimer } = useInactivityTimeout(signOut)
  const [activeTab, setActiveTab] = useState('diary')

  const [artworks,      setArtworks]      = useState([])
  const [artworksError, setArtworksError] = useState(null)
  const [showArtworkForm,   setShowArtworkForm]   = useState(false)
  const [editingArtwork,    setEditingArtwork]    = useState(null)

  const currentUserId = session?.user?.id ?? null
  const isAdmin       = userProfile?.role === 'admin'
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
    loadArtworks()
  }, [])

  async function loadArtworks() {
    try {
      const data = await getArtworks()
      setArtworks(data)
    } catch (err) {
      setArtworksError(err.message)
    }
  }

  async function handleAddArtwork(item) {
    await addArtwork(item)
    await loadArtworks()
    setShowArtworkForm(false)
  }

  function handleEditArtwork(artwork) {
    setEditingArtwork(artwork)
    setShowArtworkForm(true)
  }

  async function handleUpdateArtwork(item) {
    await updateArtwork(editingArtwork.id, item)
    await loadArtworks()
    setEditingArtwork(null)
    setShowArtworkForm(false)
  }

  function handleCloseArtworkForm() {
    setEditingArtwork(null)
    setShowArtworkForm(false)
  }

  async function handleDeleteArtwork(id) {
    try {
      await deleteArtwork(id)
      await loadArtworks()
    } catch (err) {
      setArtworksError(err.message)
    }
  }

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
      alert(`✅ ${count} memory item${count !== 1 ? 's' : ''} imported successfully!`)
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
  ).slice().sort((a, b) => new Date(b.date) - new Date(a.date))

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

  if (showArtworkForm) {
    return (
      <div className="app">
        <ArtworkForm
          onSave={editingArtwork ? handleUpdateArtwork : handleAddArtwork}
          onCancel={handleCloseArtworkForm}
          initialArtwork={editingArtwork}
        />
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <button className="logout-btn" onClick={signOut} title="Sign out">
          Sign out
        </button>
        <h1>🌱 Tiny Moments</h1>
        <p className="subtitle">A keeper of the little things that matter 💕</p>
      </header>

      <main className="main">
        {/* Inactivity warning */}
        {minsLeft !== null && (
          <div className="inactivity-banner" role="alert">
            <span>
              ⏰ Your session will close due to inactivity in{' '}
              <strong>{minsLeft} minute{minsLeft !== 1 ? 's' : ''}</strong>.
            </span>
            <button className="inactivity-stay-btn" onClick={resetTimer}>
              Stay connected
            </button>
          </div>
        )}

        {/* Migration banner */}
        {localCount > 0 && (
          <div className="migration-banner">
            <div className="migration-text">
              <strong>📦 You have {localCount} memory item{localCount !== 1 ? 's' : ''} saved locally.</strong>
              <span>Import them to the cloud so you don't lose them.</span>
            </div>
            <button
              className="migration-btn"
              onClick={handleMigrate}
              disabled={migrating}
            >
              {migrating ? 'Importing…' : '☁️ Import local data'}
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

        {/* Tab navigation */}
        <div className="tab-nav">
          <button
            className={`tab-btn${activeTab === 'diary' ? ' tab-btn--active' : ''}`}
            onClick={() => setActiveTab('diary')}
          >
            📔 Memories
          </button>
          <button
            className={`tab-btn${activeTab === 'art' ? ' tab-btn--active' : ''}`}
            onClick={() => setActiveTab('art')}
          >
            🎨 Art Gallery
          </button>
          <button
            className={`tab-btn${activeTab === 'pdf' ? ' tab-btn--active' : ''}`}
            onClick={() => setActiveTab('pdf')}
          >
            📄 Generate diary
          </button>
        </div>

        {activeTab === 'art' ? (
          <>
            {artworksError && (
              <div className="error-banner" role="alert">
                <span>⚠️ {artworksError}</span>
                <button onClick={() => setArtworksError(null)} aria-label="Cerrar">✕</button>
              </div>
            )}
            <button className="add-button" onClick={() => setShowArtworkForm(true)}>
              + New artwork
            </button>
            {artworks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-emoji">🎨</div>
                <h2>No artworks yet!</h2>
                <p>Start saving drawings and creations 💕</p>
              </div>
            ) : (
              <div className="entries-list">
                {[...artworks]
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map(artwork => (
                    <ArtworkCard
                      key={artwork.id}
                      artwork={artwork}
                      currentUserId={currentUserId}
                      isAdmin={isAdmin}
                      onEdit={handleEditArtwork}
                      onDelete={handleDeleteArtwork}
                    />
                  ))}
              </div>
            )}
          </>
        ) : activeTab === 'pdf' ? (
          <Suspense fallback={<div className="loading">Loading generator… 💛</div>}>
            <DiaryGenerator entries={entries} artworks={artworks} />
          </Suspense>
        ) : (
          <>
            <div className="search-bar">
              <input
                type="text"
                placeholder="🔍 Search by person..."
                value={searchPerson}
                onChange={e => setSearchPerson(e.target.value)}
                aria-label="Search by person"
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
              + New memory
            </button>

            {loading ? (
              <div className="loading">Loading memories… 💛</div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-emoji">🌈</div>
                {searchPerson ? (
                  <>
                    <h2>No results</h2>
                    <p>No memories with <strong>{searchPerson}</strong>.</p>
                  </>
                ) : (
                  <>
                    <h2>No memories yet!</h2>
                    <p>Start capturing the special moments 💕</p>
                  </>
                )}
              </div>
            ) : (
              <div className="entries-list">
                {filtered.map(entry => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    currentUserId={currentUserId}
                    isAdmin={isAdmin}
                    onToggle={handleToggle}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
