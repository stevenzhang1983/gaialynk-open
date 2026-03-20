import {
  Noto_Sans_SC,
  Noto_Sans_TC,
  Plus_Jakarta_Sans,
  Syne,
} from "next/font/google";

/**
 * 英文展示：Hero / H1–H3，有力量感、与正文明晰区分
 */
export const fontDisplay = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
  adjustFontFallback: true,
  /** T-6.4：首屏 Hero/H1 使用展示字体，预加载降低 FOUT */
  preload: true,
});

/**
 * 英文正文 / UI：人文主义无衬线，非 Inter/Roboto
 */
export const fontBody = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
  adjustFontFallback: true,
  /** T-6.4：正文 UI 与首屏副标题共用，预加载稳定首屏排版 */
  preload: true,
});

/**
 * 简体中文：Noto Sans SC（思源黑体同源体系）
 * preload: false — 不抢占首屏，swap 避免 FOIT，满足「字体加载不阻塞 FCP」
 */
export const fontNotoSansSC = Noto_Sans_SC({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-noto-sc",
  display: "swap",
  adjustFontFallback: true,
  preload: false,
});

/**
 * 繁体中文：Noto Sans TC
 */
export const fontNotoSansTC = Noto_Sans_TC({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-noto-tc",
  display: "swap",
  adjustFontFallback: true,
  preload: false,
});

/** 挂到 <html>，供 CSS var 与 Tailwind 使用 */
export const gaiaFontVariables = [
  fontDisplay.variable,
  fontBody.variable,
  fontNotoSansSC.variable,
  fontNotoSansTC.variable,
].join(" ");
