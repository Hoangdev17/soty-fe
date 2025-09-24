<script setup lang="ts">
import ModalBootsPayment from "~/components/organisms/modal.boots.payment.vue";

definePageMeta({
  title: "Boots - Community",
  layout: "community-layout",
});

const showPaymentBasicModal = ref(false);

function openPaymentBasicModal() {
  showPaymentBasicModal.value = true;
}

const dataBasic = {
  bootsId: "361386782484336640",
  amount: 50000,
  gemsRequired: 2,
  content: "Nâng cấp gói Basic",
};
</script>

<template>
  <div
    class="channel-header flex items-center px-4 py-3 bg-dark-800 border-b border-[#202225] sticky top-0 z-10"
  >
    <div class="flex items-center space-x-2">
      <svg
        aria-hidden="true"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          fill="#bb5cbe"
          d="M11.65 6.35 9.29 8.71a1 1 0 0 0-.29.7v5.18c0 .26.1.52.3.7l2.35 2.36c.2.2.5.2.7 0l2.36-2.36a1 1 0 0 0 .29-.7V9.4a1 1 0 0 0-.3-.7l-2.35-2.36a.5.5 0 0 0-.7 0Z"
          class=""
        ></path>
        <path
          fill="#bb5cbe"
          fill-rule="evenodd"
          d="M10.95 1.4a1.59 1.59 0 0 1 2.1 0l4.9 4A3.37 3.37 0 0 1 19 8v8c0 1.07-.4 2.06-1.05 2.6l-4.9 4c-.65.53-1.45.53-2.1 0l-4.9-4A3.37 3.37 0 0 1 5 16V8c0-1.07.4-2.06 1.05-2.6l4.9-4ZM7.32 6.95 12 3.12l4.68 3.83c.07.06.32.4.32 1.05v8c0 .65-.25 1-.32 1.05L12 20.88l-4.68-3.83C7.25 16.99 7 16.65 7 16V8c0-.65.25-1 .32-1.05Z"
          clip-rule="evenodd"
          class=""
        ></path>
      </svg>
      <h1 class="text-lg font-semibold text-white">Nâng cấp máy chủ</h1>
    </div>
  </div>

  <main class="page-content">
    <div class="flex gap-4">
      <!-- Left: nội dung chính, chiếm phần còn lại -->
      <div class="flex-1 min-w-0">
        <!-- Nội dung chính ở đây -->
        <div class="p-6">
          <div class="mb-6">
            <h2 class="text-2xl font-bold text-white mb-2">Nâng cấp máy chủ</h2>
            <p class="text-gray-400">
              Chọn gói nâng cấp phù hợp để cải thiện hiệu năng máy chủ của bạn.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Gói Basic -->
            <div
              class="bg-gray-800 border border-[#292b2f] rounded-lg p-6 hover:border-[#8a4fb8] transition-colors group"
            >
              <div class="flex items-center mb-4">
                <svg
                  aria-hidden="true"
                  role="img"
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#bb5cbe"
                    d="M11.65 6.35 9.29 8.71a1 1 0 0 0-.29.7v5.18c0 .26.1.52.3.7l2.35 2.36c.2.2.5.2.7 0l2.36-2.36a1 1 0 0 0 .29-.7V9.4a1 1 0 0 0-.3-.7l-2.35-2.36a.5.5 0 0 0-.7 0Z"
                    class=""
                  ></path>
                  <path
                    fill="#bb5cbe"
                    fill-rule="evenodd"
                    d="M10.95 1.4a1.59 1.59 0 0 1 2.1 0l4.9 4A3.37 3.37 0 0 1 19 8v8c0 1.07-.4 2.06-1.05 2.6l-4.9 4c-.65.53-1.45.53-2.1 0l-4.9-4A3.37 3.37 0 0 1 5 16V8c0-1.07.4-2.06 1.05-2.6l4.9-4ZM7.32 6.95 12 3.12l4.68 3.83c.07.06.32.4.32 1.05v8c0 .65-.25 1-.32 1.05L12 20.88l-4.68-3.83C7.25 16.99 7 16.65 7 16V8c0-.65.25-1 .32-1.05Z"
                    clip-rule="evenodd"
                    class=""
                  ></path>
                </svg>
                <h3 class="text-lg font-semibold text-white">Basic</h3>
              </div>
              <p class="text-gray-400 text-sm mb-4">
                Phù hợp cho cộng đồng nhỏ với tối đa 100 thành viên.
              </p>
              <ul class="text-sm text-gray-300 mb-6 space-y-1">
                <li>
                  <UIcon name="i-lucide-smile" class="mt-2" />
                  <span class="ml-1">100 Ô Emoji</span>
                </li>
                <li class="flex items-center">
                  <svg
                    aria-hidden="true"
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="#6b7280"
                      d="M14.24 1.03a1 1 0 0 1 .73 1.21l-1 4a1 1 0 0 1-1.94-.48l1-4a1 1 0 0 1 1.21-.73ZM20.7 4.7a1 1 0 0 0-1.4-1.4l-4 4a1 1 0 0 0 1.4 1.4l4-4Z"
                      class=""
                    ></path>
                    <path
                      fill="#6b7280"
                      fill-rule="evenodd"
                      d="M15.14 20.14c1.78-1.78.7-5.75-2.42-8.86-3.11-3.12-7.08-4.2-8.86-2.42A3.13 3.13 0 0 0 3 11V11l-1.16 8.92a2 2 0 0 0 2.24 2.24L13 21c.86-.04 1.6-.32 2.14-.86Zm-1.3-3.4a9.61 9.61 0 0 0-2.53-4.05 9.61 9.61 0 0 0-4.05-2.53c-1.27-.35-1.82-.05-1.99.11-.16.17-.46.72-.11 2a9.61 9.61 0 0 0 2.53 4.04 9.61 9.61 0 0 0 4.05 2.53c1.27.35 1.82.05 1.99-.11.16-.17.46-.72.11-2Z"
                      clip-rule="evenodd"
                      class=""
                    ></path>
                    <path
                      fill="#6b7280"
                      d="M7.05 3.32a1 1 0 0 1 1.9-.64l1 3a1 1 0 1 1-1.9.64l-1-3ZM22.97 9.76a1 1 0 0 0-1.21-.73l-4 1a1 1 0 1 0 .48 1.94l4-1a1 1 0 0 0 .73-1.21ZM20.68 16.95a1 1 0 0 0 .64-1.9l-3-1a1 1 0 0 0-.64 1.9l3 1Z"
                      class=""
                    ></path>
                  </svg>
                  <span class="ml-1">24 ô biểu cảm tiếng</span>
                </li>
                <li class="flex items-center">
                  <svg
                    aria-hidden="true"
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="#6b7280"
                      fill-rule="evenodd"
                      d="M5 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V5a3 3 0 0 0-3-3H5Zm2.18 13.87a2.9 2.9 0 0 1-1.66-.49 3.18 3.18 0 0 1-1.12-1.35A4.88 4.88 0 0 1 4 12c0-.75.14-1.42.42-2 .29-.59.7-1.04 1.24-1.37a3.7 3.7 0 0 1 1.95-.5c.64 0 1.21.14 1.72.4.5.28.89.67 1.15 1.16l-1.22.88a1.76 1.76 0 0 0-1.64-1.02c-.66 0-1.17.22-1.52.65a2.74 2.74 0 0 0-.53 1.8c0 .78.18 1.39.53 1.81.35.42.86.64 1.52.64.3 0 .57-.06.81-.16.25-.12.45-.27.58-.47v-.93H7.3v-1.4h3.24v4.23H9.27l-.2-.71c-.43.57-1.06.86-1.89.86Zm6.34-.15h-1.57V8.28h1.57v7.44Zm1.51 0h1.57v-2.83h2.76v-1.42H16.6V9.7H20V8.28h-4.97v7.44Z"
                      clip-rule="evenodd"
                      class=""
                    ></path>
                  </svg>
                  <span>Biểu tượng máy chủ động</span>
                </li>
                <li class="flex items-center">
                  <UIcon name="i-lucide-volume-2" class="mt-2" />
                  <span class="ml-1">Chất lượng âm thanh cao hơn</span>
                </li>
                <li>
                  <span class="text-sm text-gray-500"
                    >...và thêm nhiều tính năng khác nữa</span
                  >
                </li>
              </ul>
              <div class="relative">
                <span
                  class="flex text-2xl font-bold text-white opacity-100 group-hover:opacity-0 transition-opacity pb-3"
                >
                  <svg
                    aria-hidden="true"
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    fill="none"
                    viewBox="0 0 24 24"
                    class="mt-1.5"
                  >
                    <path
                      fill="#bb5cbe"
                      d="M11.65 6.35 9.29 8.71a1 1 0 0 0-.29.7v5.18c0 .26.1.52.3.7l2.35 2.36c.2.2.5.2.7 0l2.36-2.36a1 1 0 0 0 .29-.7V9.4a1 1 0 0 0-.3-.7l-2.35-2.36a.5.5 0 0 0-.7 0Z"
                      class=""
                    ></path>
                    <path
                      fill="#bb5cbe"
                      fill-rule="evenodd"
                      d="M10.95 1.4a1.59 1.59 0 0 1 2.1 0l4.9 4A3.37 3.37 0 0 1 19 8v8c0 1.07-.4 2.06-1.05 2.6l-4.9 4c-.65.53-1.45.53-2.1 0l-4.9-4A3.37 3.37 0 0 1 5 16V8c0-1.07.4-2.06 1.05-2.6l4.9-4ZM7.32 6.95 12 3.12l4.68 3.83c.07.06.32.4.32 1.05v8c0 .65-.25 1-.32 1.05L12 20.88l-4.68-3.83C7.25 16.99 7 16.65 7 16V8c0-.65.25-1 .32-1.05Z"
                      clip-rule="evenodd"
                      class=""
                    ></path>
                  </svg>
                  <span class="text-sm text-gray-500 mt-1">2 Nâng Cấp</span>
                </span>
                <UButton
                  class="flex items-center justify-center absolute inset-0 px-4 py-2 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-center gap-1"
                  variant="outline"
                  @click="openPaymentBasicModal()"
                >
                  <span>Bật</span
                  ><span class="text-sm text-gray-500 ml-2 mb-0.5">2</span>
                  <svg
                    aria-hidden="true"
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="#bb5cbe"
                      d="M11.65 6.35 9.29 8.71a1 1 0 0 0-.29.7v5.18c0 .26.1.52.3.7l2.35 2.36c.2.2.5.2.7 0l2.36-2.36a1 1 0 0 0 .29-.7V9.4a1 1 0 0 0-.3-.7l-2.35-2.36a.5.5 0 0 0-.7 0Z"
                      class=""
                    ></path>
                    <path
                      fill="#bb5cbe"
                      fill-rule="evenodd"
                      d="M10.95 1.4a1.59 1.59 0 0 1 2.1 0l4.9 4A3.37 3.37 0 0 1 19 8v8c0 1.07-.4 2.06-1.05 2.6l-4.9 4c-.65.53-1.45.53-2.1 0l-4.9-4A3.37 3.37 0 0 1 5 16V8c0-1.07.4-2.06 1.05-2.6l4.9-4ZM7.32 6.95 12 3.12l4.68 3.83c.07.06.32.4.32 1.05v8c0 .65-.25 1-.32 1.05L12 20.88l-4.68-3.83C7.25 16.99 7 16.65 7 16V8c0-.65.25-1 .32-1.05Z"
                      clip-rule="evenodd"
                      class=""
                    ></path>
                  </svg>
                </UButton>
              </div>
            </div>

            <!-- Gói Pro -->
            <div
              class="bg-gray-800 border border-[#292b2f] rounded-lg p-6 hover:border-[#8a4fb8] transition-colors group"
            >
              <div class="flex items-center mb-4">
                <svg
                  aria-hidden="true"
                  role="img"
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#bb5cbe"
                    d="M11.65 6.35 9.29 8.71a1 1 0 0 0-.29.7v5.18c0 .26.1.52.3.7l2.35 2.36c.2.2.5.2.7 0l2.36-2.36a1 1 0 0 0 .29-.7V9.4a1 1 0 0 0-.3-.7l-2.35-2.36a.5.5 0 0 0-.7 0Z"
                    class=""
                  ></path>
                  <path
                    fill="#bb5cbe"
                    fill-rule="evenodd"
                    d="M10.95 1.4a1.59 1.59 0 0 1 2.1 0l4.9 4A3.37 3.37 0 0 1 19 8v8c0 1.07-.4 2.06-1.05 2.6l-4.9 4c-.65.53-1.45.53-2.1 0l-4.9-4A3.37 3.37 0 0 1 5 16V8c0-1.07.4-2.06 1.05-2.6l4.9-4ZM7.32 6.95 12 3.12l4.68 3.83c.07.06.32.4.32 1.05v8c0 .65-.25 1-.32 1.05L12 20.88l-4.68-3.83C7.25 16.99 7 16.65 7 16V8c0-.65.25-1 .32-1.05Z"
                    clip-rule="evenodd"
                    class=""
                  ></path>
                </svg>
                <h3 class="text-lg font-semibold text-white">Pro</h3>
                <span
                  class="ml-2 px-2 py-1 bg-[#8a4fb8] text-xs text-white rounded"
                  >Phổ biến</span
                >
              </div>
              <p class="text-gray-400 text-sm mb-4">
                Lý tưởng cho cộng đồng trung bình với tối đa 500 thành viên.
              </p>
              <ul class="text-sm text-gray-300 mb-6 space-y-1">
                <li>
                  <UIcon name="i-lucide-monitor-up" class="mt-2" />
                  <span class="ml-1">Stream video HD</span>
                </li>
                <li class="flex items-center">
                  <UIcon name="i-lucide-upload" />
                  <span class="ml-1">Dung lượng tải lên đến 50MB</span>
                </li>
                <li class="flex items-center">
                  <UIcon name="i-lucide-smile" class="mt-2" />
                  <span>Tùy biến biểu tượng vai trò</span>
                </li>
                <li class="flex items-center">
                  <UIcon name="i-lucide-closed-caption" />
                  <span class="ml-1">Biểu ngữ máy chủ</span>
                </li>
                <li>
                  <span class="text-sm text-gray-500"
                    >...và thêm nhiều tính năng khác nữa</span
                  >
                </li>
              </ul>
              <div class="relative">
                <span
                  class="flex text-2xl font-bold text-white opacity-100 group-hover:opacity-0 transition-opacity pb-3"
                >
                  <svg
                    aria-hidden="true"
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    fill="none"
                    viewBox="0 0 24 24"
                    class="mt-1.5"
                  >
                    <path
                      fill="#bb5cbe"
                      d="M11.65 6.35 9.29 8.71a1 1 0 0 0-.29.7v5.18c0 .26.1.52.3.7l2.35 2.36c.2.2.5.2.7 0l2.36-2.36a1 1 0 0 0 .29-.7V9.4a1 1 0 0 0-.3-.7l-2.35-2.36a.5.5 0 0 0-.7 0Z"
                      class=""
                    ></path>
                    <path
                      fill="#bb5cbe"
                      fill-rule="evenodd"
                      d="M10.95 1.4a1.59 1.59 0 0 1 2.1 0l4.9 4A3.37 3.37 0 0 1 19 8v8c0 1.07-.4 2.06-1.05 2.6l-4.9 4c-.65.53-1.45.53-2.1 0l-4.9-4A3.37 3.37 0 0 1 5 16V8c0-1.07.4-2.06 1.05-2.6l4.9-4ZM7.32 6.95 12 3.12l4.68 3.83c.07.06.32.4.32 1.05v8c0 .65-.25 1-.32 1.05L12 20.88l-4.68-3.83C7.25 16.99 7 16.65 7 16V8c0-.65.25-1 .32-1.05Z"
                      clip-rule="evenodd"
                      class=""
                    ></path>
                  </svg>
                  <span class="text-sm text-gray-500 mt-1">5 Nâng Cấp</span>
                </span>
                <UButton
                  class="flex items-center justify-center absolute inset-0 px-4 py-2 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-center gap-1"
                  variant="outline"
                >
                  <span>Bật</span
                  ><span class="text-sm text-gray-500 ml-2 mb-0.5">5</span>
                  <svg
                    aria-hidden="true"
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="#bb5cbe"
                      d="M11.65 6.35 9.29 8.71a1 1 0 0 0-.29.7v5.18c0 .26.1.52.3.7l2.35 2.36c.2.2.5.2.7 0l2.36-2.36a1 1 0 0 0 .29-.7V9.4a1 1 0 0 0-.3-.7l-2.35-2.36a.5.5 0 0 0-.7 0Z"
                      class=""
                    ></path>
                    <path
                      fill="#bb5cbe"
                      fill-rule="evenodd"
                      d="M10.95 1.4a1.59 1.59 0 0 1 2.1 0l4.9 4A3.37 3.37 0 0 1 19 8v8c0 1.07-.4 2.06-1.05 2.6l-4.9 4c-.65.53-1.45.53-2.1 0l-4.9-4A3.37 3.37 0 0 1 5 16V8c0-1.07.4-2.06 1.05-2.6l4.9-4ZM7.32 6.95 12 3.12l4.68 3.83c.07.06.32.4.32 1.05v8c0 .65-.25 1-.32 1.05L12 20.88l-4.68-3.83C7.25 16.99 7 16.65 7 16V8c0-.65.25-1 .32-1.05Z"
                      clip-rule="evenodd"
                      class=""
                    ></path>
                  </svg>
                </UButton>
              </div>
            </div>

            <!-- Gói Premium -->
            <div
              class="bg-gray-800 border border-[#292b2f] rounded-lg p-6 hover:border-[#8a4fb8] transition-colors group"
            >
              <div class="flex items-center mb-4">
                <svg
                  aria-hidden="true"
                  role="img"
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#bb5cbe"
                    d="M11.65 6.35 9.29 8.71a1 1 0 0 0-.29.7v5.18c0 .26.1.52.3.7l2.35 2.36c.2.2.5.2.7 0l2.36-2.36a1 1 0 0 0 .29-.7V9.4a1 1 0 0 0-.3-.7l-2.35-2.36a.5.5 0 0 0-.7 0Z"
                    class=""
                  ></path>
                  <path
                    fill="#bb5cbe"
                    fill-rule="evenodd"
                    d="M10.95 1.4a1.59 1.59 0 0 1 2.1 0l4.9 4A3.37 3.37 0 0 1 19 8v8c0 1.07-.4 2.06-1.05 2.6l-4.9 4c-.65.53-1.45.53-2.1 0l-4.9-4A3.37 3.37 0 0 1 5 16V8c0-1.07.4-2.06 1.05-2.6l4.9-4ZM7.32 6.95 12 3.12l4.68 3.83c.07.06.32.4.32 1.05v8c0 .65-.25 1-.32 1.05L12 20.88l-4.68-3.83C7.25 16.99 7 16.65 7 16V8c0-.65.25-1 .32-1.05Z"
                    clip-rule="evenodd"
                    class=""
                  ></path>
                </svg>
                <h3 class="text-lg font-semibold text-white">Premium</h3>
              </div>
              <p class="text-gray-400 text-sm mb-4">
                Hoàn hảo cho cộng đồng lớn với không giới hạn thành viên.
              </p>
              <ul class="text-sm text-gray-300 mb-6 space-y-1">
                <li>
                  <UIcon name="i-lucide-monitor-up" class="mt-2" />
                  <span class="ml-1">Stream video 4K</span>
                </li>
                <li class="flex items-center">
                  <UIcon name="i-lucide-upload" />
                  <span class="ml-1">Dung lượng tải không giới hạn</span>
                </li>
                <li class="flex items-center">
                  <UIcon name="i-lucide-smile" class="mt-2" />
                  <span>Tùy biến biểu tượng vai trò</span>
                </li>
                <li class="flex items-center">
                  <UIcon name="i-lucide-closed-caption" />
                  <span class="ml-1">Biểu ngữ máy chủ</span>
                </li>
                <li>
                  <span class="text-sm text-gray-500"
                    >...và thêm nhiều tính năng khác nữa</span
                  >
                </li>
              </ul>
              <div class="relative">
                <span
                  class="flex text-2xl font-bold text-white opacity-100 group-hover:opacity-0 transition-opacity pb-3"
                >
                  <svg
                    aria-hidden="true"
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    fill="none"
                    viewBox="0 0 24 24"
                    class="mt-1.5"
                  >
                    <path
                      fill="#bb5cbe"
                      d="M11.65 6.35 9.29 8.71a1 1 0 0 0-.29.7v5.18c0 .26.1.52.3.7l2.35 2.36c.2.2.5.2.7 0l2.36-2.36a1 1 0 0 0 .29-.7V9.4a1 1 0 0 0-.3-.7l-2.35-2.36a.5.5 0 0 0-.7 0Z"
                      class=""
                    ></path>
                    <path
                      fill="#bb5cbe"
                      fill-rule="evenodd"
                      d="M10.95 1.4a1.59 1.59 0 0 1 2.1 0l4.9 4A3.37 3.37 0 0 1 19 8v8c0 1.07-.4 2.06-1.05 2.6l-4.9 4c-.65.53-1.45.53-2.1 0l-4.9-4A3.37 3.37 0 0 1 5 16V8c0-1.07.4-2.06 1.05-2.6l4.9-4ZM7.32 6.95 12 3.12l4.68 3.83c.07.06.32.4.32 1.05v8c0 .65-.25 1-.32 1.05L12 20.88l-4.68-3.83C7.25 16.99 7 16.65 7 16V8c0-.65.25-1 .32-1.05Z"
                      clip-rule="evenodd"
                      class=""
                    ></path>
                  </svg>
                  <span class="text-sm text-gray-500 mt-1">7 Nâng Cấp</span>
                </span>
                <UButton
                  class="flex items-center justify-center absolute inset-0 px-4 py-2 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-center gap-1"
                  variant="outline"
                >
                  <span>Bật</span
                  ><span class="text-sm text-gray-500 ml-2 mb-0.5">7</span>
                  <svg
                    aria-hidden="true"
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="#bb5cbe"
                      d="M11.65 6.35 9.29 8.71a1 1 0 0 0-.29.7v5.18c0 .26.1.52.3.7l2.35 2.36c.2.2.5.2.7 0l2.36-2.36a1 1 0 0 0 .29-.7V9.4a1 1 0 0 0-.3-.7l-2.35-2.36a.5.5 0 0 0-.7 0Z"
                      class=""
                    ></path>
                    <path
                      fill="#bb5cbe"
                      fill-rule="evenodd"
                      d="M10.95 1.4a1.59 1.59 0 0 1 2.1 0l4.9 4A3.37 3.37 0 0 1 19 8v8c0 1.07-.4 2.06-1.05 2.6l-4.9 4c-.65.53-1.45.53-2.1 0l-4.9-4A3.37 3.37 0 0 1 5 16V8c0-1.07.4-2.06 1.05-2.6l4.9-4ZM7.32 6.95 12 3.12l4.68 3.83c.07.06.32.4.32 1.05v8c0 .65-.25 1-.32 1.05L12 20.88l-4.68-3.83C7.25 16.99 7 16.65 7 16V8c0-.65.25-1 .32-1.05Z"
                      clip-rule="evenodd"
                      class=""
                    ></path>
                  </svg>
                </UButton>
              </div>
            </div>
          </div>

          <div class="mt-8 p-4 bg-gray-900 rounded-lg">
            <h4 class="text-lg font-semibold text-white mb-2">
              Lưu ý quan trọng
            </h4>
            <ul class="text-sm text-gray-400 space-y-1">
              <li>
                • Nâng cấp sẽ có hiệu lực ngay lập tức sau khi thanh toán.
              </li>
              <li>
                • Bạn có thể hạ cấp gói bất cứ lúc nào, nhưng không được hoàn
                tiền.
              </li>
              <li>• Liên hệ hỗ trợ nếu gặp vấn đề kỹ thuật.</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Right: sidebar nhỏ, không co lại -->
      <aside class="w-80 flex-shrink-0">
        <div class="flex justify-between mt-3">
          <p class="text-xs text-gray-300 leading-tight truncate">
            NÂNG CẤP MÁY CHỦ
          </p>
          <a
            href=""
            class="text-xs text-blue-400 hover:text-blue-300 hover:underline"
            >Tìm hiểu thêm</a
          >
        </div>

        <div class="flex flex-col mt-4">
          <div class="mt-4 grid grid-cols-3 gap-2">
            <div
              class="bg-gray-800 border border-[#292b2f] rounded p-3 text-center text-xs text-gray-200 truncate"
            >
              <div class="flex justify-center items-center">
                <svg
                  aria-hidden="true"
                  role="img"
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#bb5cbe"
                    d="M11.65 6.35 9.29 8.71a1 1 0 0 0-.29.7v5.18c0 .26.1.52.3.7l2.35 2.36c.2.2.5.2.7 0l2.36-2.36a1 1 0 0 0 .29-.7V9.4a1 1 0 0 0-.3-.7l-2.35-2.36a.5.5 0 0 0-.7 0Z"
                    class=""
                  ></path>
                  <path
                    fill="#bb5cbe"
                    fill-rule="evenodd"
                    d="M10.95 1.4a1.59 1.59 0 0 1 2.1 0l4.9 4A3.37 3.37 0 0 1 19 8v8c0 1.07-.4 2.06-1.05 2.6l-4.9 4c-.65.53-1.45.53-2.1 0l-4.9-4A3.37 3.37 0 0 1 5 16V8c0-1.07.4-2.06 1.05-2.6l4.9-4ZM7.32 6.95 12 3.12l4.68 3.83c.07.06.32.4.32 1.05v8c0 .65-.25 1-.32 1.05L12 20.88l-4.68-3.83C7.25 16.99 7 16.65 7 16V8c0-.65.25-1 .32-1.05Z"
                    clip-rule="evenodd"
                    class=""
                  ></path>
                </svg>
                <span class="text-xl font-medium ml-1">0</span>
              </div>

              <p>Khả dụng</p>
            </div>
            <div
              class="bg-gray-800 border border-[#292b2f] rounded p-3 text-center text-xs text-gray-200 truncate"
            >
              <div class="flex justify-center items-center">
                <svg
                  aria-hidden="true"
                  role="img"
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#6b7280"
                    d="M11.65 6.35 9.29 8.71a1 1 0 0 0-.29.7v5.18c0 .26.1.52.3.7l2.35 2.36c.2.2.5.2.7 0l2.36-2.36a1 1 0 0 0 .29-.7V9.4a1 1 0 0 0-.3-.7l-2.35-2.36a.5.5 0 0 0-.7 0Z"
                    class=""
                  ></path>
                  <path
                    fill="#6b7280"
                    fill-rule="evenodd"
                    d="M10.95 1.4a1.59 1.59 0 0 1 2.1 0l4.9 4A3.37 3.37 0 0 1 19 8v8c0 1.07-.4 2.06-1.05 2.6l-4.9 4c-.65.53-1.45.53-2.1 0l-4.9-4A3.37 3.37 0 0 1 5 16V8c0-1.07.4-2.06 1.05-2.6l4.9-4ZM7.32 6.95 12 3.12l4.68 3.83c.07.06.32.4.32 1.05v8c0 .65-.25 1-.32 1.05L12 20.88l-4.68-3.83C7.25 16.99 7 16.65 7 16V8c0-.65.25-1 .32-1.05Z"
                    clip-rule="evenodd"
                    class=""
                  ></path>
                </svg>
                <span class="text-xl font-medium ml-1">0</span>
              </div>

              <p>Đã dùng</p>
            </div>
            <div
              class="bg-gray-800 border border-[#292b2f] rounded p-3 text-center text-xs text-gray-200 truncate"
            >
              <div class="flex justify-center items-center">
                <svg
                  aria-hidden="true"
                  role="img"
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#6b7280"
                    d="M11.65 6.35 9.29 8.71a1 1 0 0 0-.29.7v5.18c0 .26.1.52.3.7l2.35 2.36c.2.2.5.2.7 0l2.36-2.36a1 1 0 0 0 .29-.7V9.4a1 1 0 0 0-.3-.7l-2.35-2.36a.5.5 0 0 0-.7 0Z"
                    class=""
                  ></path>
                  <path
                    fill="#6b7280"
                    fill-rule="evenodd"
                    d="M10.95 1.4a1.59 1.59 0 0 1 2.1 0l4.9 4A3.37 3.37 0 0 1 19 8v8c0 1.07-.4 2.06-1.05 2.6l-4.9 4c-.65.53-1.45.53-2.1 0l-4.9-4A3.37 3.37 0 0 1 5 16V8c0-1.07.4-2.06 1.05-2.6l4.9-4ZM7.32 6.95 12 3.12l4.68 3.83c.07.06.32.4.32 1.05v8c0 .65-.25 1-.32 1.05L12 20.88l-4.68-3.83C7.25 16.99 7 16.65 7 16V8c0-.65.25-1 .32-1.05Z"
                    clip-rule="evenodd"
                    class=""
                  ></path>
                </svg>
                <span class="text-xl font-medium ml-1">0</span>
              </div>

              <p>Tổng</p>
            </div>
          </div>

          <div class="mt-4">
            <button
              class="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 hover:border-gray-500 transition-colors"
            >
              <svg
                aria-hidden="true"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  fill="#bb5cbe"
                  d="M11.65 6.35 9.29 8.71a1 1 0 0 0-.29.7v5.18c0 .26.1.52.3.7l2.35 2.36c.2.2.5.2.7 0l2.36-2.36a1 1 0 0 0 .29-.7V9.4a1 1 0 0 0-.3-.7l-2.35-2.36a.5.5 0 0 0-.7 0Z"
                  class=""
                ></path>
                <path
                  fill="#bb5cbe"
                  fill-rule="evenodd"
                  d="M10.95 1.4a1.59 1.59 0 0 1 2.1 0l4.9 4A3.37 3.37 0 0 1 19 8v8c0 1.07-.4 2.06-1.05 2.6l-4.9 4c-.65.53-1.45.53-2.1 0l-4.9-4A3.37 3.37 0 0 1 5 16V8c0-1.07.4-2.06 1.05-2.6l4.9-4ZM7.32 6.95 12 3.12l4.68 3.83c.07.06.32.4.32 1.05v8c0 .65-.25 1-.32 1.05L12 20.88l-4.68-3.83C7.25 16.99 7 16.65 7 16V8c0-.65.25-1 .32-1.05Z"
                  clip-rule="evenodd"
                  class=""
                ></path>
              </svg>
              Nâng cấp máy chủ này
            </button>
          </div>
        </div>
      </aside>
    </div>
  </main>

  <ModalBootsPayment
    v-model:show="showPaymentBasicModal"
    :amount="dataBasic.amount"
    :content="dataBasic.content"
    :gemsRequired="dataBasic.gemsRequired"
    :bootsId="dataBasic.bootsId"
  />
</template>
