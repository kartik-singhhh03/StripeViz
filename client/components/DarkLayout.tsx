import React from "react";

interface DarkLayoutProps {
  children: React.ReactNode;
  showSmog?: boolean;
}

export function DarkLayout({ children, showSmog = true }: DarkLayoutProps) {
  return (
    <div className="relative bg-[var(--bg-base)]">
      {/* Decorative container - clips overflow to prevent scroll beyond content */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Glow Orbs */}
        <div className="glow-orb w-[800px] h-[800px] bg-purple-600/30 top-[-20%] left-[20%]" />
        <div className="glow-orb w-[600px] h-[600px] bg-violet-500/20 bottom-[-20%] right-[20%]" />

        {/* Purple Smog Animation */}
        {showSmog && (
          <div className="smog-container">
            <div className="smog-orb smog-orb-1" />
            <div className="smog-orb smog-orb-2" />
            <div className="smog-orb smog-orb-3" />
            <div className="smog-orb smog-orb-4" />
          </div>
        )}

        {/* Grid Background */}
        <div className="absolute inset-0 grid-bg" />
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default DarkLayout;
