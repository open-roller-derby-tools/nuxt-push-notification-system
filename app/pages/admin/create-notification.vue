<script setup>
definePageMeta({
  layout: 'admin'
})
const title = ref('')
const message = ref('')
const channel = ref('')

const channels = ref([])

onMounted(async () => {
  channels.value = await $fetch('/api/channels/list')
  if (channels.value.length > 0) {
    channel.value = channels.value[0].slug
  }
})

async function submit() {
  await $fetch('/api/notifications/create', {
    method: 'POST',
    body: {
      channel_slug: channel.value,
      title: title.value,
      body: message.value
    }
  })

  title.value = ''
  message.value = ''
}
</script>

<template>
  <div class="space-y-8">
    <h1 class="text-3xl font-bold">Create Notification</h1>

    <form @submit.prevent="submit" class="space-y-6 max-w-xl">
      <div>
        <label class="block mb-2 text-gray-300">Title</label>
        <input v-model="title" class="w-full p-3 bg-gray-900 rounded border border-gray-700" />
      </div>

      <div>
        <label class="block mb-2 text-gray-300">Message</label>
        <textarea v-model="message" rows="4" class="w-full p-3 bg-gray-900 rounded border border-gray-700" />
      </div>

      <div>
        <label class="block mb-2 text-gray-300">Channel</label>
        <select v-model="channel" class="w-full p-3 bg-gray-900 rounded border border-gray-700">
          <option v-for="c in channels" :key="c.id" :value="c.slug">
            {{ c.name }}
          </option>
        </select>
      </div>

      <button class="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded text-white">
        Send notification
      </button>
    </form>
  </div>
</template>