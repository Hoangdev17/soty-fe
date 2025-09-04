<script setup lang="ts">
const ctaButtons = [
  {
    text: "Download Discord",
    icon: "i-heroicons-arrow-down-tray",
    variant: "solid",
    color: "white",
    bgClass: "bg-white text-purple-600 hover:bg-purple-50",
  },
  {
    text: "Try in Browser",
    variant: "outline",
    color: "white",
    bgClass: "backdrop-blur-sm border-white/30 hover:bg-white/10",
  },
];
</script>

<template>
  <UContainer class="relative z-10 py-20">
    <div class="text-center">
      <UCard
        class="bg-white/10 backdrop-blur-lg border-white/20 max-w-4xl mx-auto"
      >
        <div class="p-12 space-y-6">
          <h2 class="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to start your journey?
          </h2>
          <p class="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Join millions of users who are already having fun and building
            communities on Discord.
          </p>

          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <UButton
              v-for="(btn, index) in ctaButtons"
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
      </UCard>
    </div>
  </UContainer>
</template>
