<script setup>
definePageMeta({
  layout: 'admin'
})

/*** For POC only if initialization script is done */
const tracks = [
  { label: 'Track 1', trackId: 1 },
  { label: 'Track 2', trackId: 2 }
]

const teams = [
  { label: 'France', teamId: 1 },
  { label: 'Australia', teamId: 2 },
  { label: 'USA', teamId: 3 }
]

const filteredTeam2List = computed(()=> {
  return teams.filter(t => t.teamId !== team_id_1.value)
})

const team_id_1 = ref(null)
const team_id_2 = ref(null)
const track = ref(null)

const isGameChannel = computed(() => slug.value.startsWith('game_'))

/*** END */

const channels = ref([])
const name = ref('')
const slug = ref('')

// Get existing channels
async function loadChannels() {
  channels.value = await $fetch('/api/channels/list')
}

onMounted(async () => {
  await loadChannels()
})

// Create new channel
async function createChannel() {
  await $fetch('/api/channels/create', {
    method: 'POST',
    body: 
      { 
        name: name.value, slug: slug.value,
        team_id_1: isGameChannel.value ? team_id_1.value : null,
        team_id_2: isGameChannel.value ? team_id_2.value : null,
        track: isGameChannel.value ? track.value : null
      }
  })
  //Reload list
  await loadChannels()
  // Reset form
  name.value = ''
  slug.value = ''
  team_id_1.value = null
  team_id_2.value = null
  track.value = null
}
</script>

<template>
  <div class="space-y-10">
    <h1 class="text-3xl font-bold">Channels</h1>

    <!-- Create form -->
    <form @submit.prevent="createChannel" class="space-y-4 max-w-md">
      <div>
        <label class="block mb-1 text-gray-300">Name</label>
        <input v-model="name" class="w-full p-3 bg-gray-900 border border-gray-700 rounded" />
      </div>

      <div>
        <label class="block mb-1 text-gray-300">Slug (for a game channel, set the slug by "game_[GameId]")</label>
        <input v-model="slug" class="w-full p-3 bg-gray-900 border border-gray-700 rounded" />
      </div>

      <!-- Champs conditionnels -->
      <div v-if="isGameChannel" class="space-y-4">
        <!-- Team 1 -->
        <div>
          <label class="block mb-1 text-gray-300">Team 1</label>
          <select v-model="team_id_1" class="w-full p-3 bg-gray-900 border border-gray-700 rounded">
            <option v-for="t in teams" :key="t.teamId" :value="t.teamId">{{t.label}}</option>
          </select>
        </div>
        <!-- Team 2 -->
        <div>
          <label class="block mb-1 text-gray-300">Team 2</label>
          <select v-model="team_id_2" class="w-full p-3 bg-gray-900 border border-gray-700 rounded">
            <option v-for="t in filteredTeam2List" :key="t.teamId" :value="t.teamId">{{t.label}}</option>
          </select>
        </div>
        <!-- Track -->
        <div>
          <label class="block mb-1 text-gray-300">Track</label>
          <select v-model="track" class="w-full p-3 bg-gray-900 border border-gray-700 rounded">
            <option v-for="t in tracks" :key="t.trackId" :value="t.trackId">{{ t.label }}</option>
          </select>
        </div>
      </div>


      <button class="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white">
        Create channel
      </button>
    </form>

    <!-- Channels list -->
    <div class="space-y-4">
      <div
        v-for="c in channels"
        :key="c.id"
        class="bg-gray-900 p-4 rounded flex justify-between items-center"
      >
        <div>
          <p class="text-lg font-semibold">{{ c.name }}</p>
          <p class="text-gray-400 text-sm">{{ c.slug }}</p>
        </div>

        <p class="text-gray-500 text-sm">
          {{ new Date(c.created_at).toLocaleDateString() }}
        </p>
      </div>
    </div>
  </div>
</template>