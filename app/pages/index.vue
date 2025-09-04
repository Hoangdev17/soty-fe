<!-- pages/index.vue -->
<template>
  <div
    class="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 relative overflow-hidden"
  >
    <!-- Floating Background Elements -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        class="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"
      ></div>
      <div
        class="absolute top-40 right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"
      ></div>
      <div
        class="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"
      ></div>
    </div>

    <!-- Navigation -->
    <UContainer class="relative z-10">
      <nav class="flex items-center justify-between py-6">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center"
          >
            <Icon
              name="i-heroicons-chat-bubble-left-ellipsis"
              class="w-6 h-6 text-white"
            />
          </div>
          <span class="text-2xl font-bold text-white">Soty</span>
        </div>

        <div class="hidden md:flex items-center gap-8">
          <ULink
            class="text-white hover:text-purple-200 transition-colors font-medium"
          >
            Download
          </ULink>
          <ULink
            class="text-white hover:text-purple-200 transition-colors font-medium"
          >
            Nitro
          </ULink>
          <ULink
            class="text-white hover:text-purple-200 transition-colors font-medium"
          >
            Discover
          </ULink>
          <ULink
            class="text-white hover:text-purple-200 transition-colors font-medium"
          >
            Safety
          </ULink>
          <ULink
            class="text-white hover:text-purple-200 transition-colors font-medium"
          >
            Support
          </ULink>
        </div>

        <UButton
          variant="solid"
          color="neutral"
          size="xl"
          class="hidden md:block rounded-xl"
        >
          Open Soty
        </UButton>

        <!-- Mobile Menu Button -->
        <UButton variant="ghost" color="white" size="sm" class="md:hidden">
          <Icon name="i-heroicons-bars-3" class="w-6 h-6" />
        </UButton>
      </nav>
    </UContainer>

    <!-- Hero Section -->
    <UContainer class="relative z-10 py-16">
      <div class="grid lg:grid-cols-2 gap-12 items-center">
        <!-- Left Content -->
        <div class="space-y-8 text-center lg:text-left">
          <div class="space-y-6">
            <h1
              class="text-5xl lg:text-7xl font-black text-white leading-tight"
            >
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
              size="xl"
              class="bg-white text-purple-600 hover:bg-purple-50 font-semibold px-8 py-4 shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105"
            >
              <Icon name="i-heroicons-arrow-down-tray" class="w-5 h-5 mr-2" />
              Download for Windows
            </UButton>

            <UButton
              variant="outline"
              size="xl"
              color="white"
              class="font-semibold px-8 py-4 backdrop-blur-sm border-white/30 hover:bg-white/10 transition-all duration-300 hover:scale-105"
            >
              Open Discord in your browser
            </UButton>
          </div>
        </div>

        <!-- Right Content - Illustration -->
        <div class="relative">
          <!-- Main Card -->
          <UCard
            class="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 hover:scale-105 hover:rotate-1"
          >
            <div class="p-8">
              <!-- Mock Discord Interface -->
              <div class="space-y-4">
                <!-- Server List -->
                <div class="flex items-center gap-3 mb-6">
                  <div class="flex gap-2">
                    <div
                      class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center"
                    >
                      <Icon
                        name="i-heroicons-home"
                        class="w-6 h-6 text-white"
                      />
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
                  <div class="flex items-start gap-3">
                    <UAvatar
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
                      alt="User 1"
                      size="sm"
                    />
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <span class="text-white font-semibold text-sm"
                          >Alex</span
                        >
                        <span class="text-purple-200 text-xs"
                          >Today at 2:30 PM</span
                        >
                      </div>
                      <p class="text-purple-100 text-sm">
                        Anyone up for a game? 🎮
                      </p>
                    </div>
                  </div>

                  <div class="flex items-start gap-3">
                    <UAvatar
                      src="https://images.unsplash.com/photo-1494790108755-2616b612b5e0?w=100&h=100&fit=crop&crop=face"
                      alt="User 2"
                      size="sm"
                    />
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <span class="text-white font-semibold text-sm"
                          >Sarah</span
                        >
                        <span class="text-purple-200 text-xs"
                          >Today at 2:31 PM</span
                        >
                      </div>
                      <p class="text-purple-100 text-sm">
                        I'm in! What are we playing?
                      </p>
                    </div>
                  </div>

                  <div class="flex items-start gap-3">
                    <UAvatar
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
                      alt="User 3"
                      size="sm"
                    />
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <span class="text-white font-semibold text-sm"
                          >Mike</span
                        >
                        <span class="text-purple-200 text-xs"
                          >Today at 2:32 PM</span
                        >
                      </div>
                      <p class="text-purple-100 text-sm">
                        Let's do some Valorant! 🔥
                      </p>
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

    <!-- Features Section -->
    <UContainer class="relative z-10 py-20">
      <div class="text-center mb-16">
        <h2 class="text-4xl lg:text-5xl font-bold text-white mb-6">
          Why choose Discord?
        </h2>
        <p class="text-xl text-purple-100 max-w-3xl mx-auto">
          From gaming with friends to building communities, Discord has
          everything you need to connect and have fun.
        </p>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <UCard
          class="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 group"
        >
          <div class="p-8 text-center">
            <div
              class="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300"
            >
              <Icon
                name="i-heroicons-chat-bubble-left-right"
                class="w-8 h-8 text-white"
              />
            </div>
            <h3 class="text-xl font-bold text-white mb-4">Voice & Text Chat</h3>
            <p class="text-purple-100 leading-relaxed">
              Crystal clear voice chat and organized text channels keep your
              conversations flowing smoothly.
            </p>
          </div>
        </UCard>

        <UCard
          class="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 group"
        >
          <div class="p-8 text-center">
            <div
              class="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300"
            >
              <Icon name="i-heroicons-user-group" class="w-8 h-8 text-white" />
            </div>
            <h3 class="text-xl font-bold text-white mb-4">Communities</h3>
            <p class="text-purple-100 leading-relaxed">
              Build amazing communities around your interests with powerful
              moderation and organization tools.
            </p>
          </div>
        </UCard>

        <UCard
          class="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 group"
        >
          <div class="p-8 text-center">
            <div
              class="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300"
            >
              <Icon
                name="i-heroicons-device-phone-mobile"
                class="w-8 h-8 text-white"
              />
            </div>
            <h3 class="text-xl font-bold text-white mb-4">Cross Platform</h3>
            <p class="text-purple-100 leading-relaxed">
              Stay connected anywhere with Discord on desktop, mobile, and web.
              Your conversations follow you.
            </p>
          </div>
        </UCard>
      </div>
    </UContainer>

    <!-- Call to Action -->
    <UContainer class="relative z-10 py-20">
      <div class="text-center">
        <UCard
          class="bg-white/10 backdrop-blur-lg border-white/20 max-w-4xl mx-auto"
        >
          <div class="p-12">
            <h2 class="text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to start your journey?
            </h2>
            <p class="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              Join millions of users who are already having fun and building
              communities on Discord.
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <UButton
                size="xl"
                class="bg-white text-purple-600 hover:bg-purple-50 font-semibold px-8 py-4 shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105"
              >
                <Icon name="i-heroicons-arrow-down-tray" class="w-5 h-5 mr-2" />
                Download Discord
              </UButton>
              <UButton
                variant="outline"
                size="xl"
                color="white"
                class="font-semibold px-8 py-4 backdrop-blur-sm border-white/30 hover:bg-white/10 transition-all duration-300 hover:scale-105"
              >
                Try in Browser
              </UButton>
            </div>
          </div>
        </UCard>
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
// SEO Meta
useSeoMeta({
  title: "Discord - Group Chat That's All Fun & Games",
  ogTitle: "Discord - Group Chat That's All Fun & Games",
  description:
    "Discord is great for playing games and chilling with friends, or even building a worldwide community. Customize your own space to talk, play, and hang out.",
  ogDescription:
    "Discord is great for playing games and chilling with friends, or even building a worldwide community. Customize your own space to talk, play, and hang out.",
  ogImage: "/discord-og.jpg",
  twitterCard: "summary_large_image",
});

// Animation classes for blob effect
useHead({
  style: [
    {
      innerHTML: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `,
    },
  ],
});
</script>

<style scoped>
/* Additional custom styles if needed */
</style>
