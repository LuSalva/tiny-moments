import { supabase } from './supabase'

// Map a Supabase row (snake_case) → app entry (camelCase)
// nameMap: { [user_id]: display_name } — optional, built in getItems
function fromRow(row, nameMap = {}) {
  return {
    id:             row.id,
    userId:         row.user_id,
    title:          row.title,
    type:           row.type,
    note:           row.note      ?? '',
    date:           row.date,
    photo:          row.photo     ?? null,
    location:       row.location  ?? '',
    people:         row.people    ?? [],
    favourite:      row.favourite ?? false,
    dateAdded:      row.date_added,
    uploadedByName: nameMap[row.user_id] ?? null,
  }
}

// Map an app entry (camelCase) → Supabase row (snake_case)
function toRow(item) {
  return {
    title:     item.title,
    type:      item.type,
    note:      item.note     || null,
    date:      item.date,
    photo:     item.photo    || null,
    location:  item.location || null,
    people:    item.people   ?? [],
    favourite: item.favourite ?? false,
  }
}

export async function getItems() {
  const [
    { data: rows,     error: entriesError },
    { data: profiles, error: profilesError },
  ] = await Promise.all([
    supabase.from('entries').select('*'),
    supabase.from('profiles').select('id, display_name'),
  ])

  if (entriesError) {
    console.error('[storage] getItems entries error:', entriesError)
    throw new Error('No se pudieron cargar los recuerdos. Comprueba tu conexión e inténtalo de nuevo.')
  }

  console.log('[storage] profiles query — data:', profiles, '| error:', profilesError)

  const nameMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.display_name]))
  console.log('[storage] nameMap:', nameMap)

  const result = rows.map(row => fromRow(row, nameMap))
  if (result.length > 0) {
    console.log('[storage] first entry:', result[0])
  }
  return result
}

export async function addItem(item) {
  const { data, error } = await supabase
    .from('entries')
    .insert(toRow(item))
    .select()
    .single()

  if (error) {
    console.error('[storage] addItem failed:', error)
    throw new Error('No se pudo guardar el recuerdo. Por favor, inténtalo de nuevo.')
  }
  return fromRow(data)
}

export async function updateItem(id, updates) {
  const { error } = await supabase
    .from('entries')
    .update(toRow(updates))
    .eq('id', id)

  if (error) {
    console.error('[storage] updateItem failed:', error)
    throw new Error('No se pudo actualizar el recuerdo. Por favor, inténtalo de nuevo.')
  }
}

export async function toggleItem(id) {
  const { data: row, error: fetchError } = await supabase
    .from('entries')
    .select('favourite')
    .eq('id', id)
    .single()

  if (fetchError) {
    console.error('[storage] toggleItem fetch failed:', fetchError)
    throw new Error('No se pudo actualizar el recuerdo. Por favor, inténtalo de nuevo.')
  }

  const { error } = await supabase
    .from('entries')
    .update({ favourite: !row.favourite })
    .eq('id', id)

  if (error) {
    console.error('[storage] toggleItem update failed:', error)
    throw new Error('No se pudo actualizar el recuerdo. Por favor, inténtalo de nuevo.')
  }
}

export async function deleteItem(id) {
  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[storage] deleteItem failed:', error)
    throw new Error('No se pudo eliminar el recuerdo. Por favor, inténtalo de nuevo.')
  }
}

// ─── Migration helper (localStorage → Supabase) ──────────────────────────────
const LS_KEY = 'tiny-moments-entries'

export function getLocalItems() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export async function migrateLocalToSupabase() {
  const local = getLocalItems()
  if (local.length === 0) return 0

  const rows = local.map(e => ({
    title:      e.title,
    type:       e.type,
    note:       e.note      || null,
    date:       e.date,
    photo:      e.photo     || null,
    location:   e.location  || null,
    people:     e.people    ?? [],
    favourite:  e.favourite ?? false,
    date_added: e.dateAdded || new Date().toISOString(),
  }))

  const { error } = await supabase.from('entries').insert(rows)
  if (error) {
    console.error('[storage] migration failed:', error)
    throw new Error('La migración falló. Por favor, inténtalo de nuevo.')
  }

  localStorage.removeItem(LS_KEY)
  return local.length
}
