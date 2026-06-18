import { supabase } from './supabase'

async function getCurrentUserId() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user?.id ?? null
}

function fromRow(row, nameMap = {}) {
  return {
    id:             row.id,
    userId:         row.user_id,
    title:          row.title,
    note:           row.note      ?? '',
    date:           row.date,
    photo:          row.photo     ?? null,
    location:       row.location  ?? 'home',
    technique:      row.technique ?? 'dibujo',
    dateAdded:      row.date_added,
    uploadedByName: nameMap[row.user_id] ?? null,
  }
}

function toRow(item) {
  return {
    title:     item.title,
    note:      item.note      || null,
    date:      item.date,
    photo:     item.photo     || null,
    location:  item.location  || 'home',
    technique: item.technique || 'dibujo',
  }
}

export async function getArtworks() {
  const [
    { data: rows,     error: artworksError },
    { data: profiles, error: profilesError },
  ] = await Promise.all([
    supabase.from('artworks').select('*'),
    supabase.from('profiles').select('id, display_name'),
  ])

  if (artworksError) throw new Error('No se pudieron cargar las obras. Comprueba tu conexión e inténtalo de nuevo.')

  const nameMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.display_name]))
  return rows.map(row => fromRow(row, nameMap))
}

export async function addArtwork(item) {
  const userId = await getCurrentUserId()
  const { data, error } = await supabase
    .from('artworks')
    .insert({ ...toRow(item), user_id: userId })
    .select()
    .single()

  if (error) {
    console.error('[artworkStorage] addArtwork failed:', error)
    throw new Error('No se pudo guardar la obra. Por favor, inténtalo de nuevo.')
  }
  return fromRow(data)
}

export async function updateArtwork(id, updates) {
  const { error } = await supabase
    .from('artworks')
    .update(toRow(updates))
    .eq('id', id)

  if (error) throw new Error('No se pudo actualizar la obra. Por favor, inténtalo de nuevo.')
}

export async function deleteArtwork(id) {
  const { error } = await supabase
    .from('artworks')
    .delete()
    .eq('id', id)

  if (error) throw new Error('No se pudo eliminar la obra. Por favor, inténtalo de nuevo.')
}
