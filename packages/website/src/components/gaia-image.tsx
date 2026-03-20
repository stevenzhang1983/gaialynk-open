import NextImage, { type ImageProps } from "next/image";

type GaiaImageProps = ImageProps & {
  alt: string;
};

/**
 * T-6.4：官网/产品营销区图片统一入口 — 使用 `next/image`，现代格式由 `next.config` 的 `images.formats` 控制（WebP/AVIF）。
 * 在 LCP 图片上请传 `priority` 与合理的 `sizes`。
 */
export function GaiaImage({ quality = 85, ...props }: GaiaImageProps) {
  return <NextImage quality={quality} {...props} />;
}
