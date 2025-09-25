<script setup>
import ModalPayment from "~/components/organisms/modal.payment.vue";
import { ref } from "vue";
import ModalSuccess from "~/components/organisms/modal.success.vue";

definePageMeta({
  title: "Nitro Packages - Settings",
});

const showBasicNitro = ref(false);
const dataBasicNitro = {
  amount: 50000,
  content: "Nâng cấp gói Nitro Basic",
  nitroId: "361382101968228352",
  nitroAmount: 50000,
};
const showModalSuccess = ref(false);

const showProNitro = ref(false);
const dataProNitro = {
  amount: 100000,
  content: "Nâng cấp gói Nitro Pro",
  nitroId: "361382189968920576",
  nitroAmount: 100000,
};

function openProNitro() {
  showProNitro.value = true;
}

function openBasicNitro() {
  showBasicNitro.value = true;
  showModalSuccess.value = false; // Reset success modal
}
</script>

<template>
  <div class="min-h-screen bg-gray-900 p-6">
    <!-- Header Modal -->
    <div class="max-w-2xl mx-auto mb-8">
      <div
        class="relative rounded-3xl p-8 text-white overflow-hidden"
        style="
          background: linear-gradient(
            135deg,
            #5865f2 0%,
            #7289da 50%,
            #ff73fa 100%
          );
          border-radius: 20px;
        "
      >
        <!-- Stars decoration -->
        <div class="text-center">
          <h1 class="text-3xl font-bold mb-2">
            Mở Khóa Vô Vàn Đặc Quyền Cùng Nitro
          </h1>

          <div class="flex gap-3 justify-center mb-4">
            <UButton
              class="px-6 py-2 bg-opacity-20 rounded-full text-white border border-white border-opacity-30"
            >
              🔗 Đăng ký
            </UButton>
            <UButton
              class="px-6 py-2 rounded-full text-white"
              color="info"
              variant="solid"
            >
              🎁 Tặng Nitro
            </UButton>
          </div>

          <p class="text-sm opacity-80">
            Gói có giá chỉ từ 50.000 ₫/tháng. Hủy bất cứ lúc nào
          </p>
        </div>
      </div>
    </div>

    <!-- Pricing Cards -->
    <div class="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <!-- Nitro Basic Card -->
      <div
        class="rounded-2xl p-6 text-white relative overflow-hidden"
        style="background: linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)"
      >
        <div class="absolute top-4 right-4">
          <div
            class="w-16 h-16 bg-opacity-20 rounded-full flex items-center justify-center"
          >
            <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              ></path>
            </svg>
          </div>
        </div>

        <div class="mb-6">
          <h3 class="text-2xl font-bold mb-1">NITRO</h3>
          <p class="text-sm font-semibold mb-1">BASIC</p>
          <p class="text-xl font-bold">50.000₫ /tháng</p>
        </div>

        <div class="space-y-3 mb-6">
          <div class="flex items-center gap-3">
            <span class="text-2xl">📤</span>
            <span>50MB lượt tải lên</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-2xl">😊</span>
            <span>Emoji tùy chọn tại bất cứ đâu</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-2xl">🎨</span>
            <span>Biểu Cảm Siêu Cấp Không Giới Hạn</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-2xl">⚡</span>
            <span>2 Nâng Cấp Máy Chủ</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-2xl">🔗</span>
            <span>Huy hiệu Nitro đặc biệt trên trang cá nhân của bạn</span>
          </div>
        </div>

        <UButton
          class="w-full flex justify-center py-3 bg-opacity-20 rounded-lg text-white font-medium"
          color="info"
          variant="outline"
          @click="openBasicNitro()"
        >
          Đăng ký
        </UButton>
      </div>

      <!-- Nitro Card -->
      <div
        class="rounded-2xl p-6 text-white relative overflow-hidden"
        style="background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)"
      >
        <div class="absolute top-4 right-4">
          <div
            class="w-16 h-16 bg-opacity-20 rounded-full flex items-center justify-center"
          >
            <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              ></path>
            </svg>
          </div>
        </div>

        <div class="mb-6">
          <h3 class="text-2xl font-bold mb-1">NITRO</h3>
          <p class="text-xl font-bold">100.000 ₫ / tháng</p>
        </div>

        <div class="space-y-3 mb-6">
          <div class="flex items-center gap-3">
            <span class="text-2xl">📤</span>
            <span>500MB lượt tải lên</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-2xl">😊</span>
            <span>Emoji tùy chọn tại bất cứ đâu</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-2xl">🎨</span>
            <span>Biểu Cảm Siêu Cấp Không Giới Hạn</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-2xl">🎥</span>
            <span>Livestream ở độ phân giải HD</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-2xl">⚡</span>
            <span>4 Nâng Cấp Máy Chủ</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-2xl">👤</span>
            <span>Hồ sơ tùy chỉnh và hơn thế nữa!</span>
          </div>
        </div>

        <UButton
          class="w-full flex justify-center py-3 bg-opacity-90 rounded-lg text-purple-700 font-medium border border-purple-700"
          color="secondary"
          variant="outline"
          @click="openProNitro()"
        >
          Đăng ký
        </UButton>
      </div>
    </div>

    <!-- Features Section -->
    <!-- <div class="max-w-4xl mx-auto">
      <h2 class="text-2xl font-bold text-white text-center mb-8">
        Các đặc quyền Nitro yêu thích
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-gray-800 rounded-lg p-4 text-white">
          <img
            src="https://via.placeholder.com/300x200"
            alt="Feature 1"
            class="w-full h-40 object-cover rounded-lg mb-4"
          />
          <h3 class="font-semibold">Tính năng đặc biệt 1</h3>
        </div>
        <div class="bg-gray-800 rounded-lg p-4 text-white">
          <img
            src="https://via.placeholder.com/300x200"
            alt="Feature 2"
            class="w-full h-40 object-cover rounded-lg mb-4"
          />
          <h3 class="font-semibold">Tính năng đặc biệt 2</h3>
        </div>
      </div>
    </div> -->
  </div>

  <ModalPayment
    v-model:show="showBasicNitro"
    :amount="dataBasicNitro.amount"
    :content="dataBasicNitro.content"
    :nitroId="dataBasicNitro.nitroId"
    :nitroAmount="dataBasicNitro.nitroAmount"
    @close="showBasicNitro = false"
    @success="showModalSuccess = true"
  />
  <ModalSuccess v-model:show="showModalSuccess" />

  <ModalPayment
    v-model:show="showProNitro"
    :amount="dataProNitro.amount"
    :content="dataProNitro.content"
    :nitroId="dataProNitro.nitroId"
    :nitroAmount="dataProNitro.nitroAmount"
    @close="showProNitro = false"
  />
</template>
