import { getDb } from '../../utils/dbClient'

// Get all channels
export default defineEventHandler(async () => {
  const db = getDb()
  await db.connect()

  const result = await db.query(`
    SELECT id, slug, name, track, team_id_1, team_id_2, created_at
    FROM channels
    ORDER BY created_at DESC
  `)

  return result.rows
})
