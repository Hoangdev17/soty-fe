<script setup lang="ts">
import { reactive, computed, watch, ref, onBeforeUnmount } from "vue";

const props = defineProps<{
  show: boolean;
  amount: number;
  content: string;
  nitroId?: string;
  nitroAmount?: number;
}>();

const emit = defineEmits(["update:show", "close"]);

const open = computed({
  get: () => props.show,
  set: (val: boolean) => {
    emit("update:show", val);
    emit("close");
  },
});

const toast = useToast();

const isSuccessPayment = ref(false);
const isSubmitting = ref(false);

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

async function createQRCode(): Promise<void> {
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

// Tự động tạo QR khi mở modal
watch(
  () => props.show,
  (newValue) => {
    if (newValue) {
      createQRCode();
    }
  },
  { immediate: true }
);

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

export interface PaymentStatusResponse {
  success: boolean;
  status: "pending" | "completed" | "failed";
}

async function handleCompletePayment() {
  isSubmitting.value = true;

  try {
    const status = await fetchWithAuth<PaymentStatusResponse>(
      `/sepay/payment/${state.paymentId}/status`
    );

    toast.add({
      title: "Thanh toán thành công!",
      description: "Giao dịch của bạn đã được xử lý thành công.",
      color: "success",
    });
  } catch (error) {
    console.error("Error checking payment status:", error);
    toast.add({
      title: "Có lỗi xảy ra",
      description: "Cần thanh toán lại. Vui lòng thử lại hoặc liên hệ hỗ trợ.",
      color: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Thanh toán" prevent-close>
    <template v-if="!isSuccessPayment" #body>
      <div class="p-6">
        <!-- Loading State -->
        <div
          v-if="state.loading"
          class="flex flex-col items-center justify-center space-y-4"
        >
          <div
            class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"
          ></div>
          <p class="text-gray-600 dark:text-gray-400">Đang tạo mã QR...</p>
        </div>

        <!-- Payment Content -->
        <div v-else-if="state.qrCode" class="space-y-6">
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
              <UButton
                variant="solid"
                color="primary"
                :loading="isSubmitting"
                :disabled="isSubmitting"
                @click="handleCompletePayment"
              >
                Xác nhận chuyển khoản thành công
              </UButton>
            </div>
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
          Cảm ơn bạn đã thanh toán. Giao dịch của bạn đã được xử lý thành công.
        </p>
        <UButton variant="solid" color="primary" @click="open = false">
          Đóng
        </UButton>
      </div>
    </template>
  </UModal>
</template>
