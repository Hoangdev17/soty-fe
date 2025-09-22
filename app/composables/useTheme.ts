import { ref, watch } from "vue";

type Theme = "light" | "dark";

const STORAGE_KEY = "soty:theme";

export function useTheme() {
  const systemPrefersDark =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const saved =
    typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
  const theme = ref<Theme>(
    (saved as Theme) || (systemPrefersDark ? "dark" : "light")
  );

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    if (t === "dark") {
      root.classList.add("theme-dark");
      root.classList.remove("theme-light");
      // Prefer Nuxt UI dark vars if present, otherwise fallback
      const nuxtDarkBg = getComputedStyle(root)
        .getPropertyValue("--nuxt-ui-bg")
        .trim();
      const nuxtDarkFg = getComputedStyle(root)
        .getPropertyValue("--nuxt-ui-foreground")
        .trim();
      root.style.setProperty("--ui-bg", nuxtDarkBg || "#0f1724");
      root.style.setProperty("--ui-foreground", nuxtDarkFg || "#e6e6e6");
    } else {
      root.classList.add("theme-light");
      root.classList.remove("theme-dark");
      const nuxtLightBg = getComputedStyle(root)
        .getPropertyValue("--nuxt-ui-bg-light")
        .trim();
      const nuxtLightFg = getComputedStyle(root)
        .getPropertyValue("--nuxt-ui-foreground-light")
        .trim();
      root.style.setProperty("--ui-bg", nuxtLightBg || "#ffffff");
      root.style.setProperty("--ui-foreground", nuxtLightFg || "#0f0f0f");
    }
  };

  // initial apply
  if (typeof window !== "undefined") applyTheme(theme.value);

  watch(theme, (newVal) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, newVal);
    applyTheme(newVal);
  });

  const toggle = () => {
    theme.value = theme.value === "dark" ? "light" : "dark";
  };

  return { theme, toggle };
}
