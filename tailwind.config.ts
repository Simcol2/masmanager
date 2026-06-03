import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
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
        // Luxury Gold Palette
        gold: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#D4AF37", // Classic gold
          600: "#B8860B", // Dark goldenrod
          700: "#A67C00",
          800: "#8B6914",
          900: "#7C5800",
          950: "#4A3500",
        },
        // Deep navy palette
        void: {
          50:  "#F0F4FF",
          100: "#D6E4FF",
          200: "#ADC8FF",
          300: "#84A9FF",
          400: "#6690F5",
          500: "#4D75D9",
          600: "#3A5BAD",
          700: "#284480",
          800: "#1E3A5F",
          900: "#142847",
          950: "#0D1B2E", // Deepest navy
        },
        // Carnival palette
        carnival: {
          pink:   "#FF6B9D",
          coral:  "#FF8C69",
          teal:   "#00D4B8",
          yellow: "#FFD700",
          purple: "#9B5DE5",
          lime:   "#80FF44",
        },
        // Saturated accents
        crimson: "#DC143C",
        emerald: "#10B981",
        royal: "#6D28D9",
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
        "gold-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
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
        "gold-pulse": "gold-pulse 2s ease-in-out infinite",
        "slide-up": "slide-up 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #D4AF37 0%, #FCD34D 50%, #B8860B 100%)",
        "gold-shine": "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
        "void-gradient": "linear-gradient(180deg, #0A0A0C 0%, #1A1A1F 100%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
