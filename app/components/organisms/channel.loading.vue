<template>
  <div class="channel-page flex h-full bg-gray-900">
    <!-- Main Chat Area -->
    <div class="flex-1 flex flex-col">
      <!-- Channel Header Skeleton -->
      <div
        class="channel-header flex items-center px-4 py-3 bg-gray-800 border-b border-gray-700 sticky top-0 z-10"
      >
        <div class="flex items-center space-x-2">
          <div class="w-5 h-5 bg-gray-700 rounded"></div>
          <div class="h-6 bg-gray-700 rounded w-32"></div>
        </div>
        <div class="ml-auto flex items-center space-x-3">
          <div class="w-8 h-8 bg-gray-700 rounded"></div>
          <div class="w-8 h-8 bg-gray-700 rounded"></div>
          <div class="w-8 h-8 bg-gray-700 rounded"></div>
        </div>
      </div>

      <!-- Messages Container -->
      <div class="flex-1 flex flex-col justify-end min-h-0 bg-gray-900 p-4">
        <!-- Loading Messages -->
        <div class="space-y-4">
          <div v-for="n in 5" :key="n" class="flex space-x-3 animate-pulse">
            <div class="w-10 h-10 bg-gray-700 rounded-full flex-shrink-0"></div>
            <div class="flex-1 space-y-2">
              <div class="flex items-center space-x-2">
                <div class="h-4 bg-gray-700 rounded w-20"></div>
                <div class="h-3 bg-gray-700 rounded w-16"></div>
              </div>
              <div class="h-4 bg-gray-700 rounded w-full"></div>
              <div class="h-4 bg-gray-700 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Message Input Skeleton -->
      <div class="message-input-area p-4">
        <div class="bg-gray-800 rounded-lg p-3">
          <div class="h-10 bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>

    <!-- Members Panel Skeleton -->
    <div class="w-80 border-l border-gray-700 bg-gray-800 p-4">
      <div class="flex items-center justify-between mb-6">
        <div class="h-6 bg-gray-700 rounded w-32"></div>
        <div class="w-6 h-6 bg-gray-700 rounded"></div>
      </div>
      <div class="space-y-3">
        <div
          v-for="n in 8"
          :key="n"
          class="flex items-center space-x-3 animate-pulse"
        >
          <div class="w-8 h-8 bg-gray-700 rounded-full"></div>
          <div class="h-4 bg-gray-700 rounded w-20"></div>
        </div>
      </div>
    </div>
  </div>
</template>
