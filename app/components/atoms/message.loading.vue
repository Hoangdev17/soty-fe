<template>
  <div class="message-loading p-3 rounded bg-dark-600 mb-2 animate-pulse">
    <div class="flex">
      <div class="mr-3">
        <USkeleton class="w-10 h-10 rounded-full bg-dark-500" />
      </div>
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-2">
          <USkeleton class="h-4 w-20 bg-dark-500" />
          <USkeleton class="h-3 w-12 bg-dark-500" />
        </div>
        <div class="space-y-2">
          <USkeleton class="h-4 w-full bg-dark-500" />
          <USkeleton class="h-4 w-3/4 bg-dark-500" />
        </div>
      </div>
    </div>
  </div>
</template>
