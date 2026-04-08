// Storage keys
const KEYS = {
  SPACES: 'ob_spaces',
  HOURS: 'ob_hours',
  BOOKINGS: 'ob_bookings',
  ADMIN: 'ob_admin',
  ADMIN_USERS: 'ob_admin_users',
  CURRENT_USER: 'ob_current_user',
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
    description: 'Large meeting room with projector and video conferencing',
    amenities: ['Projector', 'Video Conferencing', 'Whiteboard', 'TV Screen'],
    active: true,
  },
  {
    id: 'space-2',
    name: 'Focus Room A',
    type: 'room',
    capacity: 4,
    description: 'Small quiet meeting room',
    amenities: ['TV Screen', 'Whiteboard'],
    active: true,
  },
  {
    id: 'space-3',
    name: 'Focus Room B',
    type: 'room',
    capacity: 4,
    description: 'Small quiet meeting room',
    amenities: ['TV Screen', 'Whiteboard'],
    active: true,
  },
  {
    id: 'space-4',
    name: 'Creative Studio',
    type: 'room',
    capacity: 8,
    description: 'Open collaboration space',
    amenities: ['Whiteboards', 'Standing Desks', 'TV Screen'],
    active: true,
  },
  {
    id: 'space-5',
    name: 'Hot Desk 1',
    type: 'table',
    capacity: 1,
    description: 'Individual workstation with monitor',
    amenities: ['Monitor', 'USB Hub'],
    active: true,
  },
  {
    id: 'space-6',
    name: 'Hot Desk 2',
    type: 'table',
    capacity: 1,
    description: 'Individual workstation with monitor',
    amenities: ['Monitor', 'USB Hub'],
    active: true,
  },
  {
    id: 'space-7',
    name: 'Hot Desk 3',
    type: 'table',
    capacity: 1,
    description: 'Individual workstation with monitor',
    amenities: ['Monitor', 'USB Hub'],
    active: true,
  },
  {
    id: 'space-8',
    name: 'Hot Desk 4',
    type: 'table',
    capacity: 1,
    description: 'Individual workstation with monitor',
    amenities: ['Monitor', 'USB Hub'],
    active: true,
  },
  {
    id: 'space-9',
    name: 'Hot Desk 5',
    type: 'table',
    capacity: 1,
    description: 'Individual workstation with monitor',
    amenities: ['Monitor', 'USB Hub'],
    active: true,
  },
  {
    id: 'space-10',
    name: 'Hot Desk 6',
    type: 'table',
    capacity: 1,
    description: 'Individual workstation with monitor',
    amenities: ['Monitor', 'USB Hub'],
    active: true,
  },
  {
    id: 'space-11',
    name: 'Hot Desk 7',
    type: 'table',
    capacity: 1,
    description: 'Individual workstation with monitor',
    amenities: ['Monitor', 'USB Hub'],
    active: true,
  },
  {
    id: 'space-12',
    name: 'Hot Desk 8',
    type: 'table',
    capacity: 1,
    description: 'Individual workstation with monitor',
    amenities: ['Monitor', 'USB Hub'],
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
