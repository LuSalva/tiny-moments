import { supabase } from './supabase'

// Map a Supabase row (snake_case) → app entry (camelCase)
function fromRow(row) {
  return {
    id:        row.id,
    title:     row.title,
    type:      row.type,
    note:      row.note      ?? '',
    date:      row.date,
    photo:     row.photo     ?? null,
    location:  row.location  ?? '',
    people:    row.people    ?? [],
    favourite: row.favourite ?? false,
    dateAdded: row.date_added,
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
  const { data, error } = await supabase
    .from('entries')
    .select('*')

  if (error) {
    console.error('[storage] getItems failed:', error)
    throw new Error(
      `Error al cargar: ${error.message} (código ${error.code ?? '?'})`
    )
  }
  return data.map(fromRow)
}

export async function addItem(item) {
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id

  if (!userId) {
    console.error('[storage] addItem: no authenticated user found in session')
    throw new Error('No hay sesión activa. Por favor, inicia sesión de nuevo.')
  }

  const row = { ...toRow(item), user_id: userId }
  console.log('[storage] addItem inserting:', row)

  const { data, error } = await supabase
    .from('entries')
    .insert(row)
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
const LS_KEY = 'abrazo-familiar-entries'

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

  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id
  if (!userId) throw new Error('No hay sesión activa. Por favor, inicia sesión de nuevo.')

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
    user_id:    userId,
  }))

  const { error } = await supabase.from('entries').insert(rows)
  if (error) {
    console.error('[storage] migration failed:', error)
    throw new Error('La migración falló. Por favor, inténtalo de nuevo.')
  }

  localStorage.removeItem(LS_KEY)
  return local.length
}
