import React from "react";

interface AuralisLogoProps {
  size?: number;
  className?: string;
}

const AuralisLogo = ({ size = 40, className = "" }: AuralisLogoProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main "A" shape - Purple */}
      <path
        d="M50 8L85 88H70L60 65H40L30 88H15L50 8Z"
        fill="hsl(300, 60%, 35%)"
      />
      {/* Inner triangle cutout */}
      <path
        d="M50 35L58 52H42L50 35Z"
        fill="hsl(0, 0%, 5%)"
      />
      {/* Pink accent on bottom left - like a music note tail */}
      <path
        d="M15 88L25 68L35 88H15Z"
        fill="hsl(310, 100%, 65%)"
      />
      {/* Texture dots */}
      <circle cx="45" cy="45" r="1.5" fill="hsl(0, 0%, 5%)" />
      <circle cx="55" cy="50" r="1.5" fill="hsl(0, 0%, 5%)" />
      <circle cx="52" cy="60" r="1.5" fill="hsl(0, 0%, 5%)" />
      <circle cx="65" cy="70" r="1.5" fill="hsl(0, 0%, 5%)" />
      <circle cx="38" cy="55" r="1.5" fill="hsl(0, 0%, 5%)" />
      <circle cx="60" cy="75" r="1.5" fill="hsl(0, 0%, 5%)" />
    </svg>
  );
};

export default AuralisLogo;
