// Polyfills for simple-peer
if (typeof window !== "undefined") {
  if (!window.global) {
    window.global = globalThis;
  }

  if (!window.process) {
    window.process = {
      nextTick: (fn: Function) => setTimeout(fn, 0),
      env: {},
      version: "",
      platform: "browser",
    } as any;
  }
}
