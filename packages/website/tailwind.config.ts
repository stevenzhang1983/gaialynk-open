import type { Config } from "tailwindcss";

/** RGB triplets from design-tokens/colors.css — 支持 opacity 修饰符 */
const rgb = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: "var(--font-family-body)",
        display: "var(--font-family-display)",
      },
      fontSize: {
        caption: [
          "var(--text-caption)",
          { lineHeight: "var(--leading-caption)" },
        ],
        secondary: [
          "var(--text-secondary)",
          { lineHeight: "var(--leading-body)" },
        ],
        body: [
          "var(--text-body)",
          { lineHeight: "var(--leading-body)" },
        ],
        "body-lg": [
          "var(--text-body-lg)",
          { lineHeight: "var(--leading-body-relaxed)" },
        ],
        subheading: [
          "var(--text-subheading)",
          { lineHeight: "var(--leading-subheading)" },
        ],
        h3: ["var(--text-h3)", { lineHeight: "var(--leading-snug)" }],
        h2: ["var(--text-h2)", { lineHeight: "var(--leading-snug)" }],
        h1: ["var(--text-h1)", { lineHeight: "var(--leading-tight)" }],
        hero: [
          "var(--text-hero)",
          {
            lineHeight: "var(--leading-tight)",
            letterSpacing: "var(--tracking-display)",
          },
        ],
      },
      fontWeight: {
        regular: "var(--font-weight-regular)",
        medium: "var(--font-weight-medium)",
        semibold: "var(--font-weight-semibold)",
        bold: "var(--font-weight-bold)",
      },
      letterSpacing: {
        display: "var(--tracking-display)",
        tight: "var(--tracking-tight)",
        wide: "var(--tracking-wide)",
      },
      lineHeight: {
        hero: "var(--leading-hero)",
        "body-relaxed": "var(--leading-body-relaxed)",
      },
      colors: {
        background: rgb("--color-background"),
        "background-subtle": rgb("--color-background-subtle"),
        foreground: rgb("--color-foreground"),
        "foreground-secondary": rgb("--color-foreground-secondary"),
        "muted-foreground": rgb("--color-muted-foreground"),
        muted: rgb("--color-muted-surface"),
        surface: rgb("--color-surface"),
        "surface-raised": rgb("--color-surface-raised"),
        "surface-overlay": rgb("--color-surface-overlay"),
        card: rgb("--color-card"),
        "card-foreground": rgb("--color-card-foreground"),
        border: rgb("--color-border"),
        "border-strong": rgb("--color-border-strong"),
        "border-subtle": rgb("--color-border-subtle"),
        primary: rgb("--color-primary"),
        "primary-foreground": rgb("--color-primary-foreground"),
        secondary: rgb("--color-secondary"),
        "secondary-foreground": rgb("--color-secondary-foreground"),
        accent: rgb("--color-accent"),
        "accent-foreground": rgb("--color-accent-foreground"),
        success: rgb("--color-success"),
        "success-foreground": rgb("--color-success-foreground"),
        warning: rgb("--color-warning"),
        "warning-foreground": rgb("--color-warning-foreground"),
        destructive: rgb("--color-destructive"),
        "destructive-foreground": rgb("--color-destructive-foreground"),
        info: rgb("--color-info"),
        "info-foreground": rgb("--color-info-foreground"),
        ring: rgb("--color-ring"),
        input: rgb("--color-input"),
        "input-background": rgb("--color-input-background"),
      },
      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      boxShadow: {
        "brand-sm": "var(--shadow-brand-sm)",
        "brand-md": "var(--shadow-brand-md)",
        "brand-glow": "var(--shadow-brand-glow)",
        card: "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
        elevated: "var(--shadow-elevated)",
      },
    },
  },
  plugins: [],
};

export default config;
