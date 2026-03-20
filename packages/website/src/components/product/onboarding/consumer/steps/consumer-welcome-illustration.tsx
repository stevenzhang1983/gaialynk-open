/**
 * T-4.7 欢迎步配图：抽象「Agent 帮你完成任务」场景（纯 SVG，无外链）。
 */
export function ConsumerWelcomeIllustration() {
  return (
    <div className="text-primary">
      <svg viewBox="0 0 400 240" className="mx-auto h-auto w-full max-w-md" aria-hidden role="img">
        <rect x="8" y="8" width="384" height="224" rx="20" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" />
        <circle cx="200" cy="100" r="44" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="2" />
        <path
          d="M185 95c4-8 26-8 30 0 3 6-2 14-15 14s-18-8-15-14z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="192" cy="92" r="4" fill="currentColor" />
        <circle cx="208" cy="92" r="4" fill="currentColor" />
        <rect x="48" y="152" width="96" height="56" rx="8" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1" />
        <path d="M60 168h72M60 180h48M60 192h60" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
        <rect x="256" y="152" width="96" height="56" rx="8" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
        <path
          d="M268 172l16 16 32-32"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="mt-2 text-center text-xs text-muted-foreground">Agents route, execute, and leave receipts</p>
    </div>
  );
}
