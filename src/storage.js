import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Faltan las variables de entorno VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY.'
  )
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Startup diagnostics — confirm env vars were baked in at build time
console.log('[storage] Supabase URL:', supabaseUrl)
console.log('[storage] Anon key starts with:', supabaseKey?.slice(0, 20) + '…')

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
    title:    item.title,
    type:     item.type,
    note:     item.note     || null,
    date:     item.date,
    photo:    item.photo    || null,
    location: item.location || null,
    people:   item.people   ?? [],
    favourite: item.favourite ?? false,
  }
}

export async function getItems() {
  console.log('[storage] getItems: querying entries table…')
  const { data, error } = await supabase
    .from('entries')
    .select('*')

  if (error) {
    console.error('[storage] getItems failed — code:', error.code, '| message:', error.message, '| details:', error.details, '| hint:', error.hint)
    throw new Error(
      `Error al cargar: ${error.message || error.code || 'desconocido'} ` +
      `(código ${error.code ?? '?'}). ` +
      `${error.hint ? 'Sugerencia: ' + error.hint : ''}`
    )
  }

  console.log('[storage] getItems OK — rows returned:', data.length)
  return data.map(fromRow)
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
  // Read current value first, then flip it
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

  const rows = local.map(e => ({
    title:     e.title,
    type:      e.type,
    note:      e.note      || null,
    date:      e.date,
    photo:     e.photo     || null,
    location:  e.location  || null,
    people:    e.people    ?? [],
    favourite: e.favourite ?? false,
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
