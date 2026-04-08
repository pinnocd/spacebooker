// src/utils/apiClient.js
// Thin wrappers around the /api/* serverless functions.
// All functions return { data, error } — callers decide how to handle failures.
// The app continues to work via localStorage even if the API is unavailable.

const BASE = '/api'

async function apiFetch(path, options = {}) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
    const json = await res.json()
    if (!res.ok) return { data: null, error: json.error || `HTTP ${res.status}` }
    return { data: json, error: null }
  } catch (err) {
    return { data: null, error: err.message }
  }
}

// ── Config ────────────────────────────────────────────────────────────────

/**
 * Load config from the database.
 * Returns merged object on success, null if DB is unavailable.
 */
export async function fetchConfigFromApi() {
  const { data, error } = await apiFetch('/config')
  if (error) return { data: null, error }
  return { data, error: null }
}

/**
 * Save config to the database.
 * `config` should omit `dbUrl` — that stays server-side only.
 */
export async function saveConfigToApi(config) {
  // Strip dbUrl — it must not be round-tripped into the DB from the client
  const { dbUrl: _omit, ...rest } = config
  const { data, error } = await apiFetch('/config', {
    method: 'POST',
    body: JSON.stringify(rest),
  })
  if (error) return { ok: false, error }
  return { ok: true, saved: data?.saved ?? [] }
}
