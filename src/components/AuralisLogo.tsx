import logo from "@/assets/auralis-mark.png";

interface AuralisLogoProps {
  size?: number;
  className?: string;
}

const AuralisLogo = ({ size = 40, className = "" }: AuralisLogoProps) => (
  <img src={logo} width={size} height={size} alt="Auralis" className={`object-contain ${className}`} />
);

export default AuralisLogo;
