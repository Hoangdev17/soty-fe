<script setup lang="ts">
import { useAuthStore } from "~/stores/auth/auth.store";

// danh sách links
const links = ["Download", "Nitro", "Discover", "Safety", "Support"];

const authStore = useAuthStore();

// Reactive user state
const user = computed(() => authStore.userInfo);
const isLoggedIn = computed(() => authStore.isLoggedIn);

// Mobile menu state
const isMobileMenuOpen = ref(false);
</script>

<template>
  <UContainer class="relative z-10">
    <nav class="flex items-center justify-between py-6">
      <!-- Logo -->
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

      <!-- Menu Links -->
      <div class="hidden md:flex items-center gap-8">
        <ULink
          v-for="link in links"
          :key="link"
          class="text-white hover:text-purple-200 transition-colors font-medium"
        >
          {{ link }}
        </ULink>
      </div>

      <!-- Desktop Buttons -->
      <div v-if="!isLoggedIn" class="hidden md:flex items-center gap-4">
        <UButton
          variant="ghost"
          color="white"
          size="lg"
          class="rounded-xl"
          to="/auth/login"
        >
          Login
        </UButton>
        <UButton
          variant="solid"
          color="primary"
          size="lg"
          class="rounded-xl"
          to="/auth/register"
        >
          Register
        </UButton>
      </div>

      <UButton
        v-else
        variant="solid"
        color="primary"
        size="lg"
        class="hidden md:block rounded-xl"
        to="/@me/channels"
      >
        Open Soty
      </UButton>

      <!-- Mobile Menu Button -->
      <UButton
        variant="ghost"
        color="white"
        size="sm"
        class="md:hidden"
        @click="isMobileMenuOpen = !isMobileMenuOpen"
      >
        <Icon name="i-heroicons-bars-3" class="w-6 h-6" />
      </UButton>
    </nav>

    <!-- Mobile Menu -->
    <div
      v-if="isMobileMenuOpen"
      class="md:hidden bg-gray-900/95 backdrop-blur-sm border-t border-gray-700"
    >
      <div class="px-4 py-6 space-y-4">
        <!-- Mobile Menu Links -->
        <div class="space-y-3">
          <ULink
            v-for="link in links"
            :key="link"
            class="block text-white hover:text-purple-200 transition-colors font-medium py-2"
          >
            {{ link }}
          </ULink>
        </div>

        <!-- Mobile Auth Buttons -->
        <div class="pt-4 border-t border-gray-700">
          <div v-if="!isLoggedIn" class="space-y-3">
            <UButton
              variant="ghost"
              color="white"
              size="lg"
              class="w-full rounded-xl"
              to="/auth/login"
              @click="isMobileMenuOpen = false"
            >
              Login
            </UButton>
            <UButton
              variant="solid"
              color="primary"
              size="lg"
              class="w-full rounded-xl"
              to="/auth/register"
              @click="isMobileMenuOpen = false"
            >
              Register
            </UButton>
          </div>

          <UButton
            v-else
            variant="solid"
            color="primary"
            size="lg"
            class="w-full rounded-xl"
            to="/@me/channels"
            @click="isMobileMenuOpen = false"
          >
            Open Soty
          </UButton>
        </div>
      </div>
    </div>
  </UContainer>
</template>
