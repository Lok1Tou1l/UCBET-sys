import type { Config } from "tailwindcss";

// Palette, fonts, shadows and keyframes mirror feature/progres-frontend (progres-modules/tailwind.config.js),
// so classes such as bg-brand-600 / text-navy-900 / shadow-card behave identically across the repo.
// Semantic tokens (primary, surface, ink, ...) read CSS variables from globals.css: re-theme there only.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "Cairo", "ui-sans-serif", "system-ui", "sans-serif"],
        arabic: ["Cairo", '"Plus Jakarta Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        navy: {
          50: "#eef2fb", 100: "#d9e1f5", 200: "#b3c3ea", 300: "#7f97d6", 400: "#4d6bbd",
          500: "#2f4a9c", 600: "#22397d", 700: "#1a2a63", 800: "#121f4d", 900: "#0c1538", 950: "#080e28",
        },
        brand: {
          50: "#eff6ff", 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd", 400: "#60a5fa",
          500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8", 800: "#1e40af", 900: "#1e3a8a",
        },
        primary: { DEFAULT: token("primary"), fg: token("primary-fg"), soft: token("primary-soft") },
        surface: { DEFAULT: token("surface"), muted: token("surface-muted") },
        ink: { DEFAULT: token("ink"), muted: token("ink-muted") },
        line: token("line"),
        success: token("success"),
        warning: token("warning"),
        danger: token("danger"),
        sidebar: token("sidebar"),
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,.04), 0 4px 16px -4px rgba(15,23,42,.06)",
        pop: "0 12px 40px -8px rgba(15,23,42,.25)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "scale-in": { from: { opacity: "0", transform: "scale(.96)" }, to: { opacity: "1", transform: "scale(1)" } },
        "toast-in": { from: { opacity: "0", transform: "translateY(-8px) scale(.98)" }, to: { opacity: "1", transform: "translateY(0) scale(1)" } },
        "slide-up": { from: { opacity: "0", transform: "translateY(10px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "slide-in-start": { from: { transform: "translateX(-100%)" }, to: { transform: "translateX(0)" } },
        "slide-in-end": { from: { transform: "translateX(100%)" }, to: { transform: "translateX(0)" } },
      },
      animation: {
        "fade-in": "fade-in .2s ease-out both",
        "scale-in": "scale-in .18s ease-out both",
        "toast-in": "toast-in .25s ease-out both",
        "slide-up": "slide-up .35s cubic-bezier(.2,.7,.2,1) both",
        "slide-in-start": "slide-in-start .25s ease-out both",
        "slide-in-end": "slide-in-end .25s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
