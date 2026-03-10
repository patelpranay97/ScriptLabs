import iconImg from "@assets/IMG_7546_1773122756611.png";

export function ScriptLabsLogo({ iconSize = 32, className = "" }: { iconSize?: number; className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img src={iconImg} alt="ScriptLabs icon" style={{ width: iconSize, height: iconSize }} />
      <span className="font-bold tracking-tight" style={{ fontSize: iconSize * 0.75 }}>
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
