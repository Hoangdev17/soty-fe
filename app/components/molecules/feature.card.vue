<script setup lang="ts">
interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  gradientFrom: string;
  gradientTo: string;
}

defineProps<FeatureCardProps>();
</script>

<template>
  <UCard
    class="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 group"
  >
    <div class="p-8 text-center">
      <!-- Icon -->
      <div
        :class="`w-16 h-16 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`"
      >
        <Icon :name="icon" class="w-8 h-8 text-white" />
      </div>

      <!-- Title -->
      <h3 class="text-xl font-bold text-white mb-4">{{ title }}</h3>

      <!-- Description -->
      <p class="text-purple-100 leading-relaxed">{{ description }}</p>
    </div>
  </UCard>
</template>
