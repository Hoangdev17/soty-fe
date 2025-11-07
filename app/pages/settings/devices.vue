<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuthStore } from "~/stores/auth/auth.store";
import type { Device } from "~/stores/auth/auth.type";

definePageMeta({
  middleware: ["required-auth"],
});

useHead({
  title: "Thiết bị đăng nhập | Soty",
  meta: [
    {
      name: "description",
      content: "Quản lý các thiết bị đã đăng nhập vào tài khoản của bạn.",
    },
  ],
});

const authStore = useAuthStore();
const devices = ref<Device[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const totalDevices = ref(0);

// Fetch device sessions
async function fetchDevices() {
  loading.value = true;
  error.value = null;

  try {
    const response = await authStore.getDeviceHistory();

    devices.value = response.devices;
    totalDevices.value = response.total;
  } catch (err) {
    console.error("Failed to fetch devices:", err);
    error.value = "Không thể tải danh sách thiết bị";
  } finally {
    loading.value = false;
  }
}

// Get device icon based on platform
function getDeviceIcon(platform: string) {
  switch (platform.toUpperCase()) {
    case "MOBILE":
      return "i-lucide-smartphone";
    case "TABLET":
      return "i-lucide-tablet";
    case "DESKTOP":
    default:
      return "i-lucide-monitor";
  }
}

// Get platform display name
function getPlatformName(platform: string) {
  switch (platform.toUpperCase()) {
    case "WEB":
      return "Trình duyệt Web";
    case "IOS":
      return "iOS";
    case "ANDROID":
      return "Android";
    case "DESKTOP":
    default:
      return "Máy tính";
  }
}

// Get device display name
function getDeviceName(device: Device): string {
  if (device.deviceModel && device.deviceVendor) {
    return `${device.deviceVendor} ${device.deviceModel}`;
  }
  if (device.deviceModel) {
    return device.deviceModel as string;
  }
  if (device.browser) {
    return device.browser as string;
  }
  return getPlatformName(device.platform);
}

// Format date
function formatDate(date: Date | null) {
  if (!date) return "Chưa xác định";

  const parsedDate = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - parsedDate.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;

  return parsedDate.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

onMounted(() => {
  fetchDevices();
});
</script>

<template>
  <div class="w-full max-w-4xl mx-auto p-6">
    <div class="flex flex-col gap-6">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-bold mb-2">Quản lý thiết bị</h1>
        <p class="text-gray-400">
          Xem và quản lý các thiết bị đã đăng nhập vào tài khoản của bạn
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"
        ></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <UIcon
          name="i-lucide-alert-circle"
          class="w-12 h-12 mx-auto mb-4 text-red-500"
        />
        <p class="text-red-500 mb-4">{{ error }}</p>
        <UButton @click="fetchDevices" color="primary"> Thử lại </UButton>
      </div>

      <!-- Devices List -->
      <div v-else class="space-y-4">
        <!-- Stats -->
        <div v-if="totalDevices > 0" class="text-sm text-gray-400">
          Tổng số: {{ totalDevices }} thiết bị
        </div>

        <!-- Device cards -->
        <div
          v-for="(device, index) in devices"
          :key="index"
          class="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
        >
          <div class="flex items-start gap-4">
            <!-- Device Icon -->
            <div
              class="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0"
            >
              <UIcon
                :name="getDeviceIcon(device.platform)"
                class="w-6 h-6 text-blue-400"
              />
            </div>

            <!-- Device Info -->
            <div class="flex-1 min-w-0">
              <h3 class="text-white font-semibold mb-2">
                {{ getDeviceName(device) }}
              </h3>

              <div class="space-y-1 text-sm text-gray-400">
                <div v-if="device.browser" class="flex items-center gap-2">
                  <UIcon name="i-lucide-globe" class="w-4 h-4 flex-shrink-0" />
                  <span
                    >{{ device.browser
                    }}<span v-if="device.browserVersion">
                      {{ device.browserVersion }}</span
                    ></span
                  >
                </div>
                <div v-if="device.os" class="flex items-center gap-2">
                  <UIcon
                    name="i-lucide-monitor"
                    class="w-4 h-4 flex-shrink-0"
                  />
                  <span
                    >{{ device.os
                    }}<span v-if="device.osVersion">
                      {{ device.osVersion }}</span
                    ></span
                  >
                </div>
                <div v-if="device.ip" class="flex items-center gap-2">
                  <UIcon
                    name="i-lucide-map-pin"
                    class="w-4 h-4 flex-shrink-0"
                  />
                  <span>{{ device.ip }}</span>
                </div>
                <div v-if="device.lastActiveAt" class="flex items-center gap-2">
                  <UIcon name="i-lucide-clock" class="w-4 h-4 flex-shrink-0" />
                  <span
                    >Hoạt động lần cuối:
                    {{ formatDate(device.lastActiveAt) }}</span
                  >
                </div>
                <div v-if="device.userAgent" class="flex items-center gap-2">
                  <UIcon name="i-lucide-info" class="w-4 h-4 flex-shrink-0" />
                  <span class="text-xs text-gray-500 truncate">{{
                    device.userAgent
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="devices.length === 0" class="text-center py-12">
          <UIcon
            name="i-lucide-monitor"
            class="w-16 h-16 mx-auto mb-4 text-gray-600"
          />
          <p class="text-gray-400">Không có lịch sử thiết bị</p>
        </div>
      </div>

      <!-- Security Notice -->
      <div class="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <UIcon
            name="i-lucide-shield-alert"
            class="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5"
          />
          <div class="flex-1">
            <h4 class="text-white font-medium mb-1">Lưu ý bảo mật</h4>
            <p class="text-sm text-gray-400">
              Nếu bạn thấy địa chỉ IP hoặc thiết bị không quen thuộc, hãy thay
              đổi mật khẩu ngay lập tức. Bạn cũng nên bật xác thực hai yếu tố để
              tăng cường bảo mật.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
