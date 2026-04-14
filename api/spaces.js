// api/spaces.js
// GET    /api/spaces     — list all spaces
// POST   /api/spaces     — create space
// PATCH  /api/spaces?id= — update space
// DELETE /api/spaces?id= — delete space
import { withDb } from './_db.js'

export default async function handler(req, res) {
  await withDb(req, res, async (client) => {
    const id = req.query?.id

    if (req.method === 'GET') {
      const { rows } = await client.query(
        `SELECT id, name, type, capacity, description, amenities, images, location_id, active FROM spaces ORDER BY name`
      )
      return res.status(200).json(rows.map(normalise))
    }

    if (req.method === 'POST') {
      const { id, name, type, capacity, description, amenities, images, location_id, active } = req.body || {}
      if (!id || !name || !type) return res.status(400).json({ error: 'id, name and type are required' })
      await client.query(
        `INSERT INTO spaces (id, name, type, capacity, description, amenities, images, location_id, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           name=$2, type=$3, capacity=$4, description=$5, amenities=$6, images=$7, location_id=$8, active=$9`,
        [id, name, type, capacity ?? 1, description ?? '', amenities ?? [], images ?? [], location_id ?? null, active !== false]
      )
      return res.status(201).json({ ok: true })
    }

    if (req.method === 'PATCH') {
      if (!id) return res.status(400).json({ error: 'id query param required' })
      const { name, type, capacity, description, amenities, images, location_id, active } = req.body || {}
      await client.query(
        `UPDATE spaces SET
           name        = COALESCE($2, name),
           type        = COALESCE($3, type),
           capacity    = COALESCE($4, capacity),
           description = COALESCE($5, description),
           amenities   = COALESCE($6, amenities),
           images      = COALESCE($7, images),
           location_id = $8,
           active      = COALESCE($9, active)
         WHERE id = $1`,
        [id, name, type, capacity, description, amenities, images ?? null, location_id ?? null, active]
      )
      return res.status(200).json({ ok: true })
    }

    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'id query param required' })
      await client.query(`DELETE FROM spaces WHERE id = $1`, [id])
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  })
}

function normalise(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    capacity: row.capacity,
    description: row.description || '',
    amenities: row.amenities || [],
    images: row.images || [],
    locationId: row.location_id || null,
    active: row.active,
  }
}
