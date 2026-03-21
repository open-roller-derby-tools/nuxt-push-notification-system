import Redis from 'ioredis'
import webpush from 'web-push'
import { getDb } from '../utils/dbClient'

export default defineNitroPlugin(async () => {
  const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379')

  console.log('[Redis] Subscriber connected')

  redis.subscribe('notifications:new')

  redis.on('message', async (channel, message) => {
    if (channel !== 'notifications:new') return

    try {
      const { notification_id } = JSON.parse(message)

      const db = getDb()
      await db.connect()

      // 1) Get notification
      const notifRes = await db.query(
        `SELECT * FROM notifications WHERE id = $1`,
        [notification_id],
      )

      if (notifRes.rowCount === 0) return

      const notif = notifRes.rows[0]

      // 2) Get subscribers
      const usersRes = await db.query(
        `SELECT user_id FROM subscriptions WHERE channel_id = $1`,
        [notif.channel_id],
      )

      // 3) For each user → getr its push subscriptions
      for (const u of usersRes.rows) {
        const subsRes = await db.query(
          `SELECT * FROM push_subscriptions WHERE user_id = $1`,
          [u.user_id],
        )

        for (const s of subsRes.rows) {
          try {
            await webpush.sendNotification(
              {
                endpoint: s.endpoint,
                keys: { p256dh: s.p256dh, auth: s.auth }
              },
              JSON.stringify({
                title: notif.title,
                body: notif.body,
                data: notif.data
              })
            )
          } catch (err: any) {
            if (err.statusCode === 410 || err.statusCode === 404) {
              await db.query(
                `DELETE FROM push_subscriptions WHERE endpoint = $1`,
                [s.endpoint],
              )
            }
          }
        }
      }

      // 4) Set as sent
      await db.query(
        `UPDATE notifications SET sent_at = NOW() WHERE id = $1`,
        [notification_id],
      )

      console.log('[Redis] Notification sent:', notification_id)

    } catch (err) {
      console.error('[Redis] Worker error:', err)
    }
  })
})
