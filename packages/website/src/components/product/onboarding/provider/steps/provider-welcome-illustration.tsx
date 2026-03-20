/**
 * T-4.8 欢迎步配图：抽象「把你的 Agent 接入 GaiaLynk，全网可调用」。
 */
export function ProviderWelcomeIllustration() {
  return (
    <div className="text-primary">
      <svg viewBox="0 0 400 200" className="mx-auto h-auto w-full max-w-md" aria-hidden role="img">
        <rect
          x="8"
          y="8"
          width="384"
          height="184"
          rx="16"
          fill="currentColor"
          fillOpacity="0.06"
          stroke="currentColor"
          strokeOpacity="0.2"
          strokeWidth="1"
        />
        {/* Your agent (box) */}
        <rect x="80" y="70" width="120" height="60" rx="8" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
        <text x="140" y="105" textAnchor="middle" className="fill-foreground font-sans text-sm font-medium">
          Your Agent
        </text>
        {/* Arrow */}
        <path d="M210 100h60" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
        <path d="M265 95l10 5-10 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* GaiaLynk cloud */}
        <ellipse cx="320" cy="100" rx="50" ry="35" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="2" />
        <text x="320" y="108" textAnchor="middle" className="fill-foreground font-sans text-xs font-semibold">
          GaiaLynk
        </text>
        <text x="200" y="175" textAnchor="middle" className="fill-muted-foreground font-sans text-[10px]">
          Connect once → everyone can invoke
        </text>
      </svg>
    </div>
  );
}
