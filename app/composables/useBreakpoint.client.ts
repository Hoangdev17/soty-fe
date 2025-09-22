import { ref, computed, onMounted, onUnmounted, readonly } from 'vue'

export const useBreakpoint = () => {
  const screenWidth = ref(0)

  const updateScreenWidth = () => {
    screenWidth.value = window.innerWidth
  }

  onMounted(() => {
    updateScreenWidth()
    window.addEventListener('resize', updateScreenWidth)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateScreenWidth)
  })

  const isMobile = computed(() => screenWidth.value < 768)
  const isTablet = computed(() => screenWidth.value >= 768 && screenWidth.value < 1024)
  const isDesktop = computed(() => screenWidth.value >= 1024)

  const currentBreakpoint = computed(() => {
    if (isMobile.value) return 'mobile'
    if (isTablet.value) return 'tablet'
    return 'desktop'
  })

  return {
    screenWidth: readonly(screenWidth),
    isMobile,
    isTablet,
    isDesktop,
    currentBreakpoint
  }
}