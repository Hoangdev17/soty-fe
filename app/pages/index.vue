<script setup lang="ts">
import NavbarIndex from "~/components/organisms/navbar.index.vue";
import Herosection from "~/components/organisms/herosection.vue";
import requiredAuth from "~/middleware/required.auth";

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
    <NavbarIndex />

    <!-- Hero Section -->
    <Herosection />

    <!-- Features Section -->
    <OrganismsFeatureCard />

    <!-- Call to Action -->
    <OrganismsCallToAction />
  </div>
</template>
