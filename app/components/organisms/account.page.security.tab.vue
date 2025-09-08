<template>
  <div class="pt-1 flex items-start gap-y-4 gap-x-12 p-4 mb-12 w-full">
    <!-- Form Section -->
    <div class="flex flex-col items-start gap-y-4 w-full max-w-md">
      <UFormField label="Email" class="w-full">
        <UInput class="w-full" placeholder="Email" />
      </UFormField>
      <USeparator class="w-full" />

      <UFormField label="Password" class="w-full">
        <UInput class="w-full" placeholder="Password" />
      </UFormField>
      <USeparator class="w-full" />

      <UFormField label="Phone" class="w-full">
        <UInput class="w-full" placeholder="Phone" />
      </UFormField>
      <USeparator class="w-full" />

      <div class="flex items-center justify-between w-full">
        <span class="font-semibold text-gray-900 dark:text-white"
          >App verification</span
        >
        <USwitch />
      </div>

      <div class="flex items-center justify-between w-full">
        <span class="font-semibold text-gray-900 dark:text-white"
          >Verify code</span
        >
        <USwitch />
      </div>

      <USeparator class="w-full" />
    </div>
  </div>
</template>
