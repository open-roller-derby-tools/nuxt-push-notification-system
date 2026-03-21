import { getDb } from '../../utils/dbClient'
import { notificationQueue } from '../../utils/queue'

// Create a new notification in PGSQL and publish it to Redis.

export default defineEventHandler(async (event) => {
  const { channel_slug, title, body, data, scheduled_at } = await readBody(event)

  if (!channel_slug || !title || !body) {
    throw createError({ statusCode: 400, statusMessage: "Missing channel_slug, title or body" })
  }

  const db = getDb()
  await db.connect()

  // Find channel
  const channel = await db.query(
    `SELECT id FROM channels WHERE slug = $1`,
    [channel_slug],
  )

  if (channel.rowCount === 0) {
    throw createError({ statusCode: 404, statusMessage: "Channel not found" })
  }

  // Create notification
  const result = await db.query(
    `
    INSERT INTO notifications (channel_id, title, body, data, scheduled_at)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `,
    [channel.rows[0].id, title, body, data ?? {}, scheduled_at ?? null],
  )

  const notificationId = result.rows[0].id
  const notification = result.rows[0]

  // Publish to BullMQ
  await notificationQueue.add(
    'send-notification',
    { notification_id: notification.id,
      title: notification.title,
      body: notification.body,
      channel: notification.channel_name,
      channel_slug: notification.channel_slug,
      scheduled_at: notification.scheduled_at,
      created_at: notification.created_at },
    scheduled_at // If scheduled_at planned notification, else instant notification
      ? { delay: new Date(scheduled_at).getTime() - Date.now() }
      : {}
  )

  return { id: notificationId }
})
