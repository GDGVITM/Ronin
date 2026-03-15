import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ghost: {
          bg: "#0b0b0f",
          panel: "#14141c",
          gold: "#f5c542",
          green: "#2ecc71",
          red: "#e74c3c",
        },
      },
    },
  },
  plugins: [],
};

export default config;
