/**
 * W-22：桌面 Connector 安装包分发；可通过环境变量覆盖为实际 GitHub Releases 地址。
 */
export const DESKTOP_CONNECTOR_RELEASES_URL =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_DESKTOP_CONNECTOR_RELEASES_URL
    ? process.env.NEXT_PUBLIC_DESKTOP_CONNECTOR_RELEASES_URL
    : "https://github.com/GaiaLynk/gaialynk-A2A/releases";

/** 最近心跳窗口：超过则 UI 显示「离线/已断开」 */
export const DESKTOP_DEVICE_ONLINE_MS = 120_000;
