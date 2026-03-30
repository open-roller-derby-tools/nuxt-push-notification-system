import { getDb } from '../../utils/dbClient'

// Delete channel
export default defineEventHandler(async (event) => {
  const channel_id = event.context.params?.id

  if (!channel_id) {
    throw createError({ statusCode: 400, statusMessage: "Missing channel_id" })
  }

  const db = getDb()
  await db.connect()

  // Delete channel
  const result = await db.query(
    `DELETE FROM channels WHERE id = $1`,
    [channel_id]
  )

  if (result.rowCount === 0) {
    throw createError({ statusCode: 404, statusMessage: "Channel not found" })
  }

  return {
    ok: true,
    deleted: (result.rowCount ?? 0) > 0
  }

})
