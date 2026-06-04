const STORAGE_KEY = 'abrazo-familiar-entries'

export async function getItems() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    throw new Error('No se pudieron cargar los recuerdos. Por favor, inténtalo de nuevo.')
  }
}

export async function addItem(item) {
  try {
    const entries = await getItems()
    const newEntry = {
      ...item,
      id: crypto.randomUUID(),
      dateAdded: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify([newEntry, ...entries]))
    return newEntry
  } catch {
    throw new Error('No se pudo guardar el recuerdo. Por favor, inténtalo de nuevo.')
  }
}

export async function toggleItem(id) {
  try {
    const entries = await getItems()
    const updated = entries.map(e =>
      e.id === id ? { ...e, favourite: !e.favourite } : e
    )
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    throw new Error('No se pudo actualizar el recuerdo. Por favor, inténtalo de nuevo.')
  }
}

export async function deleteItem(id) {
  try {
    const entries = await getItems()
    const updated = entries.filter(e => e.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    throw new Error('No se pudo eliminar el recuerdo. Por favor, inténtalo de nuevo.')
  }
}
