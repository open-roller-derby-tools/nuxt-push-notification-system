import { getDb } from '../../utils/dbClient'

// Delete push subcription
export default defineEventHandler(async (event) => {
  const { endpoint } = await readBody(event)

  if (!endpoint) {
    throw createError({ statusCode: 400, statusMessage: "Missing endpoint" })
  }

  const db = getDb()
  await db.connect()

  const result = await db.query(
    `
    DELETE FROM push_subscriptions
    WHERE endpoint = $1
    RETURNING id
    `,
    [endpoint],
  )

  return {
    ok: true,
    removed: (result.rowCount ?? 0) > 0
  }
})
