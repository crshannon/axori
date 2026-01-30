// Polyfills for browser compatibility
// This file is imported at the top of __root.tsx

// Ensure global is available (some libraries expect it)
if (typeof window !== "undefined") {
  const win = window as unknown as { global?: typeof globalThis };
  if (!win.global) {
    win.global = globalThis;
  }
}
