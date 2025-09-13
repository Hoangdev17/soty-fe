<script setup lang="ts">
interface Props {
  banner?: string;
  name: string;
}

const props = withDefaults(defineProps<Props>(), {
  banner: undefined,
});

const defaultColors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-red-500",
  "bg-yellow-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-cyan-500",
];

const randomColor = computed(() => {
  const hash = props.name.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);
  return defaultColors[Math.abs(hash) % defaultColors.length];
});
</script>

<template>
  <div
    v-if="banner"
    class="w-full h-48 md:h-64 bg-cover bg-center rounded-lg"
    :style="{ backgroundImage: `url(${banner})` }"
  />
  <div
    v-else
    class="w-full h-48 md:h-64 rounded-lg flex items-center justify-center text-white text-4xl font-bold"
    :class="randomColor"
  ></div>
</template>
