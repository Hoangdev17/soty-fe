<script setup lang="ts">
import { reactive, computed, watch, ref, onBeforeUnmount } from "vue";

const props = defineProps<{
  show: boolean;
  amount: number; // Giá bằng tiền
  gemsRequired: number; // Số gems cần
  content: string;
  bootsId?: string;
}>();

const emit = defineEmits(["update:show", "close", "success"]);

const toast = useToast();

const isSuccessPayment = ref(false);
const isSubmitting = ref(false);
const paymentMethod = ref<"money" | "gems">("money"); // Mặc định thanh toán bằng tiền
const pollingInterval = ref<NodeJS.Timeout | null>(null);
const userGems = ref(0);

const state = reactive({
  loading: false,
  paymentId: "",
  qrCode: "",
  qrData: "",
  amount: 0,
  content: "",
  instructions: "",
  bankInfo: {
    accountName: "LUU VIET HOANG",
    bankName: "MB Bank",
    accountNumber: "0866609196",
    transferContent: "",
  },
});

const { fetchWithAuth } = useFetchWithAuth();

export interface CreatePaymentResponse {
  paymentId: string;
  qrCode: string;
  qrData: string;
  amount: number;
  content: string;
  instructions: string;
}

export interface UserDataResponse {
  gems: number;
}

async function fetchUserGems(): Promise<void> {
  try {
    const response = await fetchWithAuth<UserDataResponse>("/users/gems");
    userGems.value = response.gems;
  } catch (error) {
    console.error("Error fetching user gems:", error);
  }
}

async function createQRCode(): Promise<void> {
  if (paymentMethod.value !== "money") return;
  state.loading = true;
  try {
    const response = await fetchWithAuth<CreatePaymentResponse>(
      "/sepay/create-payment",
      {
        method: "POST",
        body: JSON.stringify({
          amount: props.amount,
          content: props.content,
        }),
      }
    );

    state.qrData = response.qrData;
    state.qrCode = response.qrCode;
    state.paymentId = response.paymentId;
    state.amount = response.amount;
    state.content = response.content;
    state.instructions = response.instructions;
    state.bankInfo.transferContent = props.content;
  } catch (error) {
    console.error("Error creating payment:", error);
  } finally {
    state.loading = false;
  }
}

// Tự động tạo QR khi mở modal và chọn phương thức tiền, bắt đầu polling nếu cần
watch(
  () => props.show,
  (newValue) => {
    if (newValue) {
      fetchUserGems();
      if (paymentMethod.value === "money") {
        createQRCode();
        startPolling();
      }
    } else {
      stopPolling();
      isSuccessPayment.value = false; // Reset khi đóng modal
      state.paymentId = "";
      state.qrCode = "";
      state.qrData = "";
      state.amount = 0;
      state.content = "";
      state.instructions = "";
      state.bankInfo.transferContent = "";
    }
  },
  { immediate: true }
);

// Watch thay đổi phương thức thanh toán
watch(
  () => paymentMethod.value,
  (newMethod) => {
    if (newMethod === "money" && props.show) {
      createQRCode();
      startPolling();
    } else {
      stopPolling();
    }
  }
);

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

export interface PaymentStatusResponse {
  success: boolean;
  status: "pending" | "completed" | "failed";
}

async function checkStatus(): Promise<void> {
  if (!state.paymentId || paymentMethod.value !== "money") return;
  try {
    const status = await fetchWithAuth<PaymentStatusResponse>(
      `/sepay/payment/${state.paymentId}/status`
    );
    if (status.status === "completed") {
      isSuccessPayment.value = true;
      emit("success", {
        paymentId: state.paymentId,
        amount: state.amount,
        content: state.content,
        bootsId: props.bootsId,
        method: "money",
      });
      stopPolling();
      toast.add({
        title: "Thanh toán thành công!",
        description: "Boots đã được thêm vào tài khoản của bạn.",
        color: "success",
      });
    }
  } catch (error) {
    console.error("Error checking payment status:", error);
  }
}

function startPolling(): void {
  if (pollingInterval.value || paymentMethod.value !== "money") return;
  pollingInterval.value = setInterval(checkStatus, 5000);
}

function stopPolling(): void {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value);
    pollingInterval.value = null;
  }
}

onBeforeUnmount(() => {
  stopPolling();
});

async function handlePayment() {
  isSubmitting.value = true;

  if (paymentMethod.value === "gems") {
    // Thanh toán bằng gems
    if (userGems.value < props.gemsRequired) {
      toast.add({
        title: "Không đủ Gems",
        description: "Bạn không có đủ Gems để mua Boots.",
        color: "error",
      });
      isSubmitting.value = false;
      return;
    }

    try {
      await fetchWithAuth(`/user/purchase-boots`, {
        method: "POST",
        body: JSON.stringify({
          bootsId: props.bootsId,
          gemsUsed: props.gemsRequired,
        }),
      });
      isSuccessPayment.value = true;
      emit("success", {
        bootsId: props.bootsId,
        gemsUsed: props.gemsRequired,
        method: "gems",
      });
      toast.add({
        title: "Mua thành công!",
        description: "Boots đã được thêm vào tài khoản của bạn.",
        color: "success",
      });
    } catch (error) {
      console.error("Error purchasing with gems:", error);
      toast.add({
        title: "Có lỗi xảy ra",
        description: "Không thể mua Boots. Vui lòng thử lại.",
        color: "error",
      });
    } finally {
      isSubmitting.value = false;
    }
  } else {
    // Thanh toán bằng tiền
    try {
      const status = await fetchWithAuth<PaymentStatusResponse>(
        `/sepay/payment/${state.paymentId}/status`
      );

      if (status.status === "completed") {
        isSuccessPayment.value = true;
        emit("success", {
          paymentId: state.paymentId,
          amount: state.amount,
          content: state.content,
          bootsId: props.bootsId,
          method: "money",
        });
        stopPolling();
        toast.add({
          title: "Thanh toán thành công!",
          description: "Boots đã được thêm vào tài khoản của bạn.",
          color: "success",
        });
      } else {
        toast.add({
          title: "Thanh toán chưa hoàn tất",
          description: "Vui lòng kiểm tra lại hoặc thử lại sau.",
          color: "warning",
        });
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
      toast.add({
        title: "Có lỗi xảy ra",
        description:
          "Cần thanh toán lại. Vui lòng thử lại hoặc liên hệ hỗ trợ.",
        color: "error",
      });
    } finally {
      isSubmitting.value = false;
    }
  }
}
</script>

<template>
  <UModal
    :open="props.show"
    title="Thanh toán Boots"
    @close="emit('update:show', false)"
    @update:open="emit('update:show', $event)"
  >
    <template v-if="!isSuccessPayment" #body>
      <div class="p-6">
        <!-- Chọn phương thức thanh toán -->
        <div class="mb-6">
          <h4 class="font-semibold mb-4">Chọn phương thức thanh toán</h4>
          <div class="flex flex-col space-y-2">
            <label class="flex items-center">
              <input
                v-model="paymentMethod"
                type="radio"
                value="money"
                class="mr-2"
              />
              Thanh toán bằng tiền ({{ props.amount.toLocaleString() }} VND)
            </label>
            <label class="flex items-center">
              <input
                v-model="paymentMethod"
                type="radio"
                value="gems"
                class="mr-2"
              />
              Dùng Gems ({{ props.gemsRequired }} Gems)
            </label>
          </div>
          <p v-if="paymentMethod === 'gems'" class="text-sm text-gray-600 mt-2">
            Gems hiện tại: {{ userGems }}
          </p>
        </div>

        <!-- Loading State -->
        <div
          v-if="state.loading && paymentMethod === 'money'"
          class="flex flex-col items-center justify-center space-y-4"
        >
          <div
            class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"
          ></div>
          <p class="text-gray-600 dark:text-gray-400">Đang tạo mã QR...</p>
        </div>

        <!-- Payment Content cho tiền -->
        <div
          v-else-if="state.qrCode && paymentMethod === 'money'"
          class="space-y-6"
        >
          <!-- QR Code Display -->
          <div class="flex justify-center">
            <div class="bg-white p-4 rounded-lg shadow-lg">
              <img
                :src="state.qrData"
                alt="QR Code"
                class="w-64 h-64 object-contain"
              />
            </div>
          </div>

          <!-- Payment Information -->
          <div class="space-y-4">
            <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 class="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                Thông tin chuyển khoản
              </h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Số tiền:</span>
                  <div class="flex items-center space-x-2">
                    <span class="font-semibold text-blue-600"
                      >{{ state.amount.toLocaleString() }} VND</span
                    >
                    <UButton
                      size="xs"
                      variant="ghost"
                      @click="copyToClipboard(state.amount.toString())"
                      icon="i-heroicons-clipboard-document-list"
                    />
                  </div>
                </div>

                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400"
                    >Nội dung CK:</span
                  >
                  <div class="flex items-center space-x-2">
                    <span class="font-semibold">{{ state.content }}</span>
                    <UButton
                      size="xs"
                      variant="ghost"
                      @click="copyToClipboard(state.content)"
                      icon="i-heroicons-clipboard-document-list"
                    />
                  </div>
                </div>

                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Tên TK:</span>
                  <div class="flex items-center space-x-2">
                    <span class="font-semibold">{{
                      state.bankInfo.accountName
                    }}</span>
                    <UButton
                      size="xs"
                      variant="ghost"
                      @click="copyToClipboard(state.bankInfo.accountName)"
                      icon="i-heroicons-clipboard-document-list"
                    />
                  </div>
                </div>

                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400"
                    >Ngân hàng:</span
                  >
                  <span class="font-semibold">{{
                    state.bankInfo.bankName
                  }}</span>
                </div>

                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Số TK:</span>
                  <div class="flex items-center space-x-2">
                    <span class="font-semibold">{{
                      state.bankInfo.accountNumber
                    }}</span>
                    <UButton
                      size="xs"
                      variant="ghost"
                      @click="copyToClipboard(state.bankInfo.accountNumber)"
                      icon="i-heroicons-clipboard-document-list"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Instructions -->
            <div
              v-if="state.instructions"
              class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg"
            >
              <h4
                class="font-semibold text-yellow-800 dark:text-yellow-200 mb-2"
              >
                Hướng dẫn thanh toán
              </h4>
              <p class="text-sm text-yellow-700 dark:text-yellow-300">
                {{ state.instructions }}
              </p>
            </div>

            <!-- Quick Actions -->
            <div class="flex justify-end space-x-2">
              <UButton variant="outline" @click="emit('update:show', false)">
                Hủy
              </UButton>
              <UButton
                variant="solid"
                color="primary"
                :loading="isSubmitting"
                :disabled="isSubmitting"
                @click="handlePayment"
              >
                Xác nhận thanh toán
              </UButton>
            </div>
          </div>
        </div>

        <!-- Content cho gems -->
        <div v-else-if="paymentMethod === 'gems'" class="space-y-6">
          <div class="text-center">
            <p class="text-lg">
              Bạn có chắc muốn mua Boots này bằng {{ props.gemsRequired }} Gems?
            </p>
            <p class="text-sm text-gray-600 mt-2">
              Gems hiện tại: {{ userGems }}
            </p>
          </div>

          <div class="flex justify-end space-x-2">
            <UButton variant="outline" @click="emit('update:show', false)">
              Hủy
            </UButton>
            <UButton
              variant="solid"
              color="primary"
              :loading="isSubmitting"
              :disabled="isSubmitting"
              @click="handlePayment"
            >
              Xác nhận mua
            </UButton>
          </div>
        </div>

        <!-- Error State -->
        <div v-else class="flex flex-col items-center justify-center space-y-4">
          <div class="text-red-500">
            <svg
              class="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
          <p class="text-gray-600 dark:text-gray-400">
            Có lỗi khi tạo mã thanh toán
          </p>
          <UButton @click="createQRCode" variant="outline"> Thử lại </UButton>
        </div>
      </div>
    </template>

    <template v-else #body>
      <div class="p-6 flex flex-col items-center justify-center space-y-4">
        <div class="text-green-500">
          <svg
            class="w-12 h-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Thanh toán thành công!
        </h3>
        <p class="text-gray-600 dark:text-gray-400 text-center">
          Boots đã được thêm vào tài khoản của bạn.
        </p>
        <UButton
          variant="solid"
          color="primary"
          @click="emit('update:show', false)"
        >
          Đóng
        </UButton>
      </div>
    </template>
  </UModal>
</template>
