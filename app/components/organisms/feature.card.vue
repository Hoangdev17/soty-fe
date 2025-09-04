<script setup lang="ts">
import FeatureCard from "../molecules/feature.card.vue";

const features = [
  {
    title: "Voice & Text Chat",
    description:
      "Crystal clear voice chat and organized text channels keep your conversations flowing smoothly.",
    icon: "i-heroicons-chat-bubble-left-right",
    gradientFrom: "from-purple-500",
    gradientTo: "to-pink-500",
  },
  {
    title: "Communities",
    description:
      "Build amazing communities around your interests with powerful moderation and organization tools.",
    icon: "i-heroicons-user-group",
    gradientFrom: "from-blue-500",
    gradientTo: "to-cyan-500",
  },
  {
    title: "Cross Platform",
    description:
      "Stay connected anywhere with Discord on desktop, mobile, and web. Your conversations follow you.",
    icon: "i-heroicons-device-phone-mobile",
    gradientFrom: "from-green-500",
    gradientTo: "to-emerald-500",
  },
];
</script>

<template>
  <UContainer class="relative z-10 py-20">
    <!-- Section Title -->
    <div class="text-center mb-16">
      <h2 class="text-4xl lg:text-5xl font-bold text-white mb-6">
        Why choose Discord?
      </h2>
      <p class="text-xl text-purple-100 max-w-3xl mx-auto">
        From gaming with friends to building communities, Discord has everything
        you need to connect and have fun.
      </p>
    </div>

    <!-- Feature Cards -->
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      <FeatureCard
        v-for="(feature, index) in features"
        :key="index"
        :title="feature.title"
        :description="feature.description"
        :icon="feature.icon"
        :gradientFrom="feature.gradientFrom"
        :gradientTo="feature.gradientTo"
      />
    </div>
  </UContainer>
</template>
