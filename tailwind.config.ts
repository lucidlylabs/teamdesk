import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#f4f1ea",
        paper: "#0a0a0f",
        accent: "#ff3b30",
        moss: "#3a5a40",
        mist: "#a3b18a",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Inter", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      keyframes: {
        ringPulse: {
          "0%": { boxShadow: "0 0 0 0 rgba(255,59,48,0.7)" },
          "70%": { boxShadow: "0 0 0 14px rgba(255,59,48,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(255,59,48,0)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        ringPulse: "ringPulse 1.6s ease-out infinite",
        fadeUp: "fadeUp 280ms ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
