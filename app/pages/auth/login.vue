<script setup lang="ts">
import { reactive } from "vue";
import { useAuthStore } from "~/stores/auth/auth.store";

useHead({
  title: "Đăng nhập - Soty",
  meta: [
    {
      name: "description",
      content: "Đăng nhập vào Soty để kết nối với bạn bè và cộng đồng.",
    },
  ],
});

const state = reactive({
  email: "",
  password: "",
});

definePageMeta({
  layout: false,
});

const authStore = useAuthStore();
const toast = useToast();
const isLoading = ref(false);

const { setUser } = useUserClientStore();

async function onSubmit() {
  try {
    isLoading.value = true;

    const res = await authStore.login(state.email, state.password);
    console.log(res.user);
    setUser(res.user, res.accessToken);

    isLoading.value = false;

    toast.add({
      title: "Login successfully",
      color: "success",
    });

    navigateTo("/");
  } catch (err) {
    toast.add({
      title: "Login failed",
      color: "error",
    });
    console.error("Login failed:", err);
  }
}

const handleForgotPassword = () => {
  console.log("Forgot password clicked");
};

const handleRegister = () => {
  console.log("Register clicked");
};
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-indigo-800 via-purple-900 to-blue-700 relative overflow-hidden"
  >
    <!-- Subtle animated background -->
    <div class="absolute inset-0">
      <div
        class="absolute top-10 left-10 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl animate-pulse-slow"
      ></div>
      <div
        class="absolute bottom-20 right-20 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl animate-pulse-slow delay-1000"
      ></div>
    </div>

    <!-- Floating particles -->
    <div class="absolute inset-0">
      <div
        v-for="i in 30"
        :key="i"
        :class="`absolute w-1.5 h-1.5 bg-white/30 rounded-full animate-twinkle`"
        :style="{
          left: Math.random() * 100 + '%',
          top: Math.random() * 100 + '%',
          animationDelay: Math.random() * 5 + 's',
          animationDuration: Math.random() * 3 + 2 + 's',
        }"
      ></div>
    </div>

    <div
      class="relative z-10 flex min-h-screen items-center justify-center px-4 sm:px-6 lg:px-8"
    >
      <!-- Logo -->
      <div class="absolute top-6 left-6">
        <div class="flex items-center space-x-2">
          <div
            class="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md"
          >
            <svg
              class="w-6 h-6 text-indigo-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
              />
            </svg>
          </div>
          <span class="text-white text-xl font-bold tracking-tight">Soty</span>
        </div>
      </div>

      <!-- Main Content -->
      <div
        class="flex w-full max-w-5xl items-center justify-center gap-12 mx-auto min-h-screen"
      >
        <!-- Login Form -->
        <div class="w-full max-w-md">
          <div
            class="bg-gray-800/90 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-gray-700/50"
          >
            <div class="text-center mb-8">
              <h1 class="text-3xl font-bold text-white">Chào mừng trở lại!</h1>
              <p class="text-gray-400 text-sm mt-2">
                Đăng nhập để kết nối với cộng đồng Soty.
              </p>
            </div>

            <UForm :state="state" class="space-y-6" @submit="onSubmit">
              <!-- Email -->
              <UFormField label="Email" name="email" class="w-full">
                <UInput
                  v-model="state.email"
                  type="email"
                  placeholder="Nhập email của bạn"
                  autocomplete="email"
                  class="w-full rounded-lg bg-gray-900/50 text-white border-gray-600 focus:border-indigo-500"
                />
              </UFormField>

              <!-- Password -->
              <UFormField label="Mật khẩu" name="password" class="w-full">
                <UInput
                  v-model="state.password"
                  type="password"
                  placeholder="Nhập mật khẩu"
                  autocomplete="password"
                  class="w-full rounded-lg bg-gray-900/50 text-white border-gray-600 focus:border-indigo-500"
                />
              </UFormField>

              <!-- Submit Button -->
              <UButton
                color="secondary"
                type="submit"
                size="lg"
                :loading="isLoading"
                :disabled="isLoading"
                class="w-full rounded-lg py-3 bg-indigo-600 hover:bg-indigo-700 text-white transition-colors duration-300 flex items-center justify-center cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                Đăng nhập
              </UButton>

              <!-- Extra Actions -->
              <div class="flex justify-between items-center text-sm mt-4">
                <UButton
                  variant="link"
                  class="text-indigo-400 hover:text-indigo-300 p-0"
                  @click="handleForgotPassword"
                >
                  Quên mật khẩu?
                </UButton>
                <div>
                  <span class="text-gray-400">Chưa có tài khoản? </span>
                  <UButton
                    variant="link"
                    to="/auth/register"
                    class="text-indigo-400 hover:text-indigo-300 p-0"
                    @click="handleRegister"
                  >
                    Đăng ký
                  </UButton>
                </div>
              </div>
            </UForm>
          </div>
        </div>

        <!-- QR Code Section -->
        <div class="hidden lg:block w-full max-w-sm">
          <div class="text-center text-white">
            <div
              class="w-48 h-48 bg-white rounded-xl p-4 mb-6 mx-auto shadow-lg"
            >
              <div
                class="w-full h-full bg-gray-900 rounded-lg flex items-center justify-center relative overflow-hidden"
              >
                <!-- Simplified QR Code Pattern -->
                <div class="grid grid-cols-12 gap-0.5 w-full h-full p-2">
                  <div
                    v-for="i in 144"
                    :key="i"
                    :class="[
                      'aspect-square',
                      Math.random() > 0.5 ? 'bg-black' : 'bg-white',
                    ]"
                  ></div>
                </div>
                <div class="absolute inset-0 flex items-center justify-center">
                  <div
                    class="w-10 h-10 bg-white rounded-lg flex items-center justify-center"
                  >
                    <svg
                      class="w-6 h-6 text-gray-900"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <h3 class="font-semibold text-lg">Đăng nhập bằng Mã QR</h3>
            <p class="text-gray-300 text-sm max-w-xs mx-auto mt-2">
              Quét mã bằng ứng dụng Soty trên di động để đăng nhập nhanh.
            </p>
            <UButton
              variant="link"
              class="text-gray-400 text-xs mt-4 hover:text-gray-300"
            >
              Hoặc đăng nhập bằng mã bảo mật
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom animations */
@keyframes pulse-slow {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.1);
  }
}

@keyframes twinkle {
  0%,
  100% {
    opacity: 0.2;
  }
  50% {
    opacity: 0.8;
  }
}

.animate-pulse-slow {
  animation: pulse-slow 8s ease-in-out infinite;
}

.animate-twinkle {
  animation: twinkle 4s ease-in-out infinite;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(55, 65, 81, 0.2);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: rgba(99, 102, 241, 0.7);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(99, 102, 241, 1);
}

/* Hover effects for inputs */
input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3);
  transition: box-shadow 0.2s ease;
}
</style>
