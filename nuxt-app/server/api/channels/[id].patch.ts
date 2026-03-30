import { getDb } from '../../utils/dbClient'

export default defineEventHandler(async (event) => {
  const channel_id = event.context.params?.id
  if (!channel_id) {
    throw createError({ statusCode: 400, statusMessage: "Missing channel_id" })
  }

  const body = await readBody(event)

  const fields = []
  const values = []
  let idx = 1

  for (const key of ['name', 'slug']) {
    if (body[key] !== undefined) {
      fields.push(`${key} = $${idx}`)
      values.push(body[key])
      idx++
    }
  }

  if (fields.length === 0) {
    throw createError({ statusCode: 400, statusMessage: "No fields to update" })
  }

  values.push(channel_id)

  const db = getDb()
  await db.connect()

  const result = await db.query(
    `UPDATE channels SET ${fields.join(', ')} WHERE id = $${idx}`,
    values
  )

  if (result.rowCount === 0) {
    throw createError({ statusCode: 404, statusMessage: "Channel not found" })
  }

  return {
    ok: true,
    updated: true
  }
})
