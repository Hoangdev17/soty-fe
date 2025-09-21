<script setup lang="ts">
const props = defineProps({
  user: { type: Object, required: false },
  state: { type: Object, required: true },
  currentProfileEffect: { type: Object, required: false },
  currentAvatarEffect: { type: Object, required: false },
  profileEffectStyle: { type: Object, required: false },
});
</script>

<template>
  <div class="flex flex-col items-start gap-y-4 w-full max-w-sm">
    <p class="uppercase text-sm font-semibold text-gray-600">PREVIEW</p>

    <!-- Profile Card -->
    <div
      class="w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 relative"
    >
      <!-- Profile Effect Overlay for entire card -->
      <div
        v-if="currentProfileEffect?.metadata?.effects"
        class="absolute inset-0 w-full h-full pointer-events-none z-10 rounded-lg overflow-hidden"
        :style="profileEffectStyle"
      ></div>

      <!-- Banner Section -->
      <div class="h-24 bg-gradient-to-r from-blue-500 to-purple-600 relative">
        <div class="absolute inset-0 bg-black opacity-10"></div>
        <img
          v-if="state.banner"
          :src="state.banner"
          alt="Banner"
          class="w-full h-full object-cover"
        />
      </div>

      <!-- Avatar Section -->
      <div class="relative px-6 pb-6">
        <div class="flex items-start -mt-12 mb-4">
          <!-- Avatar Container -->
          <div class="relative w-20 h-20 flex items-center justify-center">
            <!-- Avatar -->
            <div
              class="relative w-full h-full rounded-full border-4 border-white dark:border-gray-800 overflow-hidden"
            >
              <img
                v-if="state.avatar"
                :src="state.avatar"
                :alt="state.globalName || props.user?.globalName || 'Avatar'"
                class="w-full h-full object-cover"
              />
              <UIcon
                v-else
                name="i-lucide-user"
                class="w-8 h-8 text-gray-500 dark:text-gray-400"
              />
            </div>

            <!-- Avatar Effect Overlay (căn giữa & ra ngoài border) -->
            <img
              v-if="currentAvatarEffect?.metadata?.link"
              :src="currentAvatarEffect.metadata.link"
              class="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 scale-110 object-contain pointer-events-none z-10"
              alt="Avatar effect"
            />
          </div>
        </div>

        <!-- Profile Info -->
        <div class="space-y-3">
          <div>
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">
              {{ state.globalName || props.user?.globalName || "Display Name" }}
            </h2>
            <p class="text-gray-600 dark:text-gray-400 text-sm">
              @{{ state.username || props.user?.username || "username" }}
            </p>
          </div>

          <!-- Biography -->
          <div class="pt-2">
            <p class="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              {{
                state.bio ||
                props.user?.bio ||
                "Your biography will appear here. Add some details about yourself to make your profile more interesting!"
              }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes profile-effect {
  0% {
    background-image: var(--intro-src);
  }
  37.5% {
    background-image: var(--intro-src);
  }
  37.6% {
    background-image: var(--loop-src);
  }
  100% {
    background-image: var(--loop-src);
  }
}
</style>
