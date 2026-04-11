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
    const text = await res.text()
    let json = null
    try { json = text ? JSON.parse(text) : null } catch { /* non-JSON response */ }
    if (!res.ok) return { data: null, error: json?.error || `HTTP ${res.status}`, status: res.status }
    return { data: json, error: null, status: res.status }
  } catch (err) {
    return { data: null, error: err.message, status: 0 }
  }
}

// ── Config ────────────────────────────────────────────────────────────────

export async function fetchConfigFromApi() {
  const { data, error } = await apiFetch('/config')
  if (error) return { data: null, error }
  return { data, error: null }
}

export async function saveConfigToApi(config) {
  const { dbUrl: _omit, ...rest } = config
  const { data, error } = await apiFetch('/config', {
    method: 'POST',
    body: JSON.stringify(rest),
  })
  if (error) return { ok: false, error }
  return { ok: true, saved: data?.saved ?? [] }
}

// ── Spaces ────────────────────────────────────────────────────────────────

export async function fetchSpacesFromApi() {
  return apiFetch('/spaces')
}

export async function createSpaceInApi(space) {
  return apiFetch('/spaces', { method: 'POST', body: JSON.stringify(space) })
}

export async function updateSpaceInApi(id, updates) {
  return apiFetch(`/spaces?id=${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
}

export async function deleteSpaceFromApi(id) {
  return apiFetch(`/spaces?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
}

// ── Hours ─────────────────────────────────────────────────────────────────

export async function fetchHoursFromApi() {
  return apiFetch('/hours')
}

export async function saveHoursToApi(hours) {
  return apiFetch('/hours', { method: 'POST', body: JSON.stringify(hours) })
}

// ── Bookings ──────────────────────────────────────────────────────────────

export async function fetchBookingsFromApi() {
  return apiFetch('/bookings')
}

export async function fetchBookingsByEmailFromApi(email) {
  return apiFetch(`/bookings?email=${encodeURIComponent(email)}`)
}

export async function fetchBookingsForSpaceDateFromApi(spaceId, date) {
  return apiFetch(`/bookings?spaceId=${encodeURIComponent(spaceId)}&date=${encodeURIComponent(date)}`)
}

export async function createBookingInApi(booking) {
  return apiFetch('/bookings', { method: 'POST', body: JSON.stringify(booking) })
}

export async function cancelBookingInApi(id) {
  return apiFetch(`/bookings?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
}

// ── Members ───────────────────────────────────────────────────────────────

export async function fetchMembersFromApi() {
  return apiFetch('/members')
}

export async function registerMemberInApi({ name, email, password }) {
  return apiFetch('/members', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })
}

export async function updateMemberStatusInApi(id, status) {
  return apiFetch(`/members?id=${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function deleteMemberFromApi(id) {
  return apiFetch(`/members?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
}

// ── Admin users ───────────────────────────────────────────────────────────

export async function fetchAdminUsersFromApi() {
  return apiFetch('/admin-users')
}

export async function createAdminUserInApi(user) {
  return apiFetch('/admin-users', { method: 'POST', body: JSON.stringify(user) })
}

export async function updateAdminUserInApi(id, updates) {
  return apiFetch(`/admin-users?id=${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
}

export async function deleteAdminUserFromApi(id) {
  return apiFetch(`/admin-users?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
}

// ── Auth ──────────────────────────────────────────────────────────────────

export async function loginMemberViaApi(email, password) {
  return apiFetch('/auth/member', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function loginAdminViaApi(username, password) {
  return apiFetch('/auth/admin', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}
