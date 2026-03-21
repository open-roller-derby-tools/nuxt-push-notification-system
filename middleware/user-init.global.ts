export default defineNuxtRouteMiddleware(async (to) => {
  // Only for /user path
  if (!to.path.startsWith('/user')) return
  // Get deviceId
  const deviceId = useDeviceId()
  // get userId
  const { userId } = useUser()
  // If user exist -> return
  if (userId.value) return

  // Avoid call from server to localStorage
  if (import.meta.server) return

  // Create user if not exist
  const res = await $fetch('/api/devices/create', {
    method: 'POST',
    body: { device_id: deviceId.value }
  })
  // Store user_id in global state
  userId.value = res.user_id
})
