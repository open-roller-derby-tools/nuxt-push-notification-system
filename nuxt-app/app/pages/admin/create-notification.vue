<script setup>
definePageMeta({
  layout: 'admin'
})
const { toUtc } = useUtcDate()

const notificationTypes = {
  // Channel starts with "game_":
  game: [
    { label: 'Start soon', index: 1, title: "Game is starting soon", template: 'The game {{team1}} vs. {{team2}} will start soon on track {{track}}', isScheduled: true }, // scheduled, link to the game
    { label: 'Started', index: 2, title: "Game has started", template: 'The game  {{team1}} vs. {{team2}} has started on track {{track}}', isScheduled: true }, // scheduled, link to the game
    { label: 'intermission', index: 3, title: "Intermission", template: '{{team1}} {{score1}} - {{score2}} {{team2}}', isScheduled: false }, // manual, link to the game --> score
    { label: 'end of game', index: 4, title: "End of game", template: 'Final score: {{team1}} {{score1}} - {{score2}} {{team2}}', isScheduled: false }, // manual, link to the game --> score
    { label: 'late', index: 5, title: "Late", template: 'The game is running {{minutes}} minutes late', isScheduled: false } // manual, link to the game - number of minutes late --> propagate to all channel scheduled notifications
  ], 
  // Channel is on_site_notices
  on_site_notices: [
    { label: 'on_site_info', index: 6, title: "", template: '{{message}}' } // manual, link to the app - free text
  ],
  // Channel is global_notices
  global_notices: [
    { label: 'global_info', index: 7, title: "", template: '{{message}}' } // manual, link to the app - free text
  ]
}

const channelType = computed(() => {
  if (!channel.value) return null

  if (channel.value.slug.startsWith('game_')) return 'game'
  if (channel.value.slug === 'on_site_notices') return 'on_site_notices'
  if (channel.value.slug === 'global_notices') return 'global_notices'

  return null
})

const availableNotificationTypes = computed(() => {
  return notificationTypes[channelType.value] ?? []
})

const isFreeText = computed(() => {
  if (!channel.value || !notificationType.value) return false

  return ['on_site_notices', 'global_notices'].includes(channelType.value)
})

const notificationType = ref(null)
const message = ref('')
const channel = ref(null)
const mode = ref('live') // 'live' or 'scheduled'
const scheduledAt = ref(null)

const score1 = ref(null)
const score2 = ref(null)

const gameDelay = ref(null)

const channels = ref([])

onMounted(async () => {
  channels.value = await $fetch('/api/channels/list')
  if (channels.value.length > 0) {
    channel.value = channels.value[0]
  }
})

const autoTitle = computed(() => {
  return notificationType.value?.title ?? ''
})

const autoMode = computed(() => {
  return notificationType.value?.isScheduled ? 'scheduled' : 'live'
})

const autoMessage = computed(() => {
  if (!notificationType.value || !channel.value) return ''

  const vars = {
    track: channel.value.track,
    team1: channel.value.team_id_1,
    team2: channel.value.team_id_2,
    score1: score1.value,
    score2: score2.value,
    minutes: gameDelay.value,
    message: message.value // for free text
  }

  return applyTemplate(notificationType.value.template, vars)
})

function applyTemplate(template, vars) {
  return template.replace(/{{(.*?)}}/g, (_, key) => {
    const k = key.trim()
    return vars[k] ?? ''
  })
}

function handleSubmit(e) {
  e.preventDefault()
  if (!e.target.checkValidity()) return
  submit()
}

async function submit() {
  await $fetch('/api/notifications/create', {
    method: 'POST',
    body: {
      channel_slug: channel.value.slug,
      title: autoTitle.value,
      body: isFreeText.value ? message.value : autoMessage.value,
      scheduled_at: mode.value === 'scheduled' ? toUtc(scheduledAt.value) : null
    }
  })

  message.value = ''
  score1.value = null
  score2.value = null
  scheduledAt.value = null
  gameDelay.value = null
}
</script>

<template>
  <div class="space-y-8">
    <h1 class="text-3xl font-bold">Create Notification</h1>

    <form @submit="handleSubmit" class="space-y-6 max-w-xl">
      <!-- Channel -->
      <div>
        <label class="block mb-2 text-gray-300">Channel</label>
        <select v-model="channel" required class="w-full p-3 bg-gray-900 rounded border border-gray-700">
          <option v-for="c in channels" :key="c.id" :value="c">
            {{ c.name }}
          </option>
        </select>
      </div>
      <!-- Notification type -->
      <div v-if="availableNotificationTypes.length > 0">
        <label class="block mb-2 text-gray-300">Notification type</label>
        <select v-model="notificationType" required class="w-full p-3 bg-gray-900 rounded border border-gray-700">
          <option v-for="t in availableNotificationTypes" :key="t.index" :value="t">
            {{ t.label }}
          </option>
        </select>
      </div>
      <!-- Title -->
      <div>
        <label class="block mb-2 text-gray-300">Title</label>
        <input
          :value="autoTitle"
          readonly
          class="w-full p-3 bg-gray-900 rounded border border-gray-700 opacity-70 cursor-not-allowed"
        />
      </div>
      <!-- score -->
      <div
        v-if="
          channel &&
          notificationType &&
          ['intermission', 'end of game'].includes(notificationType.label)"
        class="flex gap-4"
      >
        <!-- Score 1 -->
        <div class="flex-1">
          <label class="block mb-2 text-gray-300">
            Score team id {{ channel.team_id_1 }}
          </label>
          <input
            required
            type="number"
            name="score team 1"
            v-model="score1"
            class="w-full p-3 bg-gray-900 rounded border border-gray-700"
          />
        </div>
        <!-- Score 2 -->
        <div class="flex-1">
          <label class="block mb-2 text-gray-300">
            Score team id {{ channel.team_id_2 }}
          </label>
          <input
            v-model="score2"
            type="number"
            required
            name="score team 2"
            class="w-full p-3 bg-gray-900 rounded border border-gray-700"
          />
        </div>
      </div>
      <!-- Game delay in minutes -->
      <div v-if="channel &&
          notificationType && notificationType.label === 'late'" class="mt-4">
      <label class="block mb-2 text-gray-300">Minutes de retard</label>
        <input
          v-model="gameDelay"
          type="number"
          name="minutes"
          min="1"
          required
          class="w-full p-3 bg-gray-900 rounded border border-gray-700"
        />
    </div>
      <!-- Content -->
      <div>
        <label class="block mb-2 text-gray-300">Message</label>
        <!-- <textarea v-model="message" rows="4" class="w-full p-3 bg-gray-900 rounded border border-gray-700" /> -->
        <textarea
          v-if="isFreeText"
          v-model="message"
          name="free text"
          required
          rows="4"
          class="w-full p-3 bg-gray-900 rounded border border-gray-700"
        />
        <textarea
          v-else
          :value="autoMessage"
          readonly
          rows="4"
          class="w-full p-3 bg-gray-900 rounded border border-gray-700 opacity-70 cursor-not-allowed"
        />
      </div>
      <!-- Mode Live / Scheduled -->
      <div v-if="channel && notificationType" class="mt-4">
        <label class="block mb-2 text-gray-300">Mode</label>

        <div class="flex items-center gap-4 text-gray-300 pointer-events-none">
          <label class="flex items-center gap-2">
            <input  type="radio" value="live" :checked="autoMode === 'live'" />
            Live
          </label>

          <label class="flex items-center gap-2 ">
            <input type="radio" value="scheduled" :checked="autoMode === 'scheduled'" />
            Scheduled
          </label>
        </div>
      </div>

      <!-- Date + Time if scheduled -->
      <div v-if="mode === 'scheduled'" class="mt-4">
        <label class="block mb-2 text-gray-300">Date & time</label>
        <input
          type="datetime-local"
          v-model="scheduledAt"
          class="w-full p-3 bg-gray-900 rounded border border-gray-700"
        />
      </div>

      <button class="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded text-white">
        Send notification
      </button>
    </form>
  </div>
</template>