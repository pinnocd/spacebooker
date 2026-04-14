// api/locations.js
// GET    /api/locations      — list all locations
// POST   /api/locations      — create location
// PATCH  /api/locations?id=  — update location
// DELETE /api/locations?id=  — delete location
import { withDb, setCors } from './_db.js'

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()

  await withDb(req, res, async (client) => {
    const id = req.query?.id

    if (req.method === 'GET') {
      const { rows } = await client.query(
        `SELECT id, name, description, address, tagline, logo, images, floor_map, active, created_at
         FROM locations ORDER BY name`
      )
      return res.status(200).json(rows.map(normalise))
    }

    if (req.method === 'POST') {
      const { id, name, description, address, tagline, logo, images, floor_map, active } = req.body || {}
      if (!id || !name) return res.status(400).json({ error: 'id and name are required' })
      const floorMapStr = floor_map != null ? JSON.stringify(floor_map) : null
      await client.query(
        `INSERT INTO locations (id, name, description, address, tagline, logo, images, floor_map, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           name=$2, description=$3, address=$4, tagline=$5, logo=$6, images=$7, floor_map=$8, active=$9`,
        [id, name, description ?? '', address ?? '', tagline ?? '', logo ?? '', images ?? [], floorMapStr, active !== false]
      )
      return res.status(201).json({ ok: true })
    }

    if (req.method === 'PATCH') {
      if (!id) return res.status(400).json({ error: 'id query param required' })
      const { name, description, address, tagline, logo, images, floor_map, active } = req.body || {}
      const floorMapStr = floor_map !== undefined ? (floor_map != null ? JSON.stringify(floor_map) : null) : undefined
      await client.query(
        `UPDATE locations SET
           name        = COALESCE($2, name),
           description = COALESCE($3, description),
           address     = COALESCE($4, address),
           tagline     = COALESCE($5, tagline),
           logo        = COALESCE($6, logo),
           images      = COALESCE($7, images),
           floor_map   = CASE WHEN $8::text IS NOT NULL THEN $8 ELSE floor_map END,
           active      = COALESCE($9, active)
         WHERE id = $1`,
        [id, name, description, address, tagline, logo, images ?? null, floorMapStr ?? null, active]
      )
      return res.status(200).json({ ok: true })
    }

    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'id query param required' })
      // Unlink spaces from this location before deleting
      await client.query(`UPDATE spaces SET location_id = NULL WHERE location_id = $1`, [id])
      await client.query(`DELETE FROM locations WHERE id = $1`, [id])
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  })
}

function normalise(row) {
  let floorMap = null
  if (row.floor_map) {
    try { floorMap = JSON.parse(row.floor_map) } catch { floorMap = null }
  }
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    address: row.address || '',
    tagline: row.tagline || '',
    logo: row.logo || '',
    images: row.images || [],
    floorMap,
    active: row.active,
    createdAt: row.created_at,
  }
}
