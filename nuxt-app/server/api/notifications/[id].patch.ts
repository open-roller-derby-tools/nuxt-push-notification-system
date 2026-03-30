import { getDb } from '../../utils/dbClient'

export default defineEventHandler(async (event) => {
  const notification_id = event.context.params?.id
  if (!notification_id) {
    throw createError({ statusCode: 400, statusMessage: "Missing notification_id" })
  }

  const body = await readBody(event)

  // Build dynamic SET clause
  const fields = []
  const values = []
  let idx = 1

  for (const key of ['title', 'body', 'data', 'scheduled_at']) {
    if (body[key] !== undefined) {
      fields.push(`${key} = $${idx}`)
      values.push(body[key])
      idx++
    }
  }

  if (fields.length === 0) {
    throw createError({ statusCode: 400, statusMessage: "No fields to update" })
  }

  values.push(notification_id)

  const db = getDb()
  await db.connect()

  const result = await db.query(
    `UPDATE notifications SET ${fields.join(', ')} WHERE id = $${idx}`,
    values
  )

  if (result.rowCount === 0) {
    throw createError({ statusCode: 404, statusMessage: "Notification not found" })
  }

  return {
    ok: true,
    updated: true
  }
})
