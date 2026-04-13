// Storage keys
const KEYS = {
  SPACES: 'ob_spaces',
  HOURS: 'ob_hours',
  BOOKINGS: 'ob_bookings',
  ADMIN: 'ob_admin',
  ADMIN_USERS: 'ob_admin_users',
  CURRENT_USER: 'ob_current_user',
  MEMBERS: 'ob_members',
  MEMBER_SESSION: 'ob_member_session',
  CONFIG: 'ob_config',
}

// ── Members (regular users) ────────────────────────────────────────────────

export function getMembers() {
  try {
    const raw = localStorage.getItem(KEYS.MEMBERS)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveMembers(members) {
  localStorage.setItem(KEYS.MEMBERS, JSON.stringify(members))
}

export function registerMember({ name, email, password }) {
  const members = getMembers()
  if (members.find((m) => m.email.toLowerCase() === email.toLowerCase())) {
    return { error: 'An account with that email already exists.' }
  }
  const member = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    status: 'pending', // pending | active | suspended
    createdAt: new Date().toISOString(),
  }
  members.push(member)
  saveMembers(members)
  return { member }
}

export function authenticateMember(email, password) {
  const members = getMembers()
  return members.find(
    (m) => m.email.toLowerCase() === email.toLowerCase() && m.password === password
  ) || null
}

export function getMemberSession() {
  try {
    const raw = localStorage.getItem(KEYS.MEMBER_SESSION)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setMemberSession(member) {
  if (member) {
    localStorage.setItem(KEYS.MEMBER_SESSION, JSON.stringify(member))
  } else {
    localStorage.removeItem(KEYS.MEMBER_SESSION)
  }
}

export function updateMemberStatus(id, status) {
  const members = getMembers()
  const idx = members.findIndex((m) => m.id === id)
  if (idx !== -1) {
    members[idx].status = status
    saveMembers(members)
  }
}

// ── App config ─────────────────────────────────────────────────────────────

const DEFAULT_CONFIG = {
  dbUrl: '',
  appName: 'Trinity Hub',
  logo: '/trinity-logo.svg',
  primaryColor: '#231F20',
  secondaryColor: '#4a4547',
}

export function getConfig() {
  try {
    const raw = localStorage.getItem(KEYS.CONFIG)
    return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : DEFAULT_CONFIG
  } catch {
    return DEFAULT_CONFIG
  }
}

export function saveConfig(config) {
  localStorage.setItem(KEYS.CONFIG, JSON.stringify(config))
}

// Default admin users
const DEFAULT_ADMIN_USERS = [
  {
    id: 'user-1',
    username: 'admin',
    password: 'admin123',
    name: 'Administrator',
    role: 'superadmin',
    createdAt: new Date().toISOString(),
  },
]

// Admin users
export function getAdminUsers() {
  try {
    const raw = localStorage.getItem(KEYS.ADMIN_USERS)
    if (!raw) {
      localStorage.setItem(KEYS.ADMIN_USERS, JSON.stringify(DEFAULT_ADMIN_USERS))
      return DEFAULT_ADMIN_USERS
    }
    return JSON.parse(raw)
  } catch {
    return DEFAULT_ADMIN_USERS
  }
}

export function saveAdminUsers(users) {
  localStorage.setItem(KEYS.ADMIN_USERS, JSON.stringify(users))
}

export function authenticateAdmin(username, password) {
  const users = getAdminUsers()
  return users.find((u) => u.username === username && u.password === password) || null
}

export function getCurrentAdminUser() {
  try {
    const raw = localStorage.getItem(KEYS.CURRENT_USER)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setCurrentAdminUser(user) {
  if (user) {
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user))
    localStorage.setItem(KEYS.ADMIN, 'true')
  } else {
    localStorage.removeItem(KEYS.CURRENT_USER)
    localStorage.removeItem(KEYS.ADMIN)
  }
}

// Default seed data
const DEFAULT_SPACES = [
  {
    id: 'space-1',
    name: 'Board Room',
    type: 'room',
    capacity: 12,
    description: 'Meeting room with projector and video conferencing',
    amenities: ['Projector', 'Video Conferencing', 'Whiteboard', 'TV Screen'],
    active: true,
  },
  {
    id: 'space-2',
    name: 'Focus Room',
    type: 'room',
    capacity: 4,
    description: 'Small quiet meeting room',
    amenities: ['TV Screen', 'Whiteboard'],
    active: true,
  },
  {
    id: 'space-3',
    name: 'Hot Desk 1',
    type: 'table',
    capacity: 1,
    description: 'Individual workstation with monitor',
    amenities: ['Monitor', 'USB Hub'],
    active: true,
  },
  {
    id: 'space-4',
    name: 'Hot Desk 2',
    type: 'table',
    capacity: 1,
    description: 'Individual workstation with monitor',
    amenities: ['Monitor', 'USB Hub'],
    active: true,
  },
  {
    id: 'space-5',
    name: 'Main Hall',
    type: 'room',
    capacity: 100,
    description: 'Large open hall suitable for events, services and large gatherings',
    amenities: ['Stage', 'PA System', 'Projector', 'Chairs', 'Accessible'],
    active: true,
  },
]

const DEFAULT_HOURS = {
  0: { open: '09:00', close: '18:00', closed: true },   // Sunday
  1: { open: '08:00', close: '18:00', closed: false },   // Monday
  2: { open: '08:00', close: '18:00', closed: false },   // Tuesday
  3: { open: '08:00', close: '18:00', closed: false },   // Wednesday
  4: { open: '08:00', close: '18:00', closed: false },   // Thursday
  5: { open: '08:00', close: '18:00', closed: false },   // Friday
  6: { open: '09:00', close: '18:00', closed: true },    // Saturday
}

// Spaces
export function getSpaces() {
  try {
    const raw = localStorage.getItem(KEYS.SPACES)
    if (!raw) {
      localStorage.setItem(KEYS.SPACES, JSON.stringify(DEFAULT_SPACES))
      return DEFAULT_SPACES
    }
    return JSON.parse(raw)
  } catch {
    return DEFAULT_SPACES
  }
}

export function saveSpaces(spaces) {
  localStorage.setItem(KEYS.SPACES, JSON.stringify(spaces))
}

// Hours
export function getHours() {
  try {
    const raw = localStorage.getItem(KEYS.HOURS)
    if (!raw) {
      localStorage.setItem(KEYS.HOURS, JSON.stringify(DEFAULT_HOURS))
      return DEFAULT_HOURS
    }
    const parsed = JSON.parse(raw)
    // Ensure keys are numbers
    const normalized = {}
    for (let i = 0; i <= 6; i++) {
      normalized[i] = parsed[i] || DEFAULT_HOURS[i]
    }
    return normalized
  } catch {
    return DEFAULT_HOURS
  }
}

export function saveHours(hours) {
  localStorage.setItem(KEYS.HOURS, JSON.stringify(hours))
}

// Bookings
export function getBookings() {
  try {
    const raw = localStorage.getItem(KEYS.BOOKINGS)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function saveBookings(bookings) {
  localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(bookings))
}

export function addBooking(bookingData) {
  const bookings = getBookings()
  const booking = {
    ...bookingData,
    id: `booking-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  }
  bookings.push(booking)
  saveBookings(bookings)
  return booking
}

export function cancelBooking(id) {
  const bookings = getBookings()
  const updated = bookings.filter((b) => b.id !== id)
  saveBookings(updated)
}

// Admin auth
export function isAdminLoggedIn() {
  try {
    return localStorage.getItem(KEYS.ADMIN) === 'true'
  } catch {
    return false
  }
}

export function setAdminLoggedIn(val) {
  if (val) {
    localStorage.setItem(KEYS.ADMIN, 'true')
  } else {
    localStorage.removeItem(KEYS.ADMIN)
  }
}

// Time utilities
export function generateTimeSlots(openTime, closeTime) {
  const slots = []
  const [openHour, openMin] = openTime.split(':').map(Number)
  const [closeHour, closeMin] = closeTime.split(':').map(Number)

  let currentMinutes = openHour * 60 + openMin
  const endMinutes = closeHour * 60 + closeMin

  while (currentMinutes < endMinutes) {
    const h = Math.floor(currentMinutes / 60)
    const m = currentMinutes % 60
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    currentMinutes += 30
  }

  return slots
}

export function getBookingsForSpaceAndDate(spaceId, date) {
  const bookings = getBookings()
  return bookings.filter((b) => b.spaceId === spaceId && b.date === date)
}

export function isSlotAvailable(spaceId, date, startTime, endTime) {
  const existing = getBookingsForSpaceAndDate(spaceId, date)
  const startMins = timeToMinutes(startTime)
  const endMins = timeToMinutes(endTime)

  for (const booking of existing) {
    const bStart = timeToMinutes(booking.startTime)
    const bEnd = timeToMinutes(booking.endTime)
    // Overlap check: new booking overlaps if start < bEnd AND end > bStart
    if (startMins < bEnd && endMins > bStart) {
      return false
    }
  }
  return true
}

function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}
