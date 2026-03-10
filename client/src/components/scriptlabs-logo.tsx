function ScriptLabsIcon({ size = 32 }: { size?: number }) {
  const id = "sl-grad";
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6C35FF" />
          <stop offset="100%" stopColor="#D030E8" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="9" fill={`url(#${id})`} />
      <circle cx="28.5" cy="11" r="2.5" fill="white" />
      <path
        d="M26 9.5 L30.5 9.5 L14.5 23.5 L8 23.5 L8 20.5 L13 20.5 Z"
        fill="white"
      />
      <path
        d="M32 16.5 L32 20.5 L27 20.5 L14 31.5 L9.5 31.5 L9.5 28.5 L13 28.5 Z"
        fill="white"
      />
    </svg>
  );
}

export function ScriptLabsLogo({ iconSize = 32, className = "" }: { iconSize?: number; className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <ScriptLabsIcon size={iconSize} />
      <span className="font-bold tracking-tight" style={{ fontSize: iconSize * 0.56 }}>
        <span style={{ color: "#1a0a4d" }}>Script</span>
        <span
          style={{
            background: "linear-gradient(90deg, #7B2FFF 0%, #FF2ACA 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Labs
        </span>
      </span>
    </div>
  );
}

export { ScriptLabsIcon };
