<script setup lang="ts">
// Danh sách buttons
const buttons = [
  {
    text: "Download for Windows",
    icon: "i-heroicons-arrow-down-tray",
    variant: "solid",
    color: "white",
    bgClass: "bg-white text-purple-600 hover:bg-purple-50",
  },
  {
    text: "Open Discord in your browser",
    variant: "outline",
    color: "white",
    bgClass: "backdrop-blur-sm border-white/30 hover:bg-white/10",
  },
];

// Mock chat messages
const messages = [
  {
    name: "Alex",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    time: "Today at 2:30 PM",
    text: "Anyone up for a game? 🎮",
  },
  {
    name: "Sarah",
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b5e0?w=100&h=100&fit=crop&crop=face",
    time: "Today at 2:31 PM",
    text: "I'm in! What are we playing?",
  },
  {
    name: "Mike",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    time: "Today at 2:32 PM",
    text: "Let's do some Valorant! 🔥",
  },
];
</script>

<template>
  <UContainer class="relative z-10 py-16">
    <div class="grid lg:grid-cols-2 gap-12 items-center">
      <!-- Left Content -->
      <div class="space-y-8 text-center lg:text-left">
        <div class="space-y-6">
          <h1 class="text-5xl lg:text-7xl font-black text-white leading-tight">
            GROUP CHAT
            <br />
            <span
              class="bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 bg-clip-text text-transparent"
            >
              THAT'S ALL FUN
            </span>
            <br />
            & GAMES
          </h1>

          <p class="text-xl text-purple-100 max-w-2xl leading-relaxed">
            Discord is great for playing games and chilling with friends, or
            even building a worldwide community. Customize your own space to
            talk, play, and hang out.
          </p>
        </div>

        <div
          class="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
        >
          <UButton
            v-for="(btn, index) in buttons"
            :key="index"
            :variant="btn.variant || 'solid'"
            :color="btn.color || 'neutral'"
            size="xl"
            :class="`${btn.bgClass} font-semibold px-8 py-4 shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 flex items-center justify-center`"
          >
            <Icon v-if="btn.icon" :name="btn.icon" class="w-5 h-5 mr-2" />
            {{ btn.text }}
          </UButton>
        </div>
      </div>

      <!-- Right Content - Illustration -->
      <div class="relative">
        <!-- Main Card -->
        <UCard
          class="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 hover:scale-105 hover:rotate-1"
        >
          <div class="p-8 space-y-4">
            <!-- Server List -->
            <div class="flex items-center gap-3 mb-6">
              <div class="flex gap-2">
                <div
                  class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center"
                >
                  <Icon name="i-heroicons-home" class="w-6 h-6 text-white" />
                </div>
                <div
                  class="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center"
                >
                  <Icon
                    name="i-heroicons-musical-note"
                    class="w-6 h-6 text-white"
                  />
                </div>
                <div
                  class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center"
                >
                  <Icon
                    name="i-heroicons-puzzle-piece"
                    class="w-6 h-6 text-white"
                  />
                </div>
              </div>
            </div>

            <!-- Chat Messages -->
            <div class="space-y-3">
              <div
                v-for="(msg, idx) in messages"
                :key="idx"
                class="flex items-start gap-3"
              >
                <UAvatar :src="msg.avatar" :alt="msg.name" size="sm" />
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <span class="text-white font-semibold text-sm">{{
                      msg.name
                    }}</span>
                    <span class="text-purple-200 text-xs">{{ msg.time }}</span>
                  </div>
                  <p class="text-purple-100 text-sm">{{ msg.text }}</p>
                </div>
              </div>
            </div>

            <!-- Voice Channel -->
            <div class="bg-white/5 rounded-lg p-3 mt-6">
              <div class="flex items-center gap-2 mb-2">
                <Icon
                  name="i-heroicons-speaker-wave"
                  class="w-4 h-4 text-green-400"
                />
                <span class="text-white text-sm font-medium"
                  >Gaming Lounge</span
                >
              </div>
              <div class="flex items-center gap-2">
                <div class="flex -space-x-2">
                  <UAvatar
                    size="2xs"
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
                  />
                  <UAvatar
                    size="2xs"
                    src="https://images.unsplash.com/photo-1494790108755-2616b612b5e0?w=100&h=100&fit=crop&crop=face"
                  />
                  <UAvatar
                    size="2xs"
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
                  />
                </div>
                <span class="text-purple-200 text-xs">3 members</span>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Floating Elements -->
        <div
          class="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-20 animate-pulse"
        ></div>
        <div
          class="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full opacity-20 animate-bounce"
        ></div>
      </div>
    </div>
  </UContainer>
</template>
