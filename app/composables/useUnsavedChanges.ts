export const useUnsavedChanges = () => {
  const hasUnsavedChanges = ref(false);
  const changeMessage = ref("You have unsaved changes!");

  // Warning before page unload
  const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
    if (hasUnsavedChanges.value) {
      event.preventDefault();
      return changeMessage.value;
    }
  };

  // Setup beforeunload listener
  const setupWarning = () => {
    if (import.meta.client) {
      window.addEventListener("beforeunload", beforeUnloadHandler);
    }
  };

  // Cleanup beforeunload listener
  const cleanupWarning = () => {
    if (import.meta.client) {
      window.removeEventListener("beforeunload", beforeUnloadHandler);
    }
  };

  // Set unsaved changes state
  const setUnsavedChanges = (value: boolean, message?: string) => {
    hasUnsavedChanges.value = value;
    if (message) {
      changeMessage.value = message;
    }
  };

  // Auto setup/cleanup on component lifecycle
  onMounted(() => {
    setupWarning();
  });

  onUnmounted(() => {
    cleanupWarning();
  });

  return {
    hasUnsavedChanges: readonly(hasUnsavedChanges),
    changeMessage: readonly(changeMessage),
    setUnsavedChanges,
    setupWarning,
    cleanupWarning,
  };
};
