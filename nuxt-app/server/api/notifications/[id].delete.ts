import { getDb } from '../../utils/dbClient'

export default defineEventHandler(async (event) => {
  const notification_id = event.context.params?.id

  if (!notification_id) {
    throw createError({ statusCode: 400, statusMessage: "Missing notification_id" })
  }

  const db = getDb()
  await db.connect()

  // Delete notification
  const result = await db.query(
    `DELETE FROM notifications WHERE id = $1`,
    [notification_id]
  )

  if (result.rowCount === 0) {
    throw createError({ statusCode: 404, statusMessage: "Notification not found" })
  }

  return {
    ok: true,
    deleted: true
  }
})
