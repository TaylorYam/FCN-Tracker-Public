import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#e8dcc4",
          surface: "#faf5ea",
          elevated: "#d3bf99",
        },
        text: {
          primary: "#2b2418",
          secondary: "#5a4f3c",
          muted: "#6f6450",
        },
        accent: {
          green: "#5b6b24",
          blue: "#136b66",
          amber: "#8a5e0a",
          red: "#b14724",
          purple: "#7c3a5d",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Inter",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
