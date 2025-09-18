<template>
  <div class="w-6 h-6 flex items-center justify-center flex-shrink-0">
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        :fill="finalColor"
        stroke="currentColor"
        stroke-width="1"
        class="text-gray-600"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
interface Props {
  color?: string;
  roleId?: string; // Use roleId for consistent random colors
}

const props = withDefaults(defineProps<Props>(), {
  color: "",
  roleId: "",
});

// Random color palette for roles
const colorPalette = [
  "#e74c3c", // Red
  "#3498db", // Blue
  "#2ecc71", // Green
  "#f39c12", // Orange
  "#9b59b6", // Purple
  "#1abc9c", // Teal
  "#e67e22", // Dark Orange
  "#34495e", // Dark Blue Gray
  "#f1c40f", // Yellow
  "#e91e63", // Pink
  "#795548", // Brown
  "#607d8b", // Blue Gray
  "#ff5722", // Deep Orange
  "#8bc34a", // Light Green
  "#00bcd4", // Cyan
  "#ff9800", // Amber
];

// Generate consistent random color based on roleId
const getRandomColor = (id: string): string => {
  if (!id) return colorPalette[0]!;

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % colorPalette.length;
  return colorPalette[index]!;
};

const finalColor = computed(() => {
  return props.color || getRandomColor(props.roleId);
});
</script>
