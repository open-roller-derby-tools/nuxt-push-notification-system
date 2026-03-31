import { getDb } from '../../utils/dbClient'

// Create channel in PGSQL
export default defineEventHandler(async (event) => {
  const { slug, name, track, team_id_1, team_id_2 } = await readBody(event)

  if (!slug || !name) {
    throw createError({ statusCode: 400, statusMessage: "Missing slug or name" })
  }

  const db = getDb()
  await db.connect()

  const result = await db.query(
    `
    INSERT INTO channels (slug, name, track, team_id_1, team_id_2)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
    `,
    [slug, name, track, team_id_1, team_id_2],
  )

  return { id: result.rows[0].id }
})
