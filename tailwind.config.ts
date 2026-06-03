import type { Config } from "tailwindcss";
import { join } from "path";

const ROOT = process.cwd();

const config: Config = {
  darkMode: ["class"],
  content: [
    join(ROOT, "pages/**/*.{js,ts,jsx,tsx,mdx}"),
    join(ROOT, "components/**/*.{js,ts,jsx,tsx,mdx}"),
    join(ROOT, "app/**/*.{js,ts,jsx,tsx,mdx}"),
    join(ROOT, "lib/**/*.{js,ts,jsx,tsx}"),
  ],
  safelist: [
    { pattern: /^lg:/ },
    { pattern: /^md:/ },
    { pattern: /^sm:/ },
    { pattern: /^xl:/ },
    { pattern: /^2xl:/ },
    "lg:flex", "lg:hidden", "lg:ml-64", "lg:pb-0", "lg:col-span-2",
    "lg:grid-cols-3", "lg:grid-cols-4", "lg:grid-cols-5", "lg:p-8",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // Bold saturated palette
        blue: {
          50:  "#E8F0FE",
          100: "#C2D4FC",
          200: "#8EAFF9",
          300: "#5589F5",
          400: "#2B6EF0",
          500: "#1A73E8", // Google blue
          600: "#1557B0",
          700: "#0D3F80",
          800: "#082A58",
          900: "#041830",
        },
        pink: {
          50:  "#FFE4F0",
          100: "#FFB3D4",
          200: "#FF80B5",
          300: "#FF4D96",
          400: "#FF1A7A",
          500: "#FF006E", // Hot magenta-pink
          600: "#CC0058",
          700: "#990042",
          800: "#66002C",
          900: "#330016",
        },
        coral: {
          50:  "#FFF0EB",
          100: "#FFD5C2",
          200: "#FFB099",
          300: "#FF8A6F",
          400: "#FF6B35", // Vivid coral
          500: "#FF5722",
          600: "#E64A19",
          700: "#BF360C",
          800: "#8A2500",
          900: "#4E1500",
        },
        yellow: {
          50:  "#FFFDE7",
          100: "#FFF9C4",
          200: "#FFF176",
          300: "#FFEE58",
          400: "#FFEB3B",
          500: "#FFD60A", // Electric yellow
          600: "#F9A825",
          700: "#F57F17",
          800: "#E65100",
          900: "#BF360C",
        },
        teal: {
          50:  "#E0F7FA",
          100: "#B2EBF2",
          200: "#80DEEA",
          300: "#4DD0E1",
          400: "#26C6DA",
          500: "#00BCD4",
          600: "#0097A7",
          700: "#00838F",
          800: "#006064",
          900: "#004D40",
        },
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-ring": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        "slide-up": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        shimmer: "shimmer 2s linear infinite",
        "pulse-ring": "pulse-ring 2s ease-in-out infinite",
        "slide-up": "slide-up 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
      },
      backgroundImage: {
        "blue-gradient": "linear-gradient(135deg, #1A73E8 0%, #5589F5 100%)",
        "pink-gradient": "linear-gradient(135deg, #FF006E 0%, #FF4D96 100%)",
        "coral-gradient": "linear-gradient(135deg, #FF5722 0%, #FF8A6F 100%)",
        "yellow-gradient": "linear-gradient(135deg, #FFD60A 0%, #FFF176 100%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
